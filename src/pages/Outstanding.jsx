import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Receipt, Users } from 'lucide-react';

export default function Outstanding() {
  const { data: ledgers = [], isLoading } = useQuery({ queryKey: ['ledgers'], queryFn: () => rcas.entities.Ledger.list() });
  const { data: entries = [] } = useQuery({ queryKey: ['ledgerEntries'], queryFn: () => rcas.entities.VoucherLedgerEntry.list() });
  const { data: vouchers = [] } = useQuery({ queryKey: ['vouchers'], queryFn: () => rcas.entities.Voucher.list() });
  const { data: groups = [] } = useQuery({ queryKey: ['accountGroups'], queryFn: () => rcas.entities.AccountGroup.list() });

  const calculateBalance = (ledgerId) => {
    const ledger = ledgers.find(l => l.id === ledgerId);
    let balance = parseFloat(ledger?.opening_balance || 0);
    if (ledger?.opening_balance_type === 'Cr') balance = -balance;

    entries.filter(e => e.ledger_id === ledgerId).forEach(e => {
      balance += (parseFloat(e.debit_amount) || 0) - (parseFloat(e.credit_amount) || 0);
    });

    return balance;
  };

  // Receivables (Debit balances from customers)
  const receivables = ledgers
    .map(l => ({ ...l, balance: calculateBalance(l.id) }))
    .filter(l => l.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  // Payables (Credit balances to suppliers)
  const payables = ledgers
    .map(l => ({ ...l, balance: calculateBalance(l.id) }))
    .filter(l => l.balance < 0)
    .map(l => ({ ...l, balance: Math.abs(l.balance) }))
    .sort((a, b) => b.balance - a.balance);

  const totalReceivables = receivables.reduce((sum, l) => sum + l.balance, 0);
  const totalPayables = payables.reduce((sum, l) => sum + l.balance, 0);

  const receivableColumns = [
    { header: 'Customer', accessor: 'name', render: (row) => <span className="font-medium">{row.name}</span> },
    { header: 'Contact', accessor: 'phone', render: (row) => row.phone || row.email || '-' },
    { header: 'Outstanding', className: 'text-right', render: (row) => <span className="font-semibold text-blue-600">{formatCurrency(row.balance, 'SAR')}</span> },
    { header: 'Credit Days', accessor: 'credit_days', render: (row) => row.credit_days || '-' }
  ];

  const payableColumns = [
    { header: 'Supplier', accessor: 'name', render: (row) => <span className="font-medium">{row.name}</span> },
    { header: 'Contact', accessor: 'phone', render: (row) => row.phone || row.email || '-' },
    { header: 'Outstanding', className: 'text-right', render: (row) => <span className="font-semibold text-red-600">{formatCurrency(row.balance, 'SAR')}</span> },
    { header: 'Credit Days', accessor: 'credit_days', render: (row) => row.credit_days || '-' }
  ];

  if (isLoading) return <LoadingSpinner text="Loading outstanding..." />;

  return (
    <div>
      <PageHeader title="Outstanding" subtitle="Receivables & Payables" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Receivables</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalReceivables, 'SAR')}</p>
                <p className="text-xs text-blue-600">{receivables.length} parties</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-700">Total Payables</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPayables, 'SAR')}</p>
                <p className="text-xs text-red-600">{payables.length} parties</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="receivables" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="receivables">Receivables ({receivables.length})</TabsTrigger>
          <TabsTrigger value="payables">Payables ({payables.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="mt-6">
          <DataTable 
            columns={receivableColumns} 
            data={receivables} 
            emptyMessage="No outstanding receivables"
          />
        </TabsContent>

        <TabsContent value="payables" className="mt-6">
          <DataTable 
            columns={payableColumns} 
            data={payables}
            emptyMessage="No outstanding payables"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}