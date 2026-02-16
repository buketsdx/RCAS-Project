import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import { useAuth, ROLES } from '@/context/AuthContext';
import { formatCurrency } from '@/utils';
import StatCard from '@/components/common/StatCard';
import QuickAccessCard from '@/components/dashboard/QuickAccessCard';
import RecentVouchers from '@/components/dashboard/RecentVouchers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
  BarChart3,
  LogOut,
  User,
  Building2
} from 'lucide-react';

export default function Dashboard() {
  const { selectedCompanyId, currentCompany: company, companies, isLoading: loadingCompanies } = useCompany();
  const { user, signOut, hasRole } = useAuth();
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
      if (!selectedCompanyId) return [];
      const list = await rcas.entities.Voucher.list('-created_date', 1000);
      return list.filter(v => String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['stockItems', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      const list = await rcas.entities.StockItem.list();
      return list.filter(s => String(s.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Calculations
  const currentMonth = new Date().getMonth();
  const currentYear = parseInt(selectedYear);

  const filterByDate = (items, dateField) => {
    return items.filter(item => {
      const date = new Date(item[dateField]);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  };

  const monthlyVouchers = filterByDate(vouchers, 'date');

  const totalSales = monthlyVouchers
    .filter(v => v.voucher_type === 'Sales' || v.voucher_type === 'Service')
    .reduce((sum, v) => sum + (Number(v.grand_total) || 0), 0);

  const totalPurchases = monthlyVouchers
    .filter(v => v.voucher_type === 'Purchase')
    .reduce((sum, v) => sum + (Number(v.grand_total) || 0), 0);

  const stockValue = stockItems.reduce((sum, item) => {
    return sum + ((Number(item.quantity) || 0) * (Number(item.purchase_price) || 0));
  }, 0);

  // Quick Actions Configuration
  const quickActions = [
    {
      title: terms.salesInvoice,
      icon: Receipt,
      path: '/Vouchers/Sales',
      color: 'bg-emerald-500',
      description: 'Create new invoice'
    },
    {
      title: terms.purchaseInvoice,
      icon: ShoppingCart,
      path: '/Vouchers/Purchase',
      color: 'bg-blue-500',
      description: 'Record purchase'
    },
    {
      title: 'Payment Entry',
      icon: CreditCard,
      path: '/Vouchers/Payment',
      color: 'bg-amber-500',
      description: 'Record payment'
    },
    {
      title: 'Receipt Entry',
      icon: Wallet,
      path: '/Vouchers/Receipt',
      color: 'bg-purple-500',
      description: 'Record receipt'
    }
  ];

  if (loadingCompanies || (selectedCompanyId && loadingVouchers)) {
     return <LoadingSpinner />;
   }
 
   if (!selectedCompanyId) {
      const hasCompanies = Array.isArray(companies) && companies.length > 0;
      const canCreate = hasRole([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER]);
  
      return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
            <BarChart3 className="h-12 w-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {hasCompanies ? "Select a Company" : "Get Started with RCAS"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {hasCompanies 
              ? "Please select a company from the sidebar to view its dashboard and manage your business."
              : "Welcome! You haven't created a company yet. Create your first company to start managing your business."
            }
          </p>
          
          {(!hasCompanies && canCreate) && (
            <Button asChild size="lg" className="mt-4">
              <Link to="/CompanyManagement" state={{ openCreate: true }}>
                <Building2 className="mr-2 h-4 w-4" />
                Create Your First Company
              </Link>
            </Button>
          )}

          {hasCompanies && (
            <p className="text-sm text-slate-400 italic mt-2">
              Use the sidebar to switch between your companies
            </p>
          )}
        </div>
      );
    }

  return (
    <div className="space-y-6">
      <EmailVerificationBanner />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Overview of your business performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            <User className="h-4 w-4 text-slate-500" />
            <div className="text-sm">
            <p className="font-medium flex items-center gap-2">
              {user?.user_metadata?.full_name || 'User'}
              {user?.role && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full uppercase">{user.role.replace('_', ' ')}</span>}
            </p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {user?.id?.slice(0, 8)}...</p>
          </div>
          </div>
          
          <Button variant="outline" size="icon" onClick={signOut} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4].map(i => {
                const year = (new Date().getFullYear() - i).toString();
                return <SelectItem key={year} value={year}>{year}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={terms.sales}
          value={formatCurrency(totalSales)}
          icon={TrendingUp}
          trend="+12.5%"
          trendUp={true}
          description="from last month"
          color="emerald"
        />
        <StatCard
          title={terms.purchases}
          value={formatCurrency(totalPurchases)}
          icon={ShoppingCart}
          trend="+4.3%"
          trendUp={false}
          description="from last month"
          color="blue"
        />
        <StatCard
          title={terms.stockItems}
          value={stockItems.length}
          icon={Package}
          description={terms.stockSubtitle}
          color="amber"
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(stockValue)}
          icon={Wallet}
          description="Total asset value"
          color="purple"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Access */}
        <div className="col-span-4 space-y-6">
          <h2 className="text-lg font-semibold">Quick Access</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <QuickAccessCard key={action.title} {...action} />
            ))}
          </div>
          
          <div className="mt-6">
             <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
             <RecentVouchers vouchers={vouchers.slice(0, 5)} />
          </div>
        </div>

        {/* Recent Transactions / Lists */}
        <div className="col-span-3 space-y-6 h-full">
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm h-full">
            <h3 className="font-semibold mb-4">Stock Overview</h3>
            <div className="space-y-4">
              {stockItems.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.item_name}</p>
                    <p className="text-xs text-slate-500">{item.stock_category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {item.quantity} {item.unit}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(item.purchase_price)}
                    </p>
                  </div>
                </div>
              ))}
              {stockItems.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No stock items found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
