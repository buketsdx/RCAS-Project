-- Fix Schema: Add missing 'name_arabic' column to tables

-- 1. Companies Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'name_arabic') THEN
        ALTER TABLE "companies" ADD COLUMN "name_arabic" text;
    END IF;
END $$;

-- 2. Branches Table (Assuming table name is 'branches' or similar, usually plural of entity)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branches') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'name_arabic') THEN
            ALTER TABLE "branches" ADD COLUMN "name_arabic" text;
        END IF;
    END IF;
END $$;

-- 3. Stock Items Table ('stock_items')
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_items') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name = 'name_arabic') THEN
            ALTER TABLE "stock_items" ADD COLUMN "name_arabic" text;
        END IF;
    END IF;
END $$;

-- 4. Employees Table ('employees')
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'name_arabic') THEN
            ALTER TABLE "employees" ADD COLUMN "name_arabic" text;
        END IF;
    END IF;
END $$;

-- 5. Ledgers Table ('ledgers')
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ledgers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledgers' AND column_name = 'name_arabic') THEN
            ALTER TABLE "ledgers" ADD COLUMN "name_arabic" text;
        END IF;
    END IF;
END $$;

-- 6. Godowns Table ('godowns')
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'godowns') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'godowns' AND column_name = 'name_arabic') THEN
            ALTER TABLE "godowns" ADD COLUMN "name_arabic" text;
        END IF;
    END IF;
END $$;

-- 7. Refresh Schema Cache (Notify PostgREST to reload schema)
NOTIFY pgrst, 'reload config';
