# Supabase Schema Migration - company_id Column Fixes

## Problem
The application was throwing error: `ERROR: 42703: column "company_id" does not exist`

This happened because the Supabase adapter (src/api/adapters/supabaseAdapter.js) automatically filters all non-global entities by `company_id`, but several tables in the schema didn't have this column defined.

## Root Cause Analysis

The `supabaseAdapter.js` has this logic:
```javascript
const globalEntities = ['User', 'Company', 'Currency', 'Settings'];

// In list() method:
if (context?.companyId && !globalEntities.includes(entityName)) {
  query = query.eq('company_id', context.companyId);
}
```

This means it automatically filters by `company_id` for all entities EXCEPT those marked as global.

## Tables Fixed

The following tables were missing the `company_id` column and have been added to both schema files:

### 1. custody_transactions
- **Before**: Only had `wallet_id` reference
- **After**: Added `company_id bigint references companies(id)`
- **Why**: Used in CustodyWallets page to fetch transactions and needed company isolation

### 2. voucher_items
- **Before**: Only had `voucher_id` reference
- **After**: Added `company_id bigint references companies(id)`
- **Why**: Used in multiple pages to query voucher items with company filtering

### 3. voucher_ledger_entries
- **Before**: Only had `voucher_id` reference
- **After**: Added `company_id bigint references companies(id)`
- **Why**: Used in Outstanding page and other reports for company-specific queries

### 4. branch_daily_records
- **Before**: Only had `branch_id` reference
- **After**: Added `company_id bigint references companies(id)`
- **Why**: Used in BranchDailyClose page and needs company isolation

## Files Updated

### Database Schema
- `/workspaces/RCAS-Project/src/database/schema.sql` - Updated table definitions

### Entity Definitions
- `/workspaces/RCAS-Project/src/entities/CustodyTransaction.js` - Added company_id property
- `/workspaces/RCAS-Project/src/entities/VoucherItem.js` - Added company_id property
- `/workspaces/RCAS-Project/src/entities/VoucherLedgerEntry.js` - Added company_id property
- `/workspaces/RCAS-Project/src/entities/BranchDailyRecord.js` - Added company_id property

## Migration Steps for Supabase

### Option 1: Fresh Database (Recommended for Development)
1. Delete and recreate your Supabase database
2. Run the updated SQL from `/workspaces/RCAS-Project/src/database/schema.sql`
3. Test the application

### Option 2: Existing Database (Migration)
Run these SQL commands in Supabase SQL Editor:

```sql
-- 1. Add company_id to custody_transactions
ALTER TABLE public.custody_transactions
ADD COLUMN company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Add company_id to voucher_items
ALTER TABLE public.voucher_items
ADD COLUMN company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE;

-- 3. Add company_id to voucher_ledger_entries
ALTER TABLE public.voucher_ledger_entries
ADD COLUMN company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE;

-- 4. Add company_id to branch_daily_records
ALTER TABLE public.branch_daily_records
ADD COLUMN company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE;

-- Optional: Backfill company_id where possible
-- For custody_transactions (get company_id from wallet)
UPDATE public.custody_transactions ct
SET company_id = cw.company_id
FROM public.custody_wallets cw
WHERE ct.wallet_id = cw.id AND ct.company_id IS NULL;

-- For voucher_items (get company_id from voucher)
UPDATE public.voucher_items vi
SET company_id = v.company_id
FROM public.vouchers v
WHERE vi.voucher_id = v.id AND vi.company_id IS NULL;

-- For voucher_ledger_entries (get company_id from voucher)
UPDATE public.voucher_ledger_entries vle
SET company_id = v.company_id
FROM public.vouchers v
WHERE vle.voucher_id = v.id AND vle.company_id IS NULL;

-- For branch_daily_records (get company_id from branch)
UPDATE public.branch_daily_records bdr
SET company_id = b.company_id
FROM public.branches b
WHERE bdr.branch_id = b.id AND bdr.company_id IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE public.custody_transactions
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.voucher_items
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.voucher_ledger_entries
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.branch_daily_records
ALTER COLUMN company_id SET NOT NULL;

-- Update RLS policies if any
ALTER TABLE public.custody_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.custody_transactions;
CREATE POLICY "Allow all access" ON public.custody_transactions FOR ALL USING (true);

ALTER TABLE public.voucher_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.voucher_items;
CREATE POLICY "Allow all access" ON public.voucher_items FOR ALL USING (true);

ALTER TABLE public.voucher_ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.voucher_ledger_entries;
CREATE POLICY "Allow all access" ON public.voucher_ledger_entries FOR ALL USING (true);

ALTER TABLE public.branch_daily_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.branch_daily_records;
CREATE POLICY "Allow all access" ON public.branch_daily_records FOR ALL USING (true);
```

## Testing

After applying the migration:

1. Check that all queries work without company_id errors:
   ```bash
   # Try listing vouchers
   # Try listing branch daily records
   # Try accessing custody transactions
   ```

2. Verify that company isolation works:
   - Switch between companies
   - Confirm data filters correctly

3. Monitor browser console for any new errors

## Additional Notes

### Why Not Just Query Through Relationships?
You might wonder why not just filter through the parent entity (e.g., filter voucher_items by voucher.company_id instead of direct company_id). The answer is:
- It's more complex to write and maintain
- It requires more complex SQL joins
- The Supabase adapter has a simple pattern: filter by company_id directly
- Direct company_id allows for better query optimization and RLS policies

### Future Tables
For any new tables you create that should be company-scoped:
1. Add `company_id bigint references public.companies(id)` to the table definition
2. Add `company_id` to the entity properties in `/src/entities/YourEntity.js`
3. Include it in the `required` array
4. Add it to RLS policies if applicable

## Verification Checklist

- [ ] All four tables have `company_id` column in Supabase
- [ ] Entity files have `company_id` in properties
- [ ] Entity files have `company_id` in required array
- [ ] Application no longer throws "column 'company_id' does not exist" errors
- [ ] Company isolation works correctly
- [ ] RLS policies are enabled on updated tables
