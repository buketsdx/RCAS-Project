-- RCAS Project: Security Hardening Script
-- This script fixes common security warnings found in the Supabase linter.

-- 1. Fix Mutable Search Path for Functions
-- This prevents potential security risks where a malicious user could hijack function calls.
ALTER FUNCTION public.is_company_owner(UUID) SET search_path = public;
ALTER FUNCTION public.seed_company_defaults(UUID) SET search_path = public;

-- 2. Fix Overly Permissive RLS Policies (Always True)
-- These tables had 'Allow authenticated access' set to 'true', which is too broad.
-- We are replacing them with policies that restrict data to the company owner.

-- Function to safely recreate policies
DO $$ 
DECLARE 
    t TEXT;
    tables TEXT[] := ARRAY[
        'account_groups', 'bank_reconciliations', 'bookings', 'branches', 
        'companies', 'cost_centers', 'currencies', 'custody_transactions', 
        'custody_wallets', 'employees', 'flower_waste', 'godowns', 
        'ledgers', 'payments', 'payrolls', 'salary_components', 
        'stock_groups', 'stock_items', 'units', 'voucher_items', 
        'voucher_ledger_entries', 'voucher_types', 'vouchers'
    ];
BEGIN 
    FOREACH t IN ARRAY tables LOOP
        -- Drop the broad policy if it exists
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated access" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own companies" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Access by company ownership" ON %I', t);
    END LOOP;
END $$;

-- Apply Specific, Secure Policies

-- 1. User Profiles: Users can only manage their own profile
DROP POLICY IF EXISTS "Allow authenticated access" ON public.user_profiles;
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (id = auth.uid());

-- 2. Subscription Keys: 
-- - Admin (you) can do anything
-- - Users can only read keys they have used/activated

-- Migration check for subscription_keys
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_keys' AND column_name='used_by') THEN
        ALTER TABLE subscription_keys ADD COLUMN used_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

DROP POLICY IF EXISTS "Allow authenticated access" ON public.subscription_keys;
DROP POLICY IF EXISTS "Users can read their own used keys" ON public.subscription_keys;
CREATE POLICY "Users can read their own used keys" ON public.subscription_keys
    FOR SELECT USING (used_by = auth.uid());
-- Note: Admin access is usually handled by a separate role or email check, 
-- but for now, we restrict standard users to their own data.

-- 3. Companies: User can only see companies they are assigned to via user_id
CREATE POLICY "Users can manage their own companies" ON public.companies
    FOR ALL USING (user_id = auth.uid());

-- All other tables: Access is granted only if the user owns the company the record belongs to
CREATE POLICY "Access by company ownership" ON public.account_groups FOR ALL USING (is_company_owner(company_id));
CREATE POLICY "Access by company ownership" ON public.branches FOR ALL USING (is_company_owner(company_id));
CREATE POLICY "Access by company ownership" ON public.ledgers FOR ALL USING (is_company_owner(company_id));
CREATE POLICY "Access by company ownership" ON public.stock_groups FOR ALL USING (is_company_owner(company_id));
CREATE POLICY "Access by company ownership" ON public.units FOR ALL USING (is_company_owner(company_id));
CREATE POLICY "Access by company ownership" ON public.godowns FOR ALL USING (is_company_owner(company_id));
CREATE POLICY "Access by company ownership" ON public.stock_items FOR ALL USING (is_company_owner(company_id));
CREATE POLICY "Access by company ownership" ON public.voucher_types FOR ALL USING (is_company_owner(company_id));
CREATE POLICY "Access by company ownership" ON public.vouchers FOR ALL USING (is_company_owner(company_id));

-- Tables that link to vouchers instead of companies directly
DROP POLICY IF EXISTS "Access by voucher ownership" ON public.voucher_items;
CREATE POLICY "Access by voucher ownership" ON public.voucher_items 
    FOR ALL USING (EXISTS (SELECT 1 FROM vouchers WHERE id = voucher_id AND is_company_owner(company_id)));

DROP POLICY IF EXISTS "Access by voucher ownership" ON public.voucher_ledger_entries;
CREATE POLICY "Access by voucher ownership" ON public.voucher_ledger_entries 
    FOR ALL USING (EXISTS (SELECT 1 FROM vouchers WHERE id = voucher_id AND is_company_owner(company_id)));

-- 3. Additional Security Recommendations (Informational)
-- - Enable "Leaked Password Protection" in Supabase Dashboard -> Auth -> Settings.
-- - Enable "Email Confirmations" for new signups to prevent fake accounts.
-- - Ensure all tables have RLS enabled (this script assumes it is already enabled from full_schema.sql).
