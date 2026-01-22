import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom'; // 👈 Yahan Outlet add kiya hai
import { createPageUrl } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import AppLogo from '@/components/ui/AppLogo';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  Receipt,
  CreditCard,
  ArrowRightLeft,
  BookOpen,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  UserCircle,
  Warehouse,
  Ruler,
  FolderTree,
  Wallet,
  FileSpreadsheet,
  PiggyBank,
  Calculator,
  TrendingUp,
  ClipboardList,
  ShoppingCart,
  Truck,
  FileCheck,
  FileInput,
  BadgePercent,
  Landmark,
  Scale,
  UsersRound,
  Banknote,
  Coins,
  Flower2
} from 'lucide-react';
import { cn } from "@/lib/utils";

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: 'Dashboard' },
  {
    title: 'Company',
    icon: Building2,
    children: [
      { title: 'Company Info', icon: Building2, href: 'CompanyInfo' },
      { title: 'Branches', icon: Building2, href: 'Branches' },
      { title: 'Currencies', icon: Wallet, href: 'Currencies' },
    ]
  },
  {
    title: 'Masters',
    icon: FolderTree,
    children: [
      { title: 'Account Groups', icon: FolderTree, href: 'AccountGroups' },
      { title: 'Ledgers', icon: BookOpen, href: 'Ledgers' },
      { title: 'Stock Groups', icon: Package, href: 'StockGroups' },
      { title: 'Stock Items', icon: Package, href: 'StockItems' },
      { title: 'Units', icon: Ruler, href: 'Units' },
      { title: 'Godowns', icon: Warehouse, href: 'Godowns' },
      { title: 'Cost Centers', icon: Calculator, href: 'CostCenters' },
      { title: 'Voucher Types', icon: FileText, href: 'VoucherTypes' },
    ]
  },
  {
    title: 'Transactions',
    icon: ArrowRightLeft,
    children: [
      { title: 'Sales', icon: TrendingUp, href: 'Sales' },
      { title: 'Purchase', icon: ShoppingCart, href: 'Purchase' },
      { title: 'Receipt', icon: Wallet, href: 'Receipt' },
      { title: 'Payment', icon: CreditCard, href: 'Payment' },
      { title: 'Contra', icon: ArrowRightLeft, href: 'Contra' },
      { title: 'Journal', icon: BookOpen, href: 'Journal' },
      { title: 'Credit Note', icon: FileCheck, href: 'CreditNote' },
      { title: 'Debit Note', icon: FileInput, href: 'DebitNote' },
      { title: 'Sales Order', icon: ClipboardList, href: 'SalesOrder' },
      { title: 'Purchase Order', icon: Truck, href: 'PurchaseOrder' },
    ]
  },
  {
    title: 'Inventory',
    icon: Package,
    children: [
      { title: 'Stock Summary', icon: Package, href: 'StockSummary' },
      { title: 'Stock Item Report', icon: FileSpreadsheet, href: 'StockItemReport' },
      { title: 'Godown Summary', icon: Warehouse, href: 'GodownSummary' },
      { title: 'Reorder Status', icon: ClipboardList, href: 'ReorderStatus' },
    ]
  },
  {
    title: 'Accounts',
    icon: Calculator,
    children: [
      { title: 'Day Book', icon: BookOpen, href: 'DayBook' },
      { title: 'Ledger Reports', icon: FileText, href: 'LedgerReport' },
      { title: 'Trial Balance', icon: Scale, href: 'TrialBalance' },
      { title: 'Profit & Loss', icon: TrendingUp, href: 'ProfitAndLoss' },
      { title: 'Balance Sheet', icon: FileSpreadsheet, href: 'BalanceSheet' },
      { title: 'Cash Flow', icon: Wallet, href: 'CashFlow' },
      { title: 'Bank Reconciliation', icon: Landmark, href: 'BankReconciliation' },
      { title: 'Outstanding', icon: Receipt, href: 'Outstanding' },
    ]
  },
  {
    title: 'VAT Reports',
    icon: BadgePercent,
    children: [
      { title: 'VAT Computation', icon: Calculator, href: 'VATComputation' },
      { title: 'VAT Returns', icon: FileText, href: 'VATReturns' },
    ]
  },
  {
    title: 'Payroll',
    icon: UsersRound,
    children: [
      { title: 'Employees', icon: Users, href: 'Employees' },
      { title: 'Salary Components', icon: Calculator, href: 'SalaryComponents' },
      { title: 'Salary Processing', icon: Banknote, href: 'SalaryProcessing' },
      { title: 'Payroll Reports', icon: FileSpreadsheet, href: 'PayrollReports' },
    ]
  },
  { title: 'Custody Wallets', icon: Wallet, href: 'CustodyWallets' },
  { title: 'Flower Waste', icon: Package, href: 'FlowerWasteTracker' },
  { title: 'ZATCA e-Invoice', icon: FileCheck, href: 'ZATCAIntegration' },
  { title: 'Advanced Reports', icon: BarChart3, href: 'AdvancedReports' },
  { title: 'Settings', icon: Settings, href: 'AppSettings' }
];

function MenuItem({ item, isActive, isOpen, onToggle, collapsed }) {
  const hasChildren = item.children && item.children.length > 0;
  const location = useLocation();

  if (hasChildren) {
    const isChildActive = item.children.some(child => 
      location.pathname.includes(child.href)
    );

    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            (isOpen || isChildActive) ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </>
          )}
        </button>
        {!collapsed && isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-4">
            {item.children.map((child) => (
              <Link
                key={child.href}
                to={createPageUrl(child.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  location.pathname.includes(child.href)
                    ? "bg-emerald-100 text-emerald-700 font-medium"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <child.icon className="h-4 w-4" />
                {child.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={createPageUrl(item.href)}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        isActive ? "bg-emerald-100 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );
}

export default function Layout() { // 👈 Props hata diye kyunki hum Outlet use karenge
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState(['Masters', 'Transactions']);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const toggleMenu = (title) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <AppLogo size="sm" />
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <AppLogo />
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {menuItems.map((item) => (
                <MenuItem
                  key={item.title}
                  item={item}
                  isActive={location.pathname.includes(item.href)}
                  isOpen={openMenus.includes(item.title)}
                  onToggle={() => toggleMenu(item.title)}
                />
              ))}
            </nav>
          </ScrollArea>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full text-slate-600 hover:text-red-600 hover:border-red-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Developed by <span className="font-medium text-slate-600">Rustam Ali</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet /> {/* 👈 Ye line Dashboard ko yahan dikhayegi */}
        </div>
      </main>
    </div>
  );
}