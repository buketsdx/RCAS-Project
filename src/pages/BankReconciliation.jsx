import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, endOfMonth } from 'date-fns';
import { Landmark } from 'lucide-react';

export default function BankReconciliation() {
  const [selectedBank, setSelectedBank] = useState('');
  const [asOnDate, setAsOnDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: ledgers = [] } = useQuery({ queryKey: ['ledgers'], queryFn: () => base44.entities.Ledger.list() });
  const { data: entries = [], isLoading } = useQuery({ queryKey: ['ledgerEntries'], queryFn: () => base44.entities.VoucherLedgerEntry.list() });
  const { data: vouchers = [] } = useQuery({ queryKey: ['vouchers'], queryFn: () => base44.entities.Voucher.list() });
  const { data: reconciliations = [] } = useQuery({ queryKey: ['reconciliations'], queryFn: () => base44.entities.BankReconciliation.list() });

  // Filter bank ledgers (ideally by group)
  const bankLedgers = ledgers.filter(l => l.bank_name || l.iban);
  const selectedLedger = ledgers.find(l => l.id === selectedBank);

  const bankEntries = entries
    .filter(e => e.ledger_id === selectedBank)
    .map(e => {
      const voucher = vouchers.find(v => v.id === e.voucher_id);
      const recon = reconciliations.find(r => r.voucher_id === e.voucher_id && r.bank_ledger_id === selectedBank);
      return { ...e, voucher, reconciliation: recon };
    })
    .filter(e => e.voucher && e.voucher.date <= asOnDate)
    .sort((a, b) => new Date(a.voucher?.date) - new Date(b.voucher?.date));

  const openingBalance = parseFloat(selectedLedger?.opening_balance || 0);
  const totalDebit = bankEntries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0);
  const totalCredit = bankEntries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0);
  const bookBalance = openingBalance + totalDebit - totalCredit;

  const reconciledEntries = bankEntries.filter(e => e.reconciliation?.is_reconciled);
  const unreconciledEntries = bankEntries.filter(e => !e.reconciliation?.is_reconciled);

  const columns = [
    { header: 'Date', render: (row) => row.voucher?.date ? format(new Date(row.voucher.date), 'dd MMM yyyy') : '-' },
    { header: 'Voucher', render: (row) => `${row.voucher?.voucher_type} - ${row.voucher?.voucher_number || '#' + row.voucher?.id?.slice(-6)}` },
    { header: 'Debit', className: 'text-right', render: (row) => row.debit_amount ? parseFloat(row.debit_amount).toFixed(2) : '-' },
    { header: 'Credit', className: 'text-right', render: (row) => row.credit_amount ? parseFloat(row.credit_amount).toFixed(2) : '-' },
    {
      header: 'Status',
      render: (row) => (
        <Badge className={row.reconciliation?.is_reconciled ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>
          {row.reconciliation?.is_reconciled ? 'Reconciled' : 'Pending'}
        </Badge>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Bank Reconciliation" subtitle="Match bank transactions with books" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Select Bank Account" name="bank" type="select" value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} options={[{ value: '', label: 'Select Bank' }, ...bankLedgers.map(l => ({ value: l.id, label: `${l.name} ${l.bank_name ? `(${l.bank_name})` : ''}` }))]} />
            <FormField label="As On Date" name="asOnDate" type="date" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {selectedBank && selectedLedger && (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle>{selectedLedger.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Opening Balance</p>
                  <p className="text-xl font-bold">{openingBalance.toFixed(2)} SAR</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Deposits</p>
                  <p className="text-xl font-bold text-emerald-600">{totalDebit.toFixed(2)} SAR</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Withdrawals</p>
                  <p className="text-xl font-bold text-red-600">{totalCredit.toFixed(2)} SAR</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-slate-500">Book Balance</p>
                  <p className="text-xl font-bold text-blue-600">{bookBalance.toFixed(2)} SAR</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700">Reconciled Transactions</p>
              <p className="text-2xl font-bold text-emerald-700">{reconciledEntries.length}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">Pending Reconciliation</p>
              <p className="text-2xl font-bold text-yellow-700">{unreconciledEntries.length}</p>
            </div>
          </div>

          {isLoading ? <LoadingSpinner /> : <DataTable columns={columns} data={bankEntries} />}
        </>
      )}

      {!selectedBank && (
        <Card>
          <CardContent className="py-12 text-center">
            <Landmark className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Select a bank account to start reconciliation</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}