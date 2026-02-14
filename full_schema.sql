-- RCAS Project: Comprehensive SQL Schema
-- This schema covers companies, accounting, inventory, payroll, and security.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------------------------------------------
-- 1. COMPANIES AND CORE SETUP
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    name_arabic TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Saudi Arabia',
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    business_type TEXT DEFAULT 'Retail',
    vat_number TEXT,
    cr_number TEXT,
    financial_year_start DATE,
    financial_year_end DATE,
    currency TEXT DEFAULT 'SAR',
    logo_url TEXT,
    password TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure user_id column exists if table was created by an older script
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='user_id') THEN
        ALTER TABLE companies ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='name_arabic') THEN
        ALTER TABLE companies ADD COLUMN name_arabic TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='currency') THEN
        ALTER TABLE companies ADD COLUMN currency TEXT DEFAULT 'SAR';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_arabic TEXT,
    code TEXT,
    address TEXT,
    phone TEXT,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='name_arabic') THEN
        ALTER TABLE branches ADD COLUMN name_arabic TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branches' AND column_name='is_main') THEN
        ALTER TABLE branches ADD COLUMN is_main BOOLEAN DEFAULT false;
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2. ACCOUNTING: GROUPS AND LEDGERS
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS account_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_arabic TEXT,
    parent_id UUID REFERENCES account_groups(id),
    nature TEXT CHECK (nature IN ('Assets', 'Liabilities', 'Income', 'Expenses')),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='account_groups' AND column_name='name_arabic') THEN
        ALTER TABLE account_groups ADD COLUMN name_arabic TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='account_groups' AND column_name='is_system') THEN
        ALTER TABLE account_groups ADD COLUMN is_system BOOLEAN DEFAULT false;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    group_id UUID REFERENCES account_groups(id),
    name TEXT NOT NULL,
    name_arabic TEXT,
    is_system BOOLEAN DEFAULT false,
    opening_balance DECIMAL(15,2) DEFAULT 0,
    opening_balance_type TEXT CHECK (opening_balance_type IN ('Dr', 'Cr')),
    current_balance DECIMAL(15,2) DEFAULT 0,
    balance_type TEXT CHECK (balance_type IN ('Dr', 'Cr')),
    contact_person TEXT,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    vat_number TEXT,
    business_name TEXT,
    cr_number TEXT,
    credit_limit DECIMAL(15,2),
    credit_days INTEGER,
    bank_name TEXT,
    bank_account_number TEXT,
    iban TEXT,
    is_active BOOLEAN DEFAULT true,
    customer_type TEXT DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ledgers' AND column_name='name_arabic') THEN
        ALTER TABLE ledgers ADD COLUMN name_arabic TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ledgers' AND column_name='is_system') THEN
        ALTER TABLE ledgers ADD COLUMN is_system BOOLEAN DEFAULT false;
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 3. INVENTORY: GROUPS, UNITS, ITEMS
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stock_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_arabic TEXT,
    parent_id UUID REFERENCES stock_groups(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_groups' AND column_name='name_arabic') THEN
        ALTER TABLE stock_groups ADD COLUMN name_arabic TEXT;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbol TEXT,
    formal_name TEXT,
    decimal_places INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS godowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    group_id UUID REFERENCES stock_groups(id),
    unit_id UUID REFERENCES units(id),
    name TEXT NOT NULL,
    name_arabic TEXT,
    alias TEXT,
    part_number TEXT,
    barcode TEXT,
    opening_qty DECIMAL(15,2) DEFAULT 0,
    opening_rate DECIMAL(15,2) DEFAULT 0,
    opening_value DECIMAL(15,2) DEFAULT 0,
    current_qty DECIMAL(15,2) DEFAULT 0,
    current_value DECIMAL(15,2) DEFAULT 0,
    cost_price DECIMAL(15,2),
    selling_price DECIMAL(15,2),
    vat_rate DECIMAL(5,2) DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_items' AND column_name='name_arabic') THEN
        ALTER TABLE stock_items ADD COLUMN name_arabic TEXT;
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 4. VOUCHERS AND TRANSACTIONS
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS voucher_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_type TEXT,
    abbreviation TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    voucher_type_id UUID REFERENCES voucher_types(id),
    voucher_number TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT,
    party_ledger_id UUID REFERENCES ledgers(id),
    party_name TEXT,
    narration TEXT,
    gross_amount DECIMAL(15,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Confirmed',
    is_posted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='branch_id') THEN
        ALTER TABLE vouchers ADD COLUMN branch_id UUID REFERENCES branches(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vouchers' AND column_name='voucher_type_id') THEN
        ALTER TABLE vouchers ADD COLUMN voucher_type_id UUID REFERENCES voucher_types(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS voucher_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES stock_items(id),
    godown_id UUID REFERENCES godowns(id),
    qty DECIMAL(15,2) NOT NULL,
    rate DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 15,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voucher_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    ledger_id UUID REFERENCES ledgers(id),
    amount DECIMAL(15,2) NOT NULL,
    entry_type TEXT CHECK (entry_type IN ('Dr', 'Cr')),
    narration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-------------------------------------------------------------------------------
-- 5. SUBSCRIPTIONS AND SECURITY
-------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscription_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_code TEXT UNIQUE NOT NULL,
    product_id TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS POLICIES (COMPREHENSIVE)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE godowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_ledger_entries ENABLE ROW LEVEL SECURITY;

-- 1. Companies: User can access only their own companies
DROP POLICY IF EXISTS "Users can manage their own companies" ON companies;
CREATE POLICY "Users can manage their own companies" ON companies
    FOR ALL USING (user_id = auth.uid());

-- 2. Cascading Access: Users can access data of companies they own
-- We use a helper function to check company ownership for better performance in policies
CREATE OR REPLACE FUNCTION is_company_owner(cid UUID) 
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM companies WHERE id = cid AND user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Access branches by company ownership" ON branches;
CREATE POLICY "Access branches by company ownership" ON branches FOR ALL USING (is_company_owner(company_id));
DROP POLICY IF EXISTS "Access account_groups by company ownership" ON account_groups;
CREATE POLICY "Access account_groups by company ownership" ON account_groups FOR ALL USING (is_company_owner(company_id));
DROP POLICY IF EXISTS "Access ledgers by company ownership" ON ledgers;
CREATE POLICY "Access ledgers by company ownership" ON ledgers FOR ALL USING (is_company_owner(company_id));
DROP POLICY IF EXISTS "Access stock_groups by company ownership" ON stock_groups;
CREATE POLICY "Access stock_groups by company ownership" ON stock_groups FOR ALL USING (is_company_owner(company_id));
DROP POLICY IF EXISTS "Access units by company ownership" ON units;
CREATE POLICY "Access units by company ownership" ON units FOR ALL USING (is_company_owner(company_id));
DROP POLICY IF EXISTS "Access godowns by company ownership" ON godowns;
CREATE POLICY "Access godowns by company ownership" ON godowns FOR ALL USING (is_company_owner(company_id));
DROP POLICY IF EXISTS "Access stock_items by company ownership" ON stock_items;
CREATE POLICY "Access stock_items by company ownership" ON stock_items FOR ALL USING (is_company_owner(company_id));
DROP POLICY IF EXISTS "Access voucher_types by company ownership" ON voucher_types;
CREATE POLICY "Access voucher_types by company ownership" ON voucher_types FOR ALL USING (is_company_owner(company_id));
DROP POLICY IF EXISTS "Access vouchers by company ownership" ON vouchers;
CREATE POLICY "Access vouchers by company ownership" ON vouchers FOR ALL USING (is_company_owner(company_id));

-- 3. Nested Cascading (Voucher Items and Ledger Entries)
DROP POLICY IF EXISTS "Access voucher_items via voucher ownership" ON voucher_items;
CREATE POLICY "Access voucher_items via voucher ownership" ON voucher_items 
    FOR ALL USING (EXISTS (SELECT 1 FROM vouchers WHERE id = voucher_id AND is_company_owner(company_id)));

DROP POLICY IF EXISTS "Access voucher_ledger_entries via voucher ownership" ON voucher_ledger_entries;
CREATE POLICY "Access voucher_ledger_entries via voucher ownership" ON voucher_ledger_entries 
    FOR ALL USING (EXISTS (SELECT 1 FROM vouchers WHERE id = voucher_id AND is_company_owner(company_id)));

-------------------------------------------------------------------------------
-- 6. SEEDING FUNCTION (AS REQUESTED)
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION seed_company_defaults(target_company_id UUID)
RETURNS void AS $$
DECLARE
    assets_id UUID;
    liabilities_id UUID;
    income_id UUID;
    expenses_id UUID;
    cash_hand_id UUID;
BEGIN
    -- Account Groups
    INSERT INTO account_groups (company_id, name, nature, is_system) 
    VALUES (target_company_id, 'Assets', 'Assets', true) RETURNING id INTO assets_id;
    INSERT INTO account_groups (company_id, name, nature, is_system) 
    VALUES (target_company_id, 'Liabilities', 'Liabilities', true) RETURNING id INTO liabilities_id;
    INSERT INTO account_groups (company_id, name, nature, is_system) 
    VALUES (target_company_id, 'Income', 'Income', true) RETURNING id INTO income_id;
    INSERT INTO account_groups (company_id, name, nature, is_system) 
    VALUES (target_company_id, 'Expenses', 'Expenses', true) RETURNING id INTO expenses_id;

    -- Sub-groups (Tally-like Structure)
    -- Assets Sub-groups
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Current Assets', assets_id, 'Assets', true) RETURNING id INTO cash_hand_id;
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Fixed Assets', assets_id, 'Assets', true);
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Bank Accounts', cash_hand_id, 'Assets', true);
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Cash-in-Hand', cash_hand_id, 'Assets', true) RETURNING id INTO cash_hand_id;

    -- Liabilities Sub-groups
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Current Liabilities', liabilities_id, 'Liabilities', true);
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Loans (Liability)', liabilities_id, 'Liabilities', true);
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Capital Account', liabilities_id, 'Liabilities', true);

    -- Income/Expenses Sub-groups
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Direct Incomes', income_id, 'Income', true);
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Indirect Incomes', income_id, 'Income', true);
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Direct Expenses', expenses_id, 'Expenses', true);
    INSERT INTO account_groups (company_id, name, parent_id, nature, is_system) 
    VALUES (target_company_id, 'Indirect Expenses', expenses_id, 'Expenses', true);

    -- Default Ledgers
    INSERT INTO ledgers (company_id, name, group_id, is_system) 
    VALUES (target_company_id, 'Cash', cash_hand_id, true);
    INSERT INTO ledgers (company_id, name, group_id, is_system) 
    VALUES (target_company_id, 'Profit & Loss A/c', NULL, true);

    -- Default Units
    INSERT INTO units (company_id, name, symbol, formal_name) VALUES
    (target_company_id, 'Numbers', 'Nos', 'Numbers'),
    (target_company_id, 'Kilograms', 'Kg', 'Kilograms'),
    (target_company_id, 'Pieces', 'Pcs', 'Pieces');

    -- Voucher Types
    INSERT INTO voucher_types (company_id, name, parent_type, abbreviation) VALUES
    (target_company_id, 'Sales', 'Sales', 'Sales'),
    (target_company_id, 'Purchase', 'Purchase', 'Purc'),
    (target_company_id, 'Payment', 'Payment', 'Pay'),
    (target_company_id, 'Receipt', 'Receipt', 'Rcpt'),
    (target_company_id, 'Contra', 'Contra', 'Cont'),
    (target_company_id, 'Journal', 'Journal', 'Jour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
