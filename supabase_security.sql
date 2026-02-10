-- Secure Database: Enable RLS and Restrict Access to Authenticated Users (Safe Version)
-- This script fixes the "RLS Disabled in Public" security warnings.
-- It now checks if a table exists before trying to secure it, preventing errors.

-- Helper macro to enable RLS and add basic authenticated-only policy
CREATE OR REPLACE PROCEDURE secure_table(target_table_name text)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if table exists in public schema
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = target_table_name
    ) THEN
        -- 1. Enable Row Level Security
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', target_table_name);

        -- 2. Drop existing policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated access" ON %I', target_table_name);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public read" ON %I', target_table_name);

        -- 3. Create Policy: Allow FULL access to Authenticated users
        EXECUTE format('CREATE POLICY "Allow authenticated access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', target_table_name);
        
        RAISE NOTICE 'Secured table: %', target_table_name;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping.', target_table_name;
    END IF;
END;
$$;

-- Apply security to all potential tables
-- Core Entities
CALL secure_table('companies');
CALL secure_table('branches');
CALL secure_table('currencies');
CALL secure_table('ledgers');
CALL secure_table('user_profiles');
CALL secure_table('profiles');
CALL secure_table('account_groups');
CALL secure_table('cost_centers');

-- Inventory & Stock
CALL secure_table('stock_items');
CALL secure_table('stock_groups');
CALL secure_table('units');
CALL secure_table('godowns');
CALL secure_table('waste_records');
CALL secure_table('flower_waste'); -- Specific table reported in errors

-- Transactions & Vouchers
CALL secure_table('vouchers');
CALL secure_table('voucher_items');
CALL secure_table('voucher_ledger_entries');
CALL secure_table('voucher_types');
CALL secure_table('branch_daily_records');
CALL secure_table('zatca_invoices');
CALL secure_table('custody_transactions');
CALL secure_table('custody_wallets');
CALL secure_table('bank_reconciliations');

-- HR & Payroll
CALL secure_table('employees');
CALL secure_table('payroll');
CALL secure_table('payrolls'); -- Plural form reported in errors
CALL secure_table('salary_components');
CALL secure_table('employee_salary_structures');

-- Settings & System
CALL secure_table('settings');
CALL secure_table('id_counters');
CALL secure_table('payments');
CALL secure_table('subscription_keys');
CALL secure_table('bookings'); -- Reported in errors

-- Clean up helper
DROP PROCEDURE secure_table;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
