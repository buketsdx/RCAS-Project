# company_id Column Error - Root Cause & Complete Fix

## 🔴 The Problem

When running queries on Supabase, the application repeatedly threw:
```
ERROR: 42703: column "company_id" does not exist
```

This error occurred because:
1. The Supabase adapter automatically filters all non-global entities by `company_id`
2. Several tables in the database schema didn't have this `company_id` column defined
3. When queries tried to filter by a column that doesn't exist, Supabase raised an error

## 🔍 Root Cause Analysis

### How the Adapter Works
In `/workspaces/RCAS-Project/src/api/adapters/supabaseAdapter.js`:

```javascript
const globalEntities = ['User', 'Company', 'Currency', 'Settings'];

list: async (entityName, context) => {
  let query = supabase.from(tableName).select('*');
  
  // Auto-filters by company_id UNLESS in globalEntities
  if (context?.companyId && !globalEntities.includes(entityName)) {
    query = query.eq('company_id', context.companyId);  // ← Error here if column missing
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

### Tables That Were Missing company_id

| Table | Entity | Issue | Status |
|-------|--------|-------|--------|
| `custody_transactions` | CustodyTransaction | No company_id column | ✅ FIXED |
| `voucher_items` | VoucherItem | No company_id column | ✅ FIXED |
| `voucher_ledger_entries` | VoucherLedgerEntry | No company_id column | ✅ FIXED |
| `branch_daily_records` | BranchDailyRecord | No company_id column | ✅ FIXED |
| `flower_waste` | FlowerWaste | Schema OK but entity missing property | ✅ FIXED |

(Other tables like `ledgers`, `vouchers`, `branches`, etc. were already correct)

## ✅ All Fixes Applied

### 1. Database Schema Updates
**File**: `/workspaces/RCAS-Project/src/database/schema.sql`

**Changes**:
- Added `company_id bigint references public.companies(id) on delete cascade` to:
  - `custody_transactions` (line ~350)
  - `voucher_items` (line ~111)
  - `voucher_ledger_entries` (line ~120)
  - `branch_daily_records` (line ~400)

### 2. Entity Definition Updates
**Files Updated**: 
- `/workspaces/RCAS-Project/src/entities/CustodyTransaction.js`
- `/workspaces/RCAS-Project/src/entities/VoucherItem.js`
- `/workspaces/RCAS-Project/src/entities/VoucherLedgerEntry.js`
- `/workspaces/RCAS-Project/src/entities/BranchDailyRecord.js`
- `/workspaces/RCAS-Project/src/entities/WasteRecord.js`

**Changes for each file**:
```javascript
"properties": {
  "company_id": {      // ← ADDED
    "type": "string"
  },
  // ... other properties
}

"required": [
  "company_id",        // ← ADDED
  "otherFields"
]
```

## 🚀 How to Apply to Supabase

### Option A: Fresh Start (RECOMMENDED)
```bash
# Delete current Supabase database instance
# Create new instance
# Copy entire contents of: /workspaces/RCAS-Project/src/database/schema.sql
# Paste in Supabase SQL Editor
# Run
```

### Option B: Migrate Existing Data
Run in Supabase SQL Editor (in order):

```sql
-- Step 1: Add company_id columns
ALTER TABLE public.custody_transactions
ADD COLUMN company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.voucher_items  
ADD COLUMN company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.voucher_ledger_entries
ADD COLUMN company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.branch_daily_records
ADD COLUMN company_id bigint REFERENCES public.companies(id) ON DELETE CASCADE;

-- Step 2: Backfill company_id from related tables (optional, if data exists)
UPDATE public.custody_transactions ct
SET company_id = cw.company_id
FROM public.custody_wallets cw
WHERE ct.wallet_id = cw.id;

UPDATE public.voucher_items vi
SET company_id = v.company_id
FROM public.vouchers v
WHERE vi.voucher_id = v.id;

UPDATE public.voucher_ledger_entries vle
SET company_id = v.company_id
FROM public.vouchers v
WHERE vle.voucher_id = v.id;

UPDATE public.branch_daily_records bdr
SET company_id = b.company_id
FROM public.branches b
WHERE bdr.branch_id = b.id;
```

## 🧪 Verification Checklist

After applying fixes:

- [ ] No errors when listing CustodyTransactions
- [ ] No errors when listing VoucherItems
- [ ] No errors when listing VoucherLedgerEntries  
- [ ] No errors when listing BranchDailyRecords
- [ ] No errors when creating records in these tables
- [ ] Company isolation works (data filters by selected company)
- [ ] Browser console is clean (no "column does not exist" errors)

## 📋 Complete List of ALL Company-Scoped Tables

These tables ALL have `company_id` (or should):
- ✅ account_groups
- ✅ bank_reconciliations
- ✅ branches
- ✅ cost_centers
- ✅ custody_transactions (FIXED)
- ✅ custody_wallets
- ✅ employees
- ✅ flower_waste  
- ✅ godowns
- ✅ ledgers
- ✅ payroll
- ✅ salary_components
- ✅ stock_groups
- ✅ stock_items
- ✅ units
- ✅ voucher_items (FIXED)
- ✅ voucher_ledger_entries (FIXED)
- ✅ voucher_types
- ✅ vouchers
- ✅ zatca_invoices
- ✅ branch_daily_records (FIXED)

Global entities (NO company_id needed):
- ✅ companies (owner of company_id)
- ✅ currencies
- ✅ settings
- ✅ profiles (User entity)

## 🔧 Troubleshooting

### Error: "column company_id does not exist"
- Verify table exists in Supabase 
- Check that `ALTER TABLE ... ADD COLUMN` ran successfully
- Refresh browser and retry

### Error: "constraint violation" on insert
- If you backfilled company_id, ensure values are valid
- Check that referenced company exists in `companies` table

### Data disappearing when switching companies
- This is EXPECTED behavior - RLS policies isolate data by company_id
- Verify all records have correct company_id assigned

## 📚 For Future Development

When creating new company-scoped tables:

1. Always add: `company_id bigint references companies(id) on delete cascade`
2. Add to entity definition properties
3. Add to entity's required array
4. The adapter will automatically filter by company_id

## Related Files
- Query adapter: `src/api/adapters/supabaseAdapter.js`
- Schema file: `src/database/schema.sql`
- Entity definitions: `src/entities/*.js`
- Migration guide: `SUPABASE_MIGRATION_FIX.md`
