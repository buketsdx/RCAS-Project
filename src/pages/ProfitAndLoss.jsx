import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FormField from '@/components/forms/FormField';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfYear, endOfYear } from 'date-fns';
import { TrendingUp, TrendingDown, Printer } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { Button } from "@/components/ui/button";

export default function ProfitAndLoss() {
  const { selectedCompanyId } = useCompany();
  const [filters, setFilters] = useState({
    fromDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfYear(new Date()), 'yyyy-MM-dd')
  });

  const { data: ledgers = [], isLoading: loadingLedgers } = useQuery({ 
    queryKey: ['ledgers', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Ledger.list();
      return list.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: groups = [] } = useQuery({ 
    queryKey: ['accountGroups', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.AccountGroup.list();
      return list.filter(g => String(g.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: entries = [] } = useQuery({ 
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

  const calculateLedgerBalance = (ledgerId) => {
    let balance = 0;
    const ledgerEntries = entries.filter(e => {
      if (e.ledger_id !== ledgerId) return false;
      const voucher = vouchers.find(v => v.id === e.voucher_id);
      return voucher && voucher.date >= filters.fromDate && voucher.date <= filters.toDate;
    });

    ledgerEntries.forEach(e => {
      balance += (parseFloat(e.debit_amount) || 0) - (parseFloat(e.credit_amount) || 0);
    });
    return balance;
  };

  const incomeGroups = groups.filter(g => g.nature === 'Income');
  const expenseGroups = groups.filter(g => g.nature === 'Expenses');

  const incomeLedgers = ledgers.filter(l => incomeGroups.some(g => g.id === l.group_id));
  const expenseLedgers = ledgers.filter(l => expenseGroups.some(g => g.id === l.group_id));

  const incomeData = incomeLedgers.map(l => ({
    name: l.name,
    amount: Math.abs(calculateLedgerBalance(l.id))
  })).filter(item => item.amount > 0);

  const expenseData = expenseLedgers.map(l => ({
    name: l.name,
    amount: Math.abs(calculateLedgerBalance(l.id))
  })).filter(item => item.amount > 0);

  const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalIncome - totalExpenses;

  if (loadingLedgers) return <LoadingSpinner text="Generating P&L statement..." />;

  return (
    <div>
      <PageHeader 
        title="Profit & Loss Statement" 
        subtitle={`${format(new Date(filters.fromDate), 'dd MMM yyyy')} - ${format(new Date(filters.toDate), 'dd MMM yyyy')}`}
        secondaryActions={<Button variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="From Date" name="fromDate" type="date" value={filters.fromDate} onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
            <FormField label="To Date" name="toDate" type="date" value={filters.toDate} onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income */}
        <Card>
          <CardHeader className="bg-emerald-50">
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <TrendingUp className="h-5 w-5" /> Income
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {incomeData.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No income recorded</p>
              ) : (
                incomeData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span>{item.name}</span>
                    <span className="font-medium text-emerald-600">{item.amount.toFixed(2)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-3 bg-emerald-50 px-3 rounded-lg font-bold">
                <span>Total Income</span>
                <span className="text-emerald-700">{formatCurrency(totalIncome, 'SAR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <TrendingDown className="h-5 w-5" /> Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {expenseData.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No expenses recorded</p>
              ) : (
                expenseData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span>{item.name}</span>
                    <span className="font-medium text-red-600">{item.amount.toFixed(2)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg font-bold">
                <span>Total Expenses</span>
                <span className="text-red-700">{formatCurrency(totalExpenses, 'SAR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Profit */}
      <Card className={netProfit >= 0 ? 'border-emerald-200' : 'border-red-200'}>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-lg text-slate-600 mb-2">{netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
            <p className={`text-4xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(netProfit), 'SAR')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
