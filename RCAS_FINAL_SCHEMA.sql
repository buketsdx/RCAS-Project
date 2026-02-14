-- =============================================================================
-- RCAS PROJECT: COMPREHENSIVE FINAL SQL SCHEMA
-- =============================================================================
-- This is the complete, consolidated schema for the RCAS (Retail & Corporate
-- Accounting System) project. It includes all tables, relationships, indexes,
-- and Row Level Security (RLS) policies based on company ownership model.
--
-- Version: Final
-- Date: 2026
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SECTION 1: CORE USER & AUTHENTICATION
-- =============================================================================

-- PROFILES: Extends Supabase Auth Users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'owner', 'manager', 'cashier', 'user')),
    allowed_companies TEXT[],  -- Array of company IDs for multi-company access
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- COMPANIES: Primary business entities owned by users
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,  -- Owner/creator
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
    password TEXT,  -- Company-level access password
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BRANCHES: Multiple branches per company
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_arabic TEXT,
    code TEXT,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    manager_name TEXT,
    is_main BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Permanently Closed', 'Temporarily Closed', 'Holiday')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 2: ACCOUNTING - CHART OF ACCOUNTS
-- =============================================================================

-- ACCOUNT GROUPS: Hierarchical account classification
CREATE TABLE IF NOT EXISTS account_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES account_groups(id),
    name TEXT NOT NULL,
    name_arabic TEXT,
    nature TEXT CHECK (nature IN ('Assets', 'Liabilities', 'Income', 'Expenses', 'Capital')),
    is_primary BOOLEAN DEFAULT false,
    affects_gross_profit BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- LEDGERS: Individual accounts
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
    address_proof TEXT,
    credit_limit DECIMAL(15,2),
    credit_days INTEGER,
    bank_name TEXT,
    bank_account_number TEXT,
    iban TEXT,
    is_active BOOLEAN DEFAULT true,
    customer_type TEXT DEFAULT 'General' CHECK (customer_type IN ('VAT Customer', 'General')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- COST CENTERS: For cost allocation
CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES cost_centers(id),
    name TEXT NOT NULL,
    name_arabic TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 3: INVENTORY MANAGEMENT
-- =============================================================================

-- STOCK GROUPS: Product categories
CREATE TABLE IF NOT EXISTS stock_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES stock_groups(id),
    name TEXT NOT NULL,
    name_arabic TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- UNITS: Measurement units
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbol TEXT,
    formal_name TEXT,
    is_simple BOOLEAN DEFAULT true,
    base_unit_id UUID REFERENCES units(id),
    conversion_factor DECIMAL(10,4) DEFAULT 1,
    decimal_places INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- GODOWNS: Warehouses/locations
CREATE TABLE IF NOT EXISTS godowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_godown_id UUID REFERENCES godowns(id),
    name TEXT NOT NULL,
    name_arabic TEXT,
    address TEXT,
    contact_person TEXT,
    phone TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- STOCK ITEMS: Products/items
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    group_id UUID REFERENCES stock_groups(id),
    unit_id UUID REFERENCES units(id),
    alternate_unit_id UUID REFERENCES units(id),
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
    mrp DECIMAL(15,2),
    reorder_level DECIMAL(10,2) DEFAULT 0,
    minimum_qty DECIMAL(10,2),
    maximum_qty DECIMAL(10,2),
    conversion_factor DECIMAL(10,4) DEFAULT 1,
    vat_rate DECIMAL(5,2) DEFAULT 15,
    hsn_code TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 4: VOUCHERS & TRANSACTIONS
-- =============================================================================

-- VOUCHER TYPES: Types of vouchers
CREATE TABLE IF NOT EXISTS voucher_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_type TEXT CHECK (parent_type IN ('Sales', 'Purchase', 'Receipt', 'Payment', 'Contra', 'Journal', 'Credit Note', 'Debit Note', 'Sales Order', 'Purchase Order', 'Delivery Note', 'Receipt Note')),
    abbreviation TEXT,
    numbering_method TEXT DEFAULT 'Automatic' CHECK (numbering_method IN ('Automatic', 'Manual')),
    starting_number INTEGER DEFAULT 1,
    prefix TEXT,
    suffix TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- VOUCHERS: Main transaction records
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    voucher_type_id UUID REFERENCES voucher_types(id),
    voucher_type TEXT CHECK (voucher_type IN ('Sales', 'Purchase', 'Receipt', 'Payment', 'Contra', 'Journal', 'Credit Note', 'Debit Note', 'Sales Order', 'Purchase Order', 'Delivery Note', 'Receipt Note', 'Stock Increase', 'Stock Decrease')),
    voucher_number TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT,
    reference_date DATE,
    party_ledger_id UUID REFERENCES ledgers(id),
    party_name TEXT,
    narration TEXT,
    gross_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) DEFAULT 0,
    amount_in_words TEXT,
    status TEXT DEFAULT 'Confirmed' CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
    is_posted BOOLEAN DEFAULT true,
    billing_address TEXT,
    shipping_address TEXT,
    payment_terms TEXT,
    due_date DATE,
    customer_vat_number TEXT,
    customer_business_name TEXT,
    customer_cr_number TEXT,
    customer_address_proof TEXT,
    customer_type TEXT CHECK (customer_type IN ('VAT Customer', 'General')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- VOUCHER ITEMS: Line items in vouchers (inventory details)
CREATE TABLE IF NOT EXISTS voucher_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES stock_items(id),
    godown_id UUID REFERENCES godowns(id),
    description TEXT,
    quantity DECIMAL(15,2) DEFAULT 1,
    unit TEXT,
    rate DECIMAL(15,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    amount DECIMAL(15,2) DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 15,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- VOUCHER LEDGER ENTRIES: Accounting entries (debit/credit)
CREATE TABLE IF NOT EXISTS voucher_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    ledger_id UUID REFERENCES ledgers(id),
    ledger_name TEXT,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    narration TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 5: PAYROLL & HR
-- =============================================================================

-- EMPLOYEES: Staff records
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_code TEXT,
    name TEXT NOT NULL,
    name_arabic TEXT,
    designation TEXT,
    department TEXT,
    date_of_joining DATE,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    nationality TEXT,
    iqama_number TEXT,
    passport_number TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    housing_allowance DECIMAL(15,2) DEFAULT 0,
    transport_allowance DECIMAL(15,2) DEFAULT 0,
    other_allowances DECIMAL(15,2) DEFAULT 0,
    gosi_number TEXT,
    bank_name TEXT,
    bank_account TEXT,
    iban TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- SALARY COMPONENTS: Earning/deduction types
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_arabic TEXT,
    type TEXT NOT NULL CHECK (type IN ('Earning', 'Deduction')),
    calculation_type TEXT CHECK (calculation_type IN ('Fixed', 'Percentage of Basic', 'Percentage of Gross', 'Formula', 'Days Based')),
    default_value DECIMAL(15,2),
    percentage DECIMAL(5,2),
    formula TEXT,
    is_taxable BOOLEAN DEFAULT false,
    affects_gosi BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- EMPLOYEE SALARY STRUCTURE: Individual employee salary config
CREATE TABLE IF NOT EXISTS employee_salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    component_id UUID REFERENCES salary_components(id) ON DELETE CASCADE,
    component_name TEXT,
    type TEXT CHECK (type IN ('Earning', 'Deduction')),
    calculation_type TEXT,
    amount DECIMAL(15,2) DEFAULT 0,
    percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PAYROLL: Payroll processing records
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    payroll_code TEXT,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    working_days INTEGER,
    present_days INTEGER,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    housing_allowance DECIMAL(15,2) DEFAULT 0,
    transport_allowance DECIMAL(15,2) DEFAULT 0,
    other_allowances DECIMAL(15,2) DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    overtime_amount DECIMAL(15,2) DEFAULT 0,
    gross_salary DECIMAL(15,2) DEFAULT 0,
    gosi_employee DECIMAL(15,2) DEFAULT 0,
    gosi_employer DECIMAL(15,2) DEFAULT 0,
    loan_deduction DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_salary DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Processed', 'Paid')),
    payment_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 6: CUSTODY & EXPENSE MANAGEMENT
-- =============================================================================

-- CUSTODY WALLETS: Employee/imprest accounts
CREATE TABLE IF NOT EXISTS custody_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    wallet_id TEXT UNIQUE,
    name TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    holder_type TEXT CHECK (holder_type IN ('Employee', 'Agent', 'Partner', 'Other')),
    balance DECIMAL(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'SAR',
    purpose TEXT,
    contact_phone TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CUSTODY TRANSACTIONS: Wallet transactions
CREATE TABLE IF NOT EXISTS custody_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES custody_wallets(id) ON DELETE CASCADE,
    transaction_id TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('Deposit', 'Withdrawal', 'Transfer')),
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    reference TEXT,
    description TEXT,
    transfer_to_wallet_id UUID REFERENCES custody_wallets(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- WASTE RECORDS: Inventory waste tracking (flower waste, etc.)
CREATE TABLE IF NOT EXISTS waste_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    waste_id TEXT UNIQUE,
    date DATE NOT NULL,
    branch_id UUID REFERENCES branches(id),
    stock_item_id UUID REFERENCES stock_items(id),
    stock_item_name TEXT,
    quantity DECIMAL(15,2) NOT NULL,
    unit TEXT,
    waste_reason TEXT CHECK (waste_reason IN ('Expired', 'Damaged', 'Wilted', 'Pest Infestation', 'Storage Issue', 'Transportation Damage', 'Customer Return', 'Other')),
    cost_value DECIMAL(15,2) DEFAULT 0,
    disposal_method TEXT CHECK (disposal_method IN ('Composting', 'Disposal', 'Donation', 'Recycling')),
    recorded_by TEXT,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 7: BANKING & RECONCILIATION
-- =============================================================================

-- BANK RECONCILIATIONS: Bank statement reconciliation
CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    bank_ledger_id UUID REFERENCES ledgers(id),
    voucher_id UUID REFERENCES vouchers(id),
    voucher_date DATE,
    voucher_number TEXT,
    voucher_type TEXT,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('Deposit', 'Withdrawal')),
    cheque_number TEXT,
    cheque_date DATE,
    bank_date DATE,
    is_reconciled BOOLEAN DEFAULT false,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 8: ZATCA COMPLIANCE (Saudi Arabia)
-- =============================================================================

-- ZATCA INVOICES: ZATCA e-invoice compliance
CREATE TABLE IF NOT EXISTS zatca_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    voucher_id UUID REFERENCES vouchers(id),
    invoice_uuid TEXT,
    invoice_hash TEXT,
    previous_hash TEXT,
    qr_code TEXT,
    submission_status TEXT DEFAULT 'Pending' CHECK (submission_status IN ('Pending', 'Submitted', 'Accepted', 'Rejected', 'Cleared')),
    submission_date TIMESTAMPTZ,
    zatca_response TEXT,
    clearance_status TEXT,
    warning_messages TEXT,
    error_messages TEXT,
    xml_content TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 9: BRANCH DAILY OPERATIONS
-- =============================================================================

-- BRANCH DAILY RECORDS: Daily closing records
CREATE TABLE IF NOT EXISTS branch_daily_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_cash DECIMAL(15,2) DEFAULT 0,
    closing_cash_actual DECIMAL(15,2) DEFAULT 0,
    closing_cash_system DECIMAL(15,2) DEFAULT 0,
    difference DECIMAL(15,2) DEFAULT 0,
    deposited_by TEXT,
    cash_sales DECIMAL(15,2) DEFAULT 0,
    cash_received DECIMAL(15,2) DEFAULT 0,
    expenses DECIMAL(15,2) DEFAULT 0,
    drawings DECIMAL(15,2) DEFAULT 0,
    purchases DECIMAL(15,2) DEFAULT 0,
    employee_expenses DECIMAL(15,2) DEFAULT 0,
    bank_transfer DECIMAL(15,2) DEFAULT 0,
    mada_pos DECIMAL(15,2) DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0,
    online_order_sales DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    notes TEXT,
    opened_by TEXT,
    closed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 10: BOOKINGS (If used)
-- =============================================================================

-- BOOKINGS: Customer/service bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    service_type TEXT,
    booking_date DATE,
    booking_time TIME,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 11: SYSTEM & UTILITIES
-- =============================================================================

-- CURRENCIES: Currency definitions
CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT,
    symbol TEXT,
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    decimal_places INTEGER DEFAULT 2,
    is_base_currency BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- SETTINGS: Company settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    category TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ID COUNTERS: Auto-numbering
CREATE TABLE IF NOT EXISTS id_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    prefix TEXT,
    last_number BIGINT DEFAULT 0,
    padding INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, entity_type)
);

-- =============================================================================
-- SECTION 12: SUBSCRIPTION & PAYMENTS
-- =============================================================================

-- SUBSCRIPTION KEYS: License key management
CREATE TABLE IF NOT EXISTS subscription_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_code TEXT UNIQUE NOT NULL,
    plan_type TEXT NOT NULL DEFAULT 'premium' CHECK (plan_type IN ('free', 'premium', 'lifetime')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked')),
    product_id TEXT,
    duration_days INTEGER,
    claimed_by UUID REFERENCES auth.users(id),
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENTS: Payment records
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES companies(id),
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT DEFAULT 'SAR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- SECTION 13: DATABASE FUNCTIONS
-- =============================================================================

-- Helper function to check company ownership
CREATE OR REPLACE FUNCTION is_company_owner(company_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM companies 
        WHERE id = company_uuid 
        AND user_id = auth.uid()
    );
$$;

-- Helper function to check company ownership via voucher
CREATE OR REPLACE FUNCTION is_voucher_company_owner(voucher_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM vouchers v
        WHERE v.id = voucher_uuid
        AND EXISTS (
            SELECT 1 FROM companies c
            WHERE c.id = v.company_id
            AND c.user_id = auth.uid()
        )
    );
$$;

-- Generate license key function
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    chars TEXT[] := ARRAY['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
    result TEXT := 'RCAS-';
    i INT;
BEGIN
    FOR i IN 1..4 LOOP
        result := result || chars[1 + floor(random() * 28)::int];
    END LOOP;
    result := result || '-';
    FOR i IN 1..4 LOOP
        result := result || chars[1 + floor(random() * 28)::int];
    END LOOP;
    RETURN result;
END;
$$;

-- Claim subscription key function
CREATE OR REPLACE FUNCTION claim_subscription_key(input_key TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    key_record RECORD;
    user_id_val UUID;
BEGIN
    user_id_val := auth.uid();
    IF user_id_val IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not authenticated');
    END IF;
    
    SELECT * INTO key_record 
    FROM subscription_keys 
    WHERE key_code = input_key AND status = 'active'
    FOR UPDATE;
    
    IF key_record.id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Invalid or expired key');
    END IF;
    
    UPDATE subscription_keys
    SET status = 'used', claimed_by = user_id_val, claimed_at = CURRENT_TIMESTAMP
    WHERE id = key_record.id;
    
    RETURN json_build_object('success', true, 'message', 'Key activated successfully', 'plan', key_record.plan_type);
END;
$$;

-- Process mock payment function
CREATE OR REPLACE FUNCTION process_mock_payment(payment_amount NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id_val UUID;
    new_payment_id UUID;
    new_key TEXT;
    key_exists BOOLEAN;
BEGIN
    user_id_val := auth.uid();
    IF user_id_val IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not authenticated');
    END IF;
    
    INSERT INTO payments (user_id, amount, status, provider_id)
    VALUES (user_id_val, payment_amount, 'completed', 'mock_provider_' || floor(random()*100000)::text)
    RETURNING id INTO new_payment_id;
    
    LOOP
        new_key := generate_license_key();
        SELECT EXISTS(SELECT 1 FROM subscription_keys WHERE key_code = new_key) INTO key_exists;
        IF NOT key_exists THEN EXIT; END IF;
    END LOOP;
    
    INSERT INTO subscription_keys (key_code, plan_type, status, claimed_by, claimed_at)
    VALUES (new_key, 'premium', 'used', user_id_val, CURRENT_TIMESTAMP);
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Payment successful! Key generated.',
        'key', new_key,
        'payment_id', new_payment_id
    );
END;
$$;

-- Seed company defaults function
CREATE OR REPLACE FUNCTION seed_company_defaults(target_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    assets_id UUID;
    liabilities_id UUID;
    income_id UUID;
    expenses_id UUID;
    current_assets_id UUID;
    current_liabilities_id UUID;
    cash_hand_id UUID;
    bank_acc_id UUID;
BEGIN
    -- Primary Account Groups
    INSERT INTO account_groups (company_id, name, nature, is_primary) 
    VALUES (target_company_id, 'Assets', 'Assets', true) RETURNING id INTO assets_id;
    INSERT INTO account_groups (company_id, name, nature, is_primary) 
    VALUES (target_company_id, 'Liabilities', 'Liabilities', true) RETURNING id INTO liabilities_id;
    INSERT INTO account_groups (company_id, name, nature, is_primary) 
    VALUES (target_company_id, 'Income', 'Income', true) RETURNING id INTO income_id;
    INSERT INTO account_groups (company_id, name, nature, is_primary) 
    VALUES (target_company_id, 'Expenses', 'Expenses', true) RETURNING id INTO expenses_id;
    
    -- Sub-groups
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Fixed Assets', assets_id, 'Assets');
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Current Assets', assets_id, 'Assets') RETURNING id INTO current_assets_id;
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Cash-in-Hand', current_assets_id, 'Assets') RETURNING id INTO cash_hand_id;
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Bank Accounts', current_assets_id, 'Assets') RETURNING id INTO bank_acc_id;
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Sundry Debtors', current_assets_id, 'Assets');
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Current Liabilities', liabilities_id, 'Liabilities') RETURNING id INTO current_liabilities_id;
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Sundry Creditors', current_liabilities_id, 'Liabilities');
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Duties & Taxes', current_liabilities_id, 'Liabilities');
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Capital Account', liabilities_id, 'Liabilities');
    
    -- Default Ledgers
    INSERT INTO ledgers (company_id, name, group_id, is_system) 
    VALUES (target_company_id, 'Cash', cash_hand_id, true);
    INSERT INTO ledgers (company_id, name, group_id, is_system) 
    VALUES (target_company_id, 'Profit & Loss A/c', NULL, true);
    
    -- Default Units
    INSERT INTO units (company_id, name, symbol, formal_name) VALUES
    (target_company_id, 'Pieces', 'Pcs', 'Pieces'),
    (target_company_id, 'Numbers', 'Nos', 'Numbers'),
    (target_company_id, 'Kilogram', 'Kg', 'Kilogram');
    
    -- Default Godown
    INSERT INTO godowns (company_id, name, is_primary) VALUES
    (target_company_id, 'Main Location', true);
    
    -- Default Stock Group
    INSERT INTO stock_groups (company_id, name) VALUES
    (target_company_id, 'General');
    
    -- Voucher Types
    INSERT INTO voucher_types (company_id, name, parent_type, abbreviation) VALUES
    (target_company_id, 'Sales', 'Sales', 'Sales'),
    (target_company_id, 'Purchase', 'Purchase', 'Purc'),
    (target_company_id, 'Payment', 'Payment', 'Pay'),
    (target_company_id, 'Receipt', 'Receipt', 'Rcpt'),
    (target_company_id, 'Contra', 'Contra', 'Cont'),
    (target_company_id, 'Journal', 'Journal', 'Jour'),
    (target_company_id, 'Credit Note', 'Credit Note', 'C/N'),
    (target_company_id, 'Debit Note', 'Debit Note', 'D/N');
    
    -- Default Currency
    INSERT INTO currencies (code, name, symbol, exchange_rate, is_base_currency) VALUES
    ('SAR', 'Saudi Riyal', 'ر.س', 1, true),
    ('USD', 'US Dollar', '$', 3.75, false),
    ('EUR', 'Euro', '€', 4.05, false);
END;
$$;

-- Trigger function for new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'user'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SECTION 14: TRIGGERS
-- =============================================================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- SECTION 15: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE godowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zatca_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- PROFILES: Users manage their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles
    FOR ALL USING (id = auth.uid());

-- COMPANIES: User owns their companies
DROP POLICY IF EXISTS "Users own their companies" ON companies;
CREATE POLICY "Users own their companies" ON companies
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- BRANCHES: Access by company ownership
DROP POLICY IF EXISTS "Access branches by company ownership" ON branches;
CREATE POLICY "Access branches by company ownership" ON branches
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- ACCOUNT GROUPS: Access by company ownership
DROP POLICY IF EXISTS "Access account_groups by company ownership" ON account_groups;
CREATE POLICY "Access account_groups by company ownership" ON account_groups
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- LEDGERS: Access by company ownership
DROP POLICY IF EXISTS "Access ledgers by company ownership" ON ledgers;
CREATE POLICY "Access ledgers by company ownership" ON ledgers
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- COST CENTERS: Access by company ownership
DROP POLICY IF EXISTS "Access cost_centers by company ownership" ON cost_centers;
CREATE POLICY "Access cost_centers by company ownership" ON cost_centers
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- STOCK GROUPS: Access by company ownership
DROP POLICY IF EXISTS "Access stock_groups by company ownership" ON stock_groups;
CREATE POLICY "Access stock_groups by company ownership" ON stock_groups
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- UNITS: Access by company ownership
DROP POLICY IF EXISTS "Access units by company ownership" ON units;
CREATE POLICY "Access units by company ownership" ON units
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- GODOWNS: Access by company ownership
DROP POLICY IF EXISTS "Access godowns by company ownership" ON godowns;
CREATE POLICY "Access godowns by company ownership" ON godowns
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- STOCK ITEMS: Access by company ownership
DROP POLICY IF EXISTS "Access stock_items by company ownership" ON stock_items;
CREATE POLICY "Access stock_items by company ownership" ON stock_items
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- VOUCHER TYPES: Access by company ownership
DROP POLICY IF EXISTS "Access voucher_types by company ownership" ON voucher_types;
CREATE POLICY "Access voucher_types by company ownership" ON voucher_types
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- VOUCHERS: Access by company ownership
DROP POLICY IF EXISTS "Access vouchers by company ownership" ON vouchers;
CREATE POLICY "Access vouchers by company ownership" ON vouchers
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- VOUCHER ITEMS: Access via voucher ownership
DROP POLICY IF EXISTS "Access voucher_items by voucher ownership" ON voucher_items;
CREATE POLICY "Access voucher_items by voucher ownership" ON voucher_items
    FOR ALL TO authenticated
    USING (is_voucher_company_owner(voucher_id))
    WITH CHECK (is_voucher_company_owner(voucher_id));

-- VOUCHER LEDGER ENTRIES: Access via voucher ownership
DROP POLICY IF EXISTS "Access voucher_ledger_entries by voucher ownership" ON voucher_ledger_entries;
CREATE POLICY "Access voucher_ledger_entries by voucher ownership" ON voucher_ledger_entries
    FOR ALL TO authenticated
    USING (is_voucher_company_owner(voucher_id))
    WITH CHECK (is_voucher_company_owner(voucher_id));

-- EMPLOYEES: Access by company ownership
DROP POLICY IF EXISTS "Access employees by company ownership" ON employees;
CREATE POLICY "Access employees by company ownership" ON employees
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- SALARY COMPONENTS: Access by company ownership
DROP POLICY IF EXISTS "Access salary_components by company ownership" ON salary_components;
CREATE POLICY "Access salary_components by company ownership" ON salary_components
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- EMPLOYEE SALARY STRUCTURES: Access by company ownership
DROP POLICY IF EXISTS "Access employee_salary_structures by company ownership" ON employee_salary_structures;
CREATE POLICY "Access employee_salary_structures by company ownership" ON employee_salary_structures
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- PAYROLL: Access by company ownership
DROP POLICY IF EXISTS "Access payroll by company ownership" ON payroll;
CREATE POLICY "Access payroll by company ownership" ON payroll
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- CUSTODY WALLETS: Access by company ownership
DROP POLICY IF EXISTS "Access custody_wallets by company ownership" ON custody_wallets;
CREATE POLICY "Access custody_wallets by company ownership" ON custody_wallets
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- CUSTODY TRANSACTIONS: Access by company ownership
DROP POLICY IF EXISTS "Access custody_transactions by company ownership" ON custody_transactions;
CREATE POLICY "Access custody_transactions by company ownership" ON custody_transactions
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- WASTE RECORDS: Access by company ownership
DROP POLICY IF EXISTS "Access waste_records by company ownership" ON waste_records;
CREATE POLICY "Access waste_records by company ownership" ON waste_records
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- BANK RECONCILIATIONS: Access by company ownership
DROP POLICY IF EXISTS "Access bank_reconciliations by company ownership" ON bank_reconciliations;
CREATE POLICY "Access bank_reconciliations by company ownership" ON bank_reconciliations
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- ZATCA INVOICES: Access by company ownership
DROP POLICY IF EXISTS "Access zatca_invoices by company ownership" ON zatca_invoices;
CREATE POLICY "Access zatca_invoices by company ownership" ON zatca_invoices
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- BRANCH DAILY RECORDS: Access by company ownership
DROP POLICY IF EXISTS "Access branch_daily_records by company ownership" ON branch_daily_records;
CREATE POLICY "Access branch_daily_records by company ownership" ON branch_daily_records
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- BOOKINGS: Access by company ownership
DROP POLICY IF EXISTS "Access bookings by company ownership" ON bookings;
CREATE POLICY "Access bookings by company ownership" ON bookings
    FOR ALL TO authenticated
    USING (is_company_owner(company_id))
    WITH CHECK (is_company_owner(company_id));

-- CURRENCIES: Admin only for write, all authenticated for read
DROP POLICY IF EXISTS "Read currencies" ON currencies;
CREATE POLICY "Read currencies" ON currencies
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage currencies" ON currencies;
CREATE POLICY "Admin manage currencies" ON currencies
    FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' = 'admin@rcas.com' OR auth.role() = 'service_role');

-- SETTINGS: Access by company ownership
DROP POLICY IF EXISTS "Access settings by company ownership" ON settings;
CREATE POLICY "Access settings by company ownership" ON settings
    FOR ALL TO authenticated
    USING (company_id IS NOT NULL AND is_company_owner(company_id))
    WITH CHECK (company_id IS NOT NULL AND is_company_owner(company_id));

-- ID COUNTERS: Access by company ownership
DROP POLICY IF EXISTS "Access id_counters by company ownership" ON id_counters;
CREATE POLICY "Access id_counters by company ownership" ON id_counters
    FOR ALL TO authenticated
    USING (company_id IS NOT NULL AND is_company_owner(company_id))
    WITH CHECK (company_id IS NOT NULL AND is_company_owner(company_id));

-- SUBSCRIPTION KEYS: Users see their own keys, service role sees all
DROP POLICY IF EXISTS "Users view own subscription keys" ON subscription_keys;
CREATE POLICY "Users view own subscription keys" ON subscription_keys
    FOR SELECT TO authenticated
    USING (claimed_by = auth.uid());

DROP POLICY IF EXISTS "Service role full access to subscription_keys" ON subscription_keys;
CREATE POLICY "Service role full access to subscription_keys" ON subscription_keys
    FOR ALL TO service_role USING (true);

-- PAYMENTS: Users see their own payments, company owners see company payments
DROP POLICY IF EXISTS "Access payments by user or company" ON payments;
CREATE POLICY "Access payments by user or company" ON payments
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR (company_id IS NOT NULL AND is_company_owner(company_id)))
    WITH CHECK (user_id = auth.uid() OR (company_id IS NOT NULL AND is_company_owner(company_id)));

-- =============================================================================
-- SECTION 16: INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_account_groups_company ON account_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_account_groups_parent ON account_groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_ledgers_company ON ledgers(company_id);
CREATE INDEX IF NOT EXISTS idx_ledgers_group ON ledgers(group_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_company ON cost_centers(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_groups_company ON stock_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_groups_parent ON stock_groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_units_company ON units(company_id);
CREATE INDEX IF NOT EXISTS idx_godowns_company ON godowns(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_company ON stock_items(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_group ON stock_items(group_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_barcode ON stock_items(barcode);
CREATE INDEX IF NOT EXISTS idx_voucher_types_company ON voucher_types(company_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_company ON vouchers(company_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_branch ON vouchers(branch_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(voucher_type);
CREATE INDEX IF NOT EXISTS idx_voucher_items_voucher ON voucher_items(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_items_stock ON voucher_items(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_voucher_ledger_entries_voucher ON voucher_ledger_entries(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_ledger_entries_ledger ON voucher_ledger_entries(ledger_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_components_company ON salary_components(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_salary_structures_employee ON employee_salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_company ON payroll(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(year, month);
CREATE INDEX IF NOT EXISTS idx_custody_wallets_company ON custody_wallets(company_id);
CREATE INDEX IF NOT EXISTS idx_custody_transactions_wallet ON custody_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_waste_records_company ON waste_records(company_id);
CREATE INDEX IF NOT EXISTS idx_waste_records_date ON waste_records(date);
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_company ON bank_reconciliations(company_id);
CREATE INDEX IF NOT EXISTS idx_zatca_invoices_company ON zatca_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_zatca_invoices_voucher ON zatca_invoices(voucher_id);
CREATE INDEX IF NOT EXISTS idx_branch_daily_records_company ON branch_daily_records(company_id);
CREATE INDEX IF NOT EXISTS idx_branch_daily_records_branch ON branch_daily_records(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_daily_records_date ON branch_daily_records(date);
CREATE INDEX IF NOT EXISTS idx_bookings_company ON bookings(company_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_settings_company ON settings(company_id);
CREATE INDEX IF NOT EXISTS idx_id_counters_company ON id_counters(company_id);
CREATE INDEX IF NOT EXISTS idx_subscription_keys_claimed ON subscription_keys(claimed_by);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);

-- =============================================================================
-- SEED DATA (Optional - for testing)
-- =============================================================================

-- Insert default subscription keys (for testing)
INSERT INTO subscription_keys (key_code, plan_type, status, duration_days) VALUES
    ('RCAS-PRO-2024', 'premium', 'active', 365),
    ('PREMIUM-KEY-123', 'premium', 'active', 365),
    ('RCAS-LIFETIME', 'premium', 'active', NULL)
ON CONFLICT (key_code) DO NOTHING;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
