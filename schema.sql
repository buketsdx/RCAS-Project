
CREATE INDEX IF NOT EXISTS idx_voucher_items_voucher ON voucher_items(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_ledger_entries_voucher ON voucher_ledger_entries(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_ledger_entries_ledger ON voucher_ledger_entries(ledger_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_company ON vouchers(company_id);
