import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import { formatCurrency } from '@/utils';
import StatCard from '@/components/common/StatCard';
import QuickAccessCard from '@/components/dashboard/QuickAccessCard';
import RecentVouchers from '@/components/dashboard/RecentVouchers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Package, 
  Users, 
  Receipt,
  ShoppingCart,
  CreditCard,
  FileText,
  ArrowRightLeft,
  Calculator,
  BarChart3
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export default function Dashboard() {
  const { selectedCompanyId, currentCompany: company } = useCompany();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const type = company?.type || 'General';
  
  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          sales: 'Service Sales',
          stockItems: 'Services & Products',
          stockSubtitle: 'Active Services',
          salesInvoice: 'New Service',
          purchaseInvoice: 'Purchase Stock',
          purchases: 'Stock Purchases'
        };
      case 'Restaurant':
        return {
          sales: 'Order Sales',
          stockItems: 'Menu Items',
          stockSubtitle: 'In Menu',
          salesInvoice: 'New Order',
          purchaseInvoice: 'Purchase Ingredients',
          purchases: 'Ingredient Purchases'
        };
      default:
        return {
          sales: 'Monthly Sales',
          stockItems: 'Stock Items',
          stockSubtitle: 'In inventory',
          salesInvoice: 'Sales Invoice',
          purchaseInvoice: 'Purchase Invoice',
          purchases: 'Monthly Purchases'
        };
    }
  };

  const terms = getTerminology();

  const { data: vouchers = [], isLoading: loadingVouchers } = useQuery({
    queryKey: ['vouchers', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Voucher.list('-created_date', 1000);
      return list.filter(v => String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Ledger.list();
      return list.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['stockItems', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.StockItem.list();
      return list.filter(s => String(s.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Current Month
  const currentMonth = new Date();
  currentMonth.setFullYear(parseInt(selectedYear));
  
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  // Last Month
  const lastMonth = subMonths(currentMonth, 1);
  const lastMonthStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
  const lastMonthEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd');

  // Helper to calculate totals
  const calculateTotal = (voucherList, type) => {
    return voucherList
      .filter(v => v.voucher_type === type)
      .reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);
  };

  const monthlyVouchers = vouchers.filter(v => v.date >= monthStart && v.date <= monthEnd);
  const lastMonthVouchers = vouchers.filter(v => v.date >= lastMonthStart && v.date <= lastMonthEnd);
  
  // Current Month Totals
  const totalSales = calculateTotal(monthlyVouchers, 'Sales');
  const totalPurchases = calculateTotal(monthlyVouchers, 'Purchase');
  const totalReceipts = calculateTotal(monthlyVouchers, 'Receipt');
  const totalPayments = calculateTotal(monthlyVouchers, 'Payment');

  // Last Month Totals
  const lastSales = calculateTotal(lastMonthVouchers, 'Sales');
  const lastPurchases = calculateTotal(lastMonthVouchers, 'Purchase');
  const lastReceipts = calculateTotal(lastMonthVouchers, 'Receipt');
  const lastPayments = calculateTotal(lastMonthVouchers, 'Payment');

  // Calculate Trends
  const calculateTrend = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? { label: "+100%", isUp: true } : { label: "0%", isUp: true };
    }
    const diff = current - previous;
    const percentage = (diff / previous) * 100;
    return {
      label: `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`,
      isUp: percentage >= 0
    };
  };

  const salesTrend = calculateTrend(totalSales, lastSales);
  const purchasesTrend = calculateTrend(totalPurchases, lastPurchases);
  const receiptsTrend = calculateTrend(totalReceipts, lastReceipts);
  const paymentsTrend = calculateTrend(totalPayments, lastPayments);

  const quickAccessItems = [
    { icon: TrendingUp, title: terms.salesInvoice, description: 'Create new sales', href: 'Sales', color: 'emerald' },
    { icon: ShoppingCart, title: terms.purchaseInvoice, description: 'Record purchases', href: 'Purchase', color: 'blue' },
    { icon: Wallet, title: 'Receipt Voucher', description: 'Receive payments', href: 'Receipt', color: 'purple' },
    { icon: CreditCard, title: 'Payment Voucher', description: 'Make payments', href: 'Payment', color: 'orange' },
    { icon: FileText, title: 'Journal Entry', description: 'Book journal', href: 'Journal', color: 'cyan' },
    { icon: ArrowRightLeft, title: 'Contra Entry', description: 'Bank transfers', href: 'Contra', color: 'emerald' },
  ];

  if (loadingVouchers) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">{format(currentMonth, 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-xl">
          <Calculator className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary whitespace-nowrap">Financial Year:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[80px] h-8 bg-transparent border-none focus:ring-0 text-primary font-bold shadow-none p-0">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026, 2027].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={terms.sales}
          value={formatCurrency(totalSales, 'SAR')}
          subtitle="This month"
          icon={TrendingUp}
          trend={salesTrend.label}
          trendUp={salesTrend.isUp}
        />
        <StatCard
          title={terms.purchases}
          value={formatCurrency(totalPurchases, 'SAR')}
          subtitle="This month"
          icon={ShoppingCart}
          trend={purchasesTrend.label}
          trendUp={purchasesTrend.isUp}
        />
        <StatCard
          title="Cash Received"
          value={formatCurrency(totalReceipts, 'SAR')}
          subtitle="This month"
          icon={Wallet}
          trend={receiptsTrend.label}
          trendUp={receiptsTrend.isUp}
        />
        <StatCard
          title="Cash Paid"
          value={formatCurrency(totalPayments, 'SAR')}
          subtitle="This month"
          icon={CreditCard}
          trend={paymentsTrend.label}
          trendUp={paymentsTrend.isUp}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Ledgers"
          value={ledgers.length}
          subtitle="Active accounts"
          icon={Users}
        />
        <StatCard
          title={terms.stockItems}
          value={stockItems.length}
          subtitle={terms.stockSubtitle}
          icon={Package}
        />
        <StatCard
          title="Total Vouchers"
          value={vouchers.length}
          subtitle="All time"
          icon={Receipt}
        />
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickAccessItems.map((item) => (
            <QuickAccessCard key={item.href} {...item} />
          ))}
        </div>
      </div>

      {/* Recent Transactions & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentVouchers vouchers={vouchers} />
        
        {/* Monthly Overview */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gross Profit</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(totalSales - totalPurchases, 'SAR')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 dark:bg-blue-500/30 rounded-lg">
                  <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(totalReceipts - totalPayments, 'SAR')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                  <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-muted-foreground">VAT Collected</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                    {formatCurrency(monthlyVouchers
                      .filter(v => v.voucher_type === 'Sales')
                      .reduce((sum, v) => sum + (parseFloat(v.vat_amount) || 0), 0), 'SAR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}