import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from 'date-fns';
import { BarChart3, TrendingUp, PieChart, Download, Printer, FileSpreadsheet, Users, Package, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart as RechartsPie, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function AdvancedReports() {
  const [dateRange, setDateRange] = useState({
    fromDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfYear(new Date()), 'yyyy-MM-dd')
  });

  const { selectedCompanyId } = useCompany();

  const { data: vouchers = [], isLoading: loadingVouchers } = useQuery({ 
    queryKey: ['vouchers', selectedCompanyId], 
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list();
      return all.filter(v => String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: voucherItems = [] } = useQuery({ 
    queryKey: ['voucherItems', selectedCompanyId], 
    queryFn: async () => {
      const allItems = await rcas.entities.VoucherItem.list();
      const companyVouchers = await rcas.entities.Voucher.list();
      const companyVoucherIds = companyVouchers
        .filter(v => String(v.company_id) === String(selectedCompanyId))
        .map(v => v.id);
      return allItems.filter(item => companyVoucherIds.includes(item.voucher_id));
    },
    enabled: !!selectedCompanyId
  });

  const filteredVouchers = vouchers.filter(v => v.date >= dateRange.fromDate && v.date <= dateRange.toDate);

  // Sales & Purchase Trend
  const months = eachMonthOfInterval({ start: parseISO(dateRange.fromDate), end: parseISO(dateRange.toDate) });
  const monthlyTrend = months.map(month => {
    const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');
    const monthVouchers = filteredVouchers.filter(v => v.date >= monthStart && v.date <= monthEnd);
    
    return {
      month: format(month, 'MMM'),
      sales: monthVouchers.filter(v => v.voucher_type === 'Sales').reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0),
      purchase: monthVouchers.filter(v => v.voucher_type === 'Purchase').reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0),
      receipts: monthVouchers.filter(v => v.voucher_type === 'Receipt').reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0),
      payments: monthVouchers.filter(v => v.voucher_type === 'Payment').reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0)
    };
  });

  // Top Customers
  const customerSales = {};
  filteredVouchers.filter(v => v.voucher_type === 'Sales').forEach(v => {
    const customer = v.party_name || 'Walk-in';
    customerSales[customer] = (customerSales[customer] || 0) + (parseFloat(v.net_amount) || 0);
  });
  const topCustomers = Object.entries(customerSales).sort(([,a], [,b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));

  // Top Products
  const productSales = {};
  voucherItems.forEach(item => {
    const voucher = vouchers.find(v => v.id === item.voucher_id);
    if (voucher?.voucher_type === 'Sales' && voucher.date >= dateRange.fromDate && voucher.date <= dateRange.toDate) {
      const name = item.stock_item_name || 'Unknown';
      productSales[name] = (productSales[name] || 0) + (parseFloat(item.total_amount) || 0);
    }
  });
  const topProducts = Object.entries(productSales).sort(([,a], [,b]) => b - a).slice(0, 10).map(([name, value]) => ({ name, value }));

  // Profit Analysis
  const totalSales = filteredVouchers.filter(v => v.voucher_type === 'Sales').reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);
  const totalPurchases = filteredVouchers.filter(v => v.voucher_type === 'Purchase').reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);
  const grossProfit = totalSales - totalPurchases;
  const profitMargin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) : 0;

  if (loadingVouchers) return <LoadingSpinner text="Loading reports..." />;

  return (
    <div>
      <PageHeader 
        title="Advanced Reports" 
        subtitle="Comprehensive business analytics"
        secondaryActions={
          <div className="flex gap-2">
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="From Date" name="fromDate" type="date" value={dateRange.fromDate} onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))} />
            <FormField label="To Date" name="toDate" type="date" value={dateRange.toDate} onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <TrendingUp className="h-5 w-5 text-emerald-600 mb-2" />
            <p className="text-sm text-emerald-700">Total Sales</p>
            <p className="text-2xl font-bold text-emerald-700">{totalSales.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <Package className="h-5 w-5 text-blue-600 mb-2" />
            <p className="text-sm text-blue-700">Total Purchases</p>
            <p className="text-2xl font-bold text-blue-700">{totalPurchases.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className={grossProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}>
          <CardContent className="pt-6">
            <Wallet className="h-5 w-5 text-emerald-600 mb-2" />
            <p className="text-sm">Gross Profit</p>
            <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{grossProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Profit Margin</p>
            <p className="text-2xl font-bold">{profitMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Transactions</p>
            <p className="text-2xl font-bold">{filteredVouchers.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Sales & Purchase Trends</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader><CardTitle>Monthly Sales vs Purchase</CardTitle></CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="sales" name="Sales" stackId="1" stroke="#10b981" fill="#10b98140" />
                    <Area type="monotone" dataKey="purchase" name="Purchase" stackId="2" stroke="#3b82f6" fill="#3b82f640" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Top 10 Customers by Sales</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCustomers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Customer Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie data={topCustomers.slice(0, 5)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {topCustomers.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Top 10 Products by Sales</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Product Revenue Share</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie data={topProducts.slice(0, 5)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {topProducts.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader><CardTitle>Cash Flow Analysis</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="receipts" name="Cash Receipts" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="payments" name="Cash Payments" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
