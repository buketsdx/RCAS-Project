-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Companies & Settings
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    vat_number TEXT,
    cr_number TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    financial_year_start DATE,
    currency_symbol TEXT DEFAULT 'SAR',
    type TEXT DEFAULT 'General', -- General, Salon, Restaurant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    address TEXT,
    phone TEXT,
    manager_name TEXT,
    is_head_office BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    exchange_rate DECIMAL(10, 4) DEFAULT 1.0,
    is_base BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Management (Public Profile linking to Auth)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'user', -- super_admin, admin, manager, accountant, cashier, user
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Masters - Accounts
CREATE TABLE account_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES account_groups(id),
    nature TEXT, -- Assets, Liabilities, Income, Expenses
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    group_id UUID REFERENCES account_groups(id),
    opening_balance DECIMAL(15, 2) DEFAULT 0,
    opening_balance_type TEXT DEFAULT 'Dr', -- Dr/Cr
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_number TEXT,
    credit_limit DECIMAL(15, 2),
    bank_name TEXT,
    bank_account TEXT,
    iban TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    parent_id UUID REFERENCES cost_centers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Masters - Inventory
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., Kilogram, Pieces
    symbol TEXT NOT NULL, -- e.g., kg, pcs
    decimal_places INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stock_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES stock_groups(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_arabic TEXT,
    alias TEXT,
    part_number TEXT,
    barcode TEXT,
    group_id UUID REFERENCES stock_groups(id),
    unit_id UUID REFERENCES units(id),
    opening_qty DECIMAL(15, 3) DEFAULT 0,
    opening_rate DECIMAL(15, 2) DEFAULT 0,
    cost_price DECIMAL(15, 2) DEFAULT 0,
    selling_price DECIMAL(15, 2) DEFAULT 0,
    mrp DECIMAL(15, 2),
    reorder_level DECIMAL(15, 3),
    vat_rate DECIMAL(5, 2) DEFAULT 15.00,
    hsn_code TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE godowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Voucher Configuration
CREATE TABLE voucher_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Sales, Purchase, Receipt, Payment, etc.
    parent_type TEXT NOT NULL, -- Sales, Purchase, Receipt, Payment, Contra, Journal
    abbreviation TEXT,
    numbering_method TEXT DEFAULT 'Automatic', -- Automatic, Manual
    starting_number INTEGER DEFAULT 1,
    prefix TEXT,
    suffix TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Transactions
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    voucher_type_id UUID REFERENCES voucher_types(id),
    voucher_number TEXT NOT NULL,
    date DATE NOT NULL,
    reference_number TEXT,
    reference_date DATE,
    party_ledger_id UUID REFERENCES ledgers(id),
    party_name TEXT, -- Snapshot in case ledger details change
    narration TEXT,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'Active', -- Active, Cancelled
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE voucher_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    stock_item_id UUID REFERENCES stock_items(id),
    godown_id UUID REFERENCES godowns(id),
    description TEXT,
    quantity DECIMAL(15, 3) NOT NULL,
    rate DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_percent DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE voucher_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE,
    ledger_id UUID REFERENCES ledgers(id),
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    cost_center_id UUID REFERENCES cost_centers(id),
    narration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Payroll
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_code TEXT NOT NULL,
    name TEXT NOT NULL,
    name_arabic TEXT,
    designation TEXT,
    department TEXT,
    date_of_joining DATE,
    date_of_birth DATE,
    gender TEXT,
    nationality TEXT,
    iqama_number TEXT,
    passport_number TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    basic_salary DECIMAL(15, 2) DEFAULT 0,
    housing_allowance DECIMAL(15, 2) DEFAULT 0,
    transport_allowance DECIMAL(15, 2) DEFAULT 0,
    other_allowances DECIMAL(15, 2) DEFAULT 0,
    gosi_number TEXT,
    bank_name TEXT,
    bank_account TEXT,
    iban TEXT,
    is_dual_commission_eligible BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    component_id TEXT,
    name TEXT NOT NULL,
    name_arabic TEXT,
    type TEXT DEFAULT 'Earning', -- Earning, Deduction
    calculation_type TEXT DEFAULT 'Fixed', -- Fixed, Percentage of Basic, etc.
    default_value DECIMAL(15, 2) DEFAULT 0,
    percentage DECIMAL(5, 2) DEFAULT 0,
    formula TEXT,
    is_taxable BOOLEAN DEFAULT FALSE,
    affects_gosi BOOLEAN DEFAULT FALSE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    basic_salary DECIMAL(15, 2) DEFAULT 0,
    housing_allowance DECIMAL(15, 2) DEFAULT 0,
    transport_allowance DECIMAL(15, 2) DEFAULT 0,
    other_allowances DECIMAL(15, 2) DEFAULT 0,
    overtime_amount DECIMAL(15, 2) DEFAULT 0,
    commission_amount DECIMAL(15, 2) DEFAULT 0,
    deductions DECIMAL(15, 2) DEFAULT 0,
    net_salary DECIMAL(15, 2) DEFAULT 0,
    payment_status TEXT DEFAULT 'Pending', -- Pending, Paid
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Special Modules
CREATE TABLE custody_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    holder_name TEXT,
    holder_type TEXT, -- Employee, Partner
    currency TEXT DEFAULT 'SAR',
    purpose TEXT,
    contact_phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE custody_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES custody_wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- Deposit, Withdrawal, Transfer
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    reference TEXT,
    transfer_to_wallet_id UUID, -- For Transfers
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE flower_waste (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    waste_id TEXT,
    date DATE NOT NULL,
    stock_item_id UUID REFERENCES stock_items(id),
    quantity DECIMAL(15, 3) NOT NULL,
    unit TEXT,
    waste_reason TEXT,
    cost_value DECIMAL(15, 2),
    disposal_method TEXT,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT,
    service_type TEXT,
    stylist_id UUID REFERENCES employees(id),
    date DATE NOT NULL,
    time TIME,
    status TEXT DEFAULT 'Waiting', -- Waiting, In Progress, Completed, Cancelled
    payment_status TEXT DEFAULT 'Pending', -- Pending, Paid
    payment_method TEXT,
    amount DECIMAL(15, 2),
    is_group BOOLEAN DEFAULT FALSE,
    primary_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    voucher_id UUID REFERENCES vouchers(id),
    bank_ledger_id UUID REFERENCES ledgers(id),
    transaction_date DATE,
    bank_date DATE,
    is_reconciled BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_vouchers_company ON vouchers(company_id);
CREATE INDEX idx_vouchers_date ON vouchers(date);
CREATE INDEX idx_ledgers_company ON ledgers(company_id);
CREATE INDEX idx_stock_items_company ON stock_items(company_id);
CREATE INDEX idx_voucher_items_voucher ON voucher_items(voucher_id);
CREATE INDEX idx_voucher_ledger_entries_voucher ON voucher_ledger_entries(voucher_id);
CREATE INDEX idx_voucher_ledger_entries_ledger ON voucher_ledger_entries(ledger_id);
