import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FormField from '@/components/forms/FormField';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, endOfMonth } from 'date-fns';
import { Scale, Printer, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TrialBalance() {
  const [asOnDate, setAsOnDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: ledgers = [], isLoading: loadingLedgers } = useQuery({ queryKey: ['ledgers'], queryFn: () => base44.entities.Ledger.list() });
  const { data: groups = [] } = useQuery({ queryKey: ['accountGroups'], queryFn: () => base44.entities.AccountGroup.list() });
  const { data: entries = [], isLoading: loadingEntries } = useQuery({ queryKey: ['ledgerEntries'], queryFn: () => base44.entities.VoucherLedgerEntry.list() });
  const { data: vouchers = [] } = useQuery({ queryKey: ['vouchers'], queryFn: () => base44.entities.Voucher.list() });

  const calculateLedgerBalance = (ledgerId) => {
    const ledger = ledgers.find(l => l.id === ledgerId);
    let balance = parseFloat(ledger?.opening_balance || 0);
    const openingType = ledger?.opening_balance_type || 'Dr';
    if (openingType === 'Cr') balance = -balance;

    const ledgerEntries = entries.filter(e => {
      if (e.ledger_id !== ledgerId) return false;
      const voucher = vouchers.find(v => v.id === e.voucher_id);
      return voucher && voucher.date <= asOnDate;
    });

    ledgerEntries.forEach(e => {
      balance += (parseFloat(e.debit_amount) || 0) - (parseFloat(e.credit_amount) || 0);
    });

    return balance;
  };

  const trialBalanceData = ledgers.map(ledger => {
    const balance = calculateLedgerBalance(ledger.id);
    const group = groups.find(g => g.id === ledger.group_id);
    return {
      id: ledger.id,
      name: ledger.name,
      group: group?.name || 'Ungrouped',
      nature: group?.nature || '',
      debit: balance > 0 ? balance : 0,
      credit: balance < 0 ? Math.abs(balance) : 0
    };
  }).filter(item => item.debit !== 0 || item.credit !== 0);

  const totalDebit = trialBalanceData.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = trialBalanceData.reduce((sum, item) => sum + item.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  if (loadingLedgers || loadingEntries) return <LoadingSpinner text="Generating trial balance..." />;

  return (
    <div>
      <PageHeader 
        title="Trial Balance" 
        subtitle={`As on ${format(new Date(asOnDate), 'dd MMMM yyyy')}`}
        secondaryActions={
          <Button variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <FormField label="As On Date" name="asOnDate" type="date" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} className="w-64" />
            <div className={`px-4 py-2 rounded-lg ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              <Scale className="h-4 w-4 inline mr-2" />
              {isBalanced ? 'Trial Balance is Balanced' : 'Trial Balance has Difference'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trial Balance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Ledger Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Debit (SAR)</TableHead>
                <TableHead className="text-right">Credit (SAR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialBalanceData.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-slate-500">{item.group}</TableCell>
                  <TableCell className="text-right">{item.debit > 0 ? item.debit.toFixed(2) : '-'}</TableCell>
                  <TableCell className="text-right">{item.credit > 0 ? item.credit.toFixed(2) : '-'}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-100 font-bold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">{totalDebit.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totalCredit.toFixed(2)}</TableCell>
              </TableRow>
              {!isBalanced && (
                <TableRow className="bg-red-50">
                  <TableCell colSpan={2} className="text-red-600">Difference</TableCell>
                  <TableCell colSpan={2} className="text-right text-red-600 font-bold">
                    {Math.abs(totalDebit - totalCredit).toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}