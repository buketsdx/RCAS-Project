import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BookOpen } from 'lucide-react';

const voucherColors = {
  'Sales': 'bg-emerald-100 text-emerald-700',
  'Purchase': 'bg-blue-100 text-blue-700',
  'Receipt': 'bg-purple-100 text-purple-700',
  'Payment': 'bg-orange-100 text-orange-700',
  'Journal': 'bg-slate-100 text-slate-700',
  'Contra': 'bg-cyan-100 text-cyan-700',
  'Credit Note': 'bg-emerald-100 text-emerald-700',
  'Debit Note': 'bg-blue-100 text-blue-700'
};

export default function DayBook() {
  const [filters, setFilters] = useState({
    fromDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    voucherType: ''
  });

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['dayBookVouchers'],
    queryFn: () => rcas.entities.Voucher.list('-date')
  });

  const filteredVouchers = vouchers.filter(v => {
    const dateMatch = (!filters.fromDate || v.date >= filters.fromDate) && (!filters.toDate || v.date <= filters.toDate);
    const typeMatch = !filters.voucherType || v.voucher_type === filters.voucherType;
    return dateMatch && typeMatch;
  });

  const totalDebit = filteredVouchers.filter(v => ['Sales', 'Receipt'].includes(v.voucher_type)).reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);
  const totalCredit = filteredVouchers.filter(v => ['Purchase', 'Payment'].includes(v.voucher_type)).reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);

  const columns = [
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Voucher No', accessor: 'voucher_number', render: (row) => <span className="font-medium">{row.voucher_number || `#${row.id?.slice(-6)}`}</span> },
    { header: 'Type', accessor: 'voucher_type', render: (row) => <Badge className={voucherColors[row.voucher_type] || 'bg-slate-100'}>{row.voucher_type}</Badge> },
    { header: 'Party', accessor: 'party_name', render: (row) => row.party_name || '-' },
    { header: 'Narration', accessor: 'narration', render: (row) => <span className="truncate max-w-xs block text-slate-500">{row.narration || '-'}</span> },
    { header: 'Amount', accessor: 'net_amount', className: 'text-right', render: (row) => <span className="font-semibold">{parseFloat(row.net_amount || 0).toFixed(2)}</span> }
  ];

  if (isLoading) return <LoadingSpinner text="Loading day book..." />;

  return (
    <div>
      <PageHeader title="Day Book" subtitle="Daily transaction register" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="From Date" name="fromDate" type="date" value={filters.fromDate} onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
            <FormField label="To Date" name="toDate" type="date" value={filters.toDate} onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))} />
            <FormField label="Voucher Type" name="voucherType" type="select" value={filters.voucherType} onChange={(e) => setFilters(prev => ({ ...prev, voucherType: e.target.value }))} options={[
              { value: '', label: 'All Types' },
              { value: 'Sales', label: 'Sales' },
              { value: 'Purchase', label: 'Purchase' },
              { value: 'Receipt', label: 'Receipt' },
              { value: 'Payment', label: 'Payment' },
              { value: 'Journal', label: 'Journal' },
              { value: 'Contra', label: 'Contra' }
            ]} />
            <div className="flex items-end">
              <div className="p-4 bg-emerald-50 rounded-lg w-full">
                <p className="text-xs text-slate-500">Total Transactions</p>
                <p className="text-xl font-bold text-emerald-600">{filteredVouchers.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filteredVouchers} />

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-slate-600">Total Inflow (Sales + Receipts)</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDebit, 'SAR')}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-slate-600">Total Outflow (Purchase + Payments)</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCredit, 'SAR')}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600">Net Cash Flow</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDebit - totalCredit, 'SAR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}