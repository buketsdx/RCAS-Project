import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FormField from '@/components/forms/FormField';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfYear, endOfYear, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { Wallet, TrendingUp, TrendingDown, Printer } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CashFlow() {
  const [filters, setFilters] = useState({
    fromDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfYear(new Date()), 'yyyy-MM-dd')
  });

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => base44.entities.Voucher.list()
  });

  const filteredVouchers = vouchers.filter(v => v.date >= filters.fromDate && v.date <= filters.toDate);

  const receipts = filteredVouchers.filter(v => v.voucher_type === 'Receipt');
  const payments = filteredVouchers.filter(v => v.voucher_type === 'Payment');
  const sales = filteredVouchers.filter(v => v.voucher_type === 'Sales');
  const purchases = filteredVouchers.filter(v => v.voucher_type === 'Purchase');

  const totalReceipts = receipts.reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);
  const totalPayments = payments.reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);
  const totalSales = sales.reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);
  const totalPurchases = purchases.reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);

  const netCashFlow = totalReceipts - totalPayments;
  const netOperating = totalSales - totalPurchases;

  // Monthly chart data
  const months = eachMonthOfInterval({
    start: parseISO(filters.fromDate),
    end: parseISO(filters.toDate)
  });

  const chartData = months.map(month => {
    const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');
    
    const monthReceipts = filteredVouchers
      .filter(v => v.voucher_type === 'Receipt' && v.date >= monthStart && v.date <= monthEnd)
      .reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);
    
    const monthPayments = filteredVouchers
      .filter(v => v.voucher_type === 'Payment' && v.date >= monthStart && v.date <= monthEnd)
      .reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);

    return {
      month: format(month, 'MMM'),
      inflow: monthReceipts,
      outflow: monthPayments,
      net: monthReceipts - monthPayments
    };
  });

  if (isLoading) return <LoadingSpinner text="Generating cash flow statement..." />;

  return (
    <div>
      <PageHeader 
        title="Cash Flow Statement" 
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-700">Total Inflow</p>
                <p className="text-2xl font-bold text-emerald-700">{totalReceipts.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm text-red-700">Total Outflow</p>
                <p className="text-2xl font-bold text-red-700">{totalPayments.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={netCashFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className={`h-8 w-8 ${netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              <div>
                <p className={`text-sm ${netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Cash Flow</p>
                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{netCashFlow.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-slate-600">Transactions</p>
              <p className="text-2xl font-bold">{receipts.length + payments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="inflow" name="Inflow" fill="#10b981" />
                <Bar dataKey="outflow" name="Outflow" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="bg-emerald-50">
            <CardTitle className="text-emerald-700">Cash Inflows</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span>Cash Receipts</span>
                <span className="font-medium">{totalReceipts.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Sales Revenue</span>
                <span className="font-medium">{totalSales.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between py-3 bg-emerald-50 px-3 rounded-lg font-bold">
                <span>Total Inflows</span>
                <span>{(totalReceipts + totalSales).toFixed(2)} SAR</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Cash Outflows</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span>Cash Payments</span>
                <span className="font-medium">{totalPayments.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Purchase Expenses</span>
                <span className="font-medium">{totalPurchases.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between py-3 bg-red-50 px-3 rounded-lg font-bold">
                <span>Total Outflows</span>
                <span>{(totalPayments + totalPurchases).toFixed(2)} SAR</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}