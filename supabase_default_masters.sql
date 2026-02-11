-- Function to seed default master data for a company
-- Usage: SELECT seed_company_defaults('company-uuid-here');

CREATE OR REPLACE FUNCTION seed_company_defaults(target_company_id UUID)
RETURNS void AS $$
DECLARE
    assets_id UUID;
    liabilities_id UUID;
    income_id UUID;
    expenses_id UUID;
    current_assets_id UUID;
    current_liabilities_id UUID;
    cash_hand_id UUID;
    bank_acc_id UUID;
    debtors_id UUID;
    creditors_id UUID;
    taxes_id UUID;
BEGIN
    -- 1. ACCOUNT GROUPS (Primary)
    INSERT INTO account_groups (company_id, name, nature) 
    VALUES (target_company_id, 'Assets', 'Assets') RETURNING id INTO assets_id;
    
    INSERT INTO account_groups (company_id, name, nature) 
    VALUES (target_company_id, 'Liabilities', 'Liabilities') RETURNING id INTO liabilities_id;
    
    INSERT INTO account_groups (company_id, name, nature) 
    VALUES (target_company_id, 'Income', 'Income') RETURNING id INTO income_id;
    
    INSERT INTO account_groups (company_id, name, nature) 
    VALUES (target_company_id, 'Expenses', 'Expenses') RETURNING id INTO expenses_id;

    -- 2. ACCOUNT GROUPS (Sub-groups)
    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Fixed Assets', assets_id, 'Assets');

    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Current Assets', assets_id, 'Assets') RETURNING id INTO current_assets_id;

    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Cash-in-Hand', current_assets_id, 'Assets') RETURNING id INTO cash_hand_id;

    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Bank Accounts', current_assets_id, 'Assets') RETURNING id INTO bank_acc_id;

    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Sundry Debtors', current_assets_id, 'Assets') RETURNING id INTO debtors_id;

    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Current Liabilities', liabilities_id, 'Liabilities') RETURNING id INTO current_liabilities_id;

    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Sundry Creditors', current_liabilities_id, 'Liabilities') RETURNING id INTO creditors_id;

    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Duties & Taxes', current_liabilities_id, 'Liabilities') RETURNING id INTO taxes_id;

    INSERT INTO account_groups (company_id, name, parent_id, nature) 
    VALUES (target_company_id, 'Capital Account', liabilities_id, 'Liabilities');

    -- 3. LEDGERS
    INSERT INTO ledgers (company_id, name, group_id) 
    VALUES (target_company_id, 'Cash', cash_hand_id);

    -- 4. VOUCHER TYPES
    INSERT INTO voucher_types (company_id, name, parent_type, abbreviation) VALUES
    (target_company_id, 'Sales', 'Sales', 'Sales'),
    (target_company_id, 'Purchase', 'Purchase', 'Purc'),
    (target_company_id, 'Payment', 'Payment', 'Pay'),
    (target_company_id, 'Receipt', 'Receipt', 'Rcpt'),
    (target_company_id, 'Contra', 'Contra', 'Cont'),
    (target_company_id, 'Journal', 'Journal', 'Jour'),
    (target_company_id, 'Credit Note', 'Sales', 'C/N'),
    (target_company_id, 'Debit Note', 'Purchase', 'D/N');

    -- 5. UNITS
    INSERT INTO units (company_id, name, symbol) VALUES
    (target_company_id, 'Pieces', 'Pcs'),
    (target_company_id, 'Numbers', 'Nos'),
    (target_company_id, 'Kilogram', 'Kg');

    -- 6. GODOWNS
    INSERT INTO godowns (company_id, name) VALUES
    (target_company_id, 'Main Location');

    -- 7. STOCK GROUPS
    INSERT INTO stock_groups (company_id, name) VALUES
    (target_company_id, 'General');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
