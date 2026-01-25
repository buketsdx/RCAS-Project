import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'; // 👈 Yahan Outlet add kiya hai
import { createPageUrl } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/context/ThemeContext';
import { useCompany } from '@/context/CompanyContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import AppLogo from '@/components/ui/AppLogo';
import Footer from '@/components/ProfessionalFooter';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
      { title: 'Customers', icon: Users, href: 'Customers' },
      { title: 'Suppliers', icon: Truck, href: 'Suppliers' },
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
  {
    title: 'Custody Wallets',
    icon: Wallet,
    children: [
      { title: 'Dashboard', icon: Wallet, href: 'CustodyWallets' },
      { title: 'New Transaction', icon: ArrowRightLeft, href: 'CustodyWalletEntry' },
    ]
  },
  { title: 'Flower Waste', icon: Package, href: 'FlowerWasteTracker' },
  { title: 'ZATCA e-Invoice', icon: FileCheck, href: 'ZATCAIntegration' },
  { title: 'Advanced Reports', icon: BarChart3, href: 'AdvancedReports' },
  { title: 'Settings', icon: Settings, href: 'AppSettings' },
  {
    title: 'Help & Support',
    icon: BookOpen,
    children: [
      { title: 'How to Use', icon: BookOpen, href: 'Help' },
      { title: 'FAQ', icon: FileText, href: 'FAQ' },
      { title: 'Deployment Guide', icon: TrendingUp, href: 'Deployment' },
    ]
  }
];

function MenuItem({ item, isActive, isOpen, onToggle, collapsed, isDark }) {
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
            (isOpen || isChildActive) 
              ? isDark ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-50 text-emerald-700"
              : isDark ? "text-slate-400 hover:bg-slate-800/50" : "text-slate-600 hover:bg-slate-50"
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
          <div className={cn("ml-4 mt-1 space-y-1 border-l-2 pl-4", isDark ? "border-slate-700" : "border-slate-100")}>
            {item.children.map((child) => (
              <Link
                key={child.href}
                to={createPageUrl(child.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  location.pathname.includes(child.href)
                    ? isDark ? "bg-emerald-900/40 text-emerald-300 font-medium" : "bg-emerald-100 text-emerald-700 font-medium"
                    : isDark ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
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
        isActive 
          ? isDark ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"
          : isDark ? "text-slate-400 hover:bg-slate-800/50" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );
}

export default function Layout() { // 👈 Props hata diye kyunki hum Outlet use karenge
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { selectedCompanyId, setSelectedCompanyId, companies, currentCompany, showPasswordDialog, setShowPasswordDialog, passwordInput, setPasswordInput, verifyPassword } = useCompany();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState(['Masters', 'Transactions']);
  const [user, setUser] = useState(null);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Keyboard shortcuts for data entry
  useKeyboardShortcuts({
    onHelp: () => setShowShortcutsDialog(true),
    onSettings: () => navigate('/AppSettings'),
  });

  // Keyboard shortcut for company switching: Ctrl+Alt+C
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'c') {
        e.preventDefault();
        const currentIndex = companies.findIndex(c => c.id === selectedCompanyId);
        const nextIndex = (currentIndex + 1) % companies.length;
        setSelectedCompanyId(companies[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [companies, selectedCompanyId, setSelectedCompanyId]);

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
    <div className={cn("min-h-screen transition-colors", isDark ? "bg-slate-950" : "bg-slate-50")}>
      {/* Mobile Header */}
      <div className={cn("lg:hidden fixed top-0 left-0 right-0 h-16 border-b flex items-center justify-between px-4 z-50 transition-colors",
        isDark 
          ? "bg-slate-900 border-slate-800"
          : "bg-white border-slate-200"
      )}>
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

      {/* Mobile Sidebar */}
      <aside className={cn(
        "lg:hidden fixed top-0 left-0 h-full w-72 border-r transition-all duration-300 z-50 flex flex-col",
        isDark 
          ? "bg-slate-950 border-slate-800" 
          : "bg-white border-slate-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className={cn(
            "h-16 flex items-center px-6 border-b transition-colors",
            isDark 
              ? "bg-slate-900 border-slate-800" 
              : "bg-white border-slate-100"
          )}>
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
                  isDark={isDark}
                  collapsed={false}
                />
              ))}
            </nav>
          </ScrollArea>

          <div className={cn("p-4 border-t transition-colors", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", isDark ? "bg-emerald-900" : "bg-emerald-100")}>
                <UserCircle className={cn("h-6 w-6", isDark ? "text-emerald-400" : "text-emerald-600")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isDark ? "text-slate-100" : "text-slate-800")}>{user?.full_name || 'User'}</p>
                <p className={cn("text-xs truncate", isDark ? "text-slate-400" : "text-slate-500")}>{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className={isDark ? "w-full text-slate-300 border-slate-700 hover:text-red-400 hover:border-red-700" : "w-full text-slate-600 hover:text-red-600 hover:border-red-200"}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          <div className={cn("px-4 py-3 border-t transition-colors", isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-400")}>
            <p className={cn("text-xs text-center", isDark ? "text-slate-400" : "text-slate-400")}>
              Developed by <span className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-600")}>Rustam Ali</span>
            </p>
          </div>
        </div>
      </aside>      {/* Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed top-0 left-0 h-full border-r transition-all duration-300 z-50 flex-col",
        isDark 
          ? "bg-slate-950 border-slate-800" 
          : "bg-white border-slate-200",
        sidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className="h-full flex flex-col">
          <div className={cn(
            "h-16 flex items-center justify-between px-4 border-b transition-colors",
            isDark 
              ? "bg-slate-900 border-slate-800" 
              : "bg-white border-slate-100"
          )}>
            {!sidebarCollapsed && <AppLogo />}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn("flex-shrink-0", isDark ? "hover:bg-slate-800" : "hover:bg-slate-100")}
              title={sidebarCollapsed ? "Expand" : "Collapse"}
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>

          {/* Company Switcher */}
          {!sidebarCollapsed && companies.length > 0 && (
            <div className={cn("px-3 py-3 border-b transition-colors", isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100")}>
              <p className={cn("text-xs font-semibold mb-2", isDark ? "text-slate-400" : "text-slate-600")}>Companies</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 truncate",
                      selectedCompanyId === company.id
                        ? isDark 
                          ? "bg-emerald-900/40 text-emerald-300" 
                          : "bg-emerald-100 text-emerald-700"
                        : isDark 
                          ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-700"
                    )}
                    title={company.name}
                  >
                    {company.name}
                  </button>
                ))}
              </div>
              <Link
                to={createPageUrl('CompanyManagement')}
                className={cn(
                  "w-full block text-center px-3 py-2 mt-2 rounded-lg text-xs font-medium transition-all duration-200",
                  isDark 
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300" 
                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                )}
              >
                + Manage Companies
              </Link>
            </div>
          )}

          <ScrollArea className="flex-1 py-4">
            <nav className={cn("space-y-1", sidebarCollapsed ? "px-1" : "px-3")}>
              {menuItems.map((item) => (
                <MenuItem
                  key={item.title}
                  item={item}
                  isActive={location.pathname.includes(item.href)}
                  isOpen={openMenus.includes(item.title)}
                  onToggle={() => toggleMenu(item.title)}
                  isDark={isDark}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </nav>
          </ScrollArea>

          <div className={cn("border-t transition-all duration-300", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100", sidebarCollapsed ? "p-2" : "p-4")}>
            {sidebarCollapsed ? (
              // Collapsed view - just icon button
              <Button 
                variant="outline"
                size="icon"
                className={cn("w-full", isDark ? "text-slate-300 border-slate-700 hover:text-red-400 hover:border-red-700" : "text-slate-600 hover:text-red-600 hover:border-red-200")}
                onClick={handleLogout}
                title={`Logout - ${user?.full_name || 'User'}`}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              // Expanded view - full user info and logout button
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0", isDark ? "bg-emerald-900" : "bg-emerald-100")}>
                    <UserCircle className={cn("h-6 w-6", isDark ? "text-emerald-400" : "text-emerald-600")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", isDark ? "text-slate-100" : "text-slate-800")}>{user?.full_name || 'User'}</p>
                    <p className={cn("text-xs truncate", isDark ? "text-slate-400" : "text-slate-500")}>{user?.email}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className={cn("w-full", isDark ? "text-slate-300 border-slate-700 hover:text-red-400 hover:border-red-700" : "text-slate-600 hover:text-red-600 hover:border-red-200")}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className={cn("px-4 py-3 border-t transition-colors", isDark ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-400")}>
              <p className={cn("text-xs text-center", isDark ? "text-slate-400" : "text-slate-400")}>
                Developed by <span className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-600")}>Rustam Ali</span>
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn("hidden lg:flex lg:flex-col min-h-screen lg:pt-0 flex-col transition-all duration-300", 
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-72",
        isDark ? "bg-slate-950" : "bg-white"
      )}>
        {/* Top Navigation Bar with Company Info */}
        {currentCompany && (
          <div className={cn("border-b px-6 py-4 flex items-center justify-between transition-colors", isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
            <div className="flex items-center gap-4">
              <div>
                <p className={cn("text-sm font-semibold", isDark ? "text-slate-100" : "text-slate-900")}>
                  {currentCompany.name}
                </p>
                {currentCompany.name_arabic && (
                  <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-600")}>
                    {currentCompany.name_arabic}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {companies.length > 1 && (
                <>
                  <div className="flex gap-2 max-w-xs overflow-x-auto">
                    {companies.map(company => (
                      <Button
                        key={company.id}
                        variant={selectedCompanyId === company.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCompanyId(company.id)}
                        className={cn(
                          "whitespace-nowrap",
                          selectedCompanyId === company.id && "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                        title={`Switch to ${company.name}`}
                      >
                        {company.name.split(' ')[0]}
                      </Button>
                    ))}
                  </div>
                  <span className={cn("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>
                    Ctrl+Alt+C
                  </span>
                </>
              )}
              <Link
                to={createPageUrl('CompanyManagement')}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                )}
              >
                <Building2 className="h-4 w-4" />
                Manage
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShortcutsDialog(true)}
                title="Keyboard Shortcuts (Shift+?)"
                className={cn(isDark ? "border-slate-700 hover:bg-slate-800" : "")}
              >
                ⌨️ Shortcuts
              </Button>
            </div>
          </div>
        )}

        <div className={cn("p-4 md:p-6 lg:p-8 flex-grow", isDark ? "bg-slate-950" : "bg-white")}>
          <Outlet /> {/* 👈 Ye line Dashboard ko yahan dikhayegi */}
        </div>
        <Footer />
      </main>

      {/* Mobile Main Content */}
      <main className={cn("lg:hidden min-h-screen pt-16 flex flex-col transition-colors",
        isDark ? "bg-slate-950" : "bg-slate-50"
      )}>
        <div className={cn("p-4 md:p-6 flex-grow", isDark ? "bg-slate-950" : "bg-slate-50")}>
          <Outlet />
        </div>
        <Footer />
      </main>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter Company Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                placeholder="Enter company password"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border text-sm transition-colors",
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                )}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={verifyPassword}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Unlock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog 
        open={showShortcutsDialog} 
        onOpenChange={setShowShortcutsDialog}
        isDark={isDark}
      />
    </div>
  );
}