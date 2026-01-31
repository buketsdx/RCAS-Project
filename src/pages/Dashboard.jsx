import React from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import StatCard from '@/components/common/StatCard';
import QuickAccessCard from '@/components/dashboard/QuickAccessCard';
import RecentVouchers from '@/components/dashboard/RecentVouchers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
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
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function Dashboard() {
  const { data: vouchers = [], isLoading: loadingVouchers } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => rcas.entities.Voucher.list('-created_date', 100)
  });

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers'],
    queryFn: () => rcas.entities.Ledger.list()
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['stockItems'],
    queryFn: () => rcas.entities.StockItem.list()
  });

  const currentMonth = new Date();
  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const monthlyVouchers = vouchers.filter(v => v.date >= monthStart && v.date <= monthEnd);
  
  const totalSales = monthlyVouchers
    .filter(v => v.voucher_type === 'Sales')
    .reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);

  const totalPurchases = monthlyVouchers
    .filter(v => v.voucher_type === 'Purchase')
    .reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);

  const totalReceipts = monthlyVouchers
    .filter(v => v.voucher_type === 'Receipt')
    .reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);

  const totalPayments = monthlyVouchers
    .filter(v => v.voucher_type === 'Payment')
    .reduce((sum, v) => sum + (parseFloat(v.net_amount) || 0), 0);

  const quickAccessItems = [
    { icon: TrendingUp, title: 'Sales Invoice', description: 'Create new sales', href: 'Sales', color: 'emerald' },
    { icon: ShoppingCart, title: 'Purchase Invoice', description: 'Record purchases', href: 'Purchase', color: 'blue' },
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
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
          <Calculator className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Financial Year: {format(new Date(), 'yyyy')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Sales"
          value={formatCurrency(totalSales, 'SAR')}
          subtitle="This month"
          icon={TrendingUp}
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard
          title="Monthly Purchases"
          value={formatCurrency(totalPurchases, 'SAR')}
          subtitle="This month"
          icon={ShoppingCart}
        />
        <StatCard
          title="Cash Received"
          value={formatCurrency(totalReceipts, 'SAR')}
          subtitle="This month"
          icon={Wallet}
          trend="+8.2%"
          trendUp={true}
        />
        <StatCard
          title="Cash Paid"
          value={formatCurrency(totalPayments, 'SAR')}
          subtitle="This month"
          icon={CreditCard}
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
          title="Stock Items"
          value={stockItems.length}
          subtitle="In inventory"
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
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Access</h2>
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
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Monthly Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Gross Profit</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {formatCurrency(totalSales - totalPurchases, 'SAR')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Net Cash Flow</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatCurrency(totalReceipts - totalPayments, 'SAR')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">VAT Collected</p>
                  <p className="text-lg font-bold text-purple-700">
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