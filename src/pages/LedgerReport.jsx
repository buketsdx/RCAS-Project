import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FileText } from 'lucide-react';

export default function LedgerReport() {
  const { selectedCompanyId } = useCompany();
  const [selectedLedger, setSelectedLedger] = useState('');
  const [filters, setFilters] = useState({
    fromDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: ledgers = [] } = useQuery({ 
    queryKey: ['ledgers', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Ledger.list();
      return list.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: entries = [], isLoading } = useQuery({ 
    queryKey: ['ledgerEntries', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.VoucherLedgerEntry.list();
      // Filter entries based on vouchers belonging to the selected company
      const allVouchers = await rcas.entities.Voucher.list();
      const companyVoucherIds = new Set(
        allVouchers
          .filter(v => String(v.company_id) === String(selectedCompanyId))
          .map(v => v.id)
      );
      return list.filter(e => companyVoucherIds.has(e.voucher_id));
    },
    enabled: !!selectedCompanyId
  });

  const { data: vouchers = [] } = useQuery({ 
    queryKey: ['vouchers', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Voucher.list();
      return list.filter(v => String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const ledger = ledgers.find(l => l.id === selectedLedger);
  
  const ledgerEntries = entries
    .filter(e => e.ledger_id === selectedLedger)
    .map(e => {
      const voucher = vouchers.find(v => v.id === e.voucher_id);
      return { ...e, voucher };
    })
    .filter(e => {
      if (!e.voucher) return false;
      const dateMatch = (!filters.fromDate || e.voucher.date >= filters.fromDate) && (!filters.toDate || e.voucher.date <= filters.toDate);
      return dateMatch;
    })
    .sort((a, b) => new Date(a.voucher?.date) - new Date(b.voucher?.date));

  let runningBalance = parseFloat(ledger?.opening_balance || 0);
  const openingType = ledger?.opening_balance_type || 'Dr';
  if (openingType === 'Cr') runningBalance = -runningBalance;

  const entriesWithBalance = ledgerEntries.map(e => {
    const debit = parseFloat(e.debit_amount) || 0;
    const credit = parseFloat(e.credit_amount) || 0;
    runningBalance = runningBalance + debit - credit;
    return { ...e, balance: runningBalance };
  });

  const totalDebit = ledgerEntries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0);
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0);

  const columns = [
    { header: 'Date', render: (row) => row.voucher?.date ? format(new Date(row.voucher.date), 'dd MMM yyyy') : '-' },
    { header: 'Voucher', render: (row) => `${row.voucher?.voucher_type} - ${row.voucher?.voucher_number || '#' + row.voucher?.id?.slice(-6)}` },
    { header: 'Particulars', render: (row) => row.voucher?.narration || row.voucher?.party_name || '-' },
    { header: 'Debit', className: 'text-right', render: (row) => row.debit_amount ? parseFloat(row.debit_amount).toFixed(2) : '-' },
    { header: 'Credit', className: 'text-right', render: (row) => row.credit_amount ? parseFloat(row.credit_amount).toFixed(2) : '-' },
    { header: 'Balance', className: 'text-right', render: (row) => <span className={row.balance >= 0 ? 'text-blue-600' : 'text-red-600'}>{Math.abs(row.balance).toFixed(2)} {row.balance >= 0 ? 'Dr' : 'Cr'}</span> }
  ];

  return (
    <div>
      <PageHeader title="Ledger Report" subtitle="View ledger account statement" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Select Ledger" name="ledger" type="select" value={selectedLedger} onChange={(e) => setSelectedLedger(e.target.value)} options={[{ value: '', label: 'Select Ledger' }, ...ledgers.map(l => ({ value: l.id, label: l.name }))]} />
            <FormField label="From Date" name="fromDate" type="date" value={filters.fromDate} onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
            <FormField label="To Date" name="toDate" type="date" value={filters.toDate} onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {selectedLedger && ledger && (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle>{ledger.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Opening Balance</p>
                  <p className="text-xl font-bold">{parseFloat(ledger.opening_balance || 0).toFixed(2)} {ledger.opening_balance_type || 'Dr'}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Debit</p>
                  <p className="text-xl font-bold text-blue-600">{totalDebit.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Credit</p>
                  <p className="text-xl font-bold text-red-600">{totalCredit.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-500">Closing Balance</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {Math.abs(runningBalance).toFixed(2)} {runningBalance >= 0 ? 'Dr' : 'Cr'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? <LoadingSpinner /> : <DataTable columns={columns} data={entriesWithBalance} pagination={false} />}
        </>
      )}

      {!selectedLedger && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Select a ledger to view its statement</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}