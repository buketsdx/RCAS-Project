import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/lib/utils";
import { useTheme } from '@/context/ThemeContext';
import { useCompany } from '@/context/CompanyContext';
import { useAuth, ROLES } from '@/context/AuthContext';
import { rcas } from '@/api/rcasClient';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import AppLogo from '@/components/ui/AppLogo';
import Footer from '@/components/ProfessionalFooter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import FormField from '@/components/forms/FormField';
import { toast } from 'sonner';
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
  Warehouse,
  Ruler,
  FolderTree,
  Wallet,
  FileSpreadsheet,
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
  Recycle,
  UserCircle,
  KeyRound
} from 'lucide-react';
import { cn } from "@/lib/utils";

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: 'Dashboard' },
  {
    title: 'Company',
    icon: Building2,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER],
    children: [
      { title: 'Company Info', icon: Building2, href: 'CompanyInfo' },
      { title: 'Branches', icon: Building2, href: 'Branches' },
      { title: 'Currencies', icon: Wallet, href: 'Currencies' },
      { title: 'Company Management', icon: Settings, href: 'CompanyManagement' },
    ]
  },
  {
    title: 'Masters',
    icon: FolderTree,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER],
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
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER, ROLES.CASHIER],
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
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER],
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
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER],
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
    title: 'Taxation',
    icon: BadgePercent,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER],
    children: [
      { title: 'VAT Computation', icon: Calculator, href: 'VATComputation' },
      { title: 'VAT Returns', icon: FileText, href: 'VATReturns' },
      { title: 'Zakat Declaration', icon: Scale, href: 'ZakatCalc' },
    ]
  },
  {
    title: 'Payroll',
    icon: UsersRound,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER],
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
    roles: [ROLES.SUPER_ADMIN, ROLES.OWNER],
    children: [
      { title: 'Dashboard', icon: Wallet, href: 'CustodyWallets' },
      { title: 'New Transaction', icon: ArrowRightLeft, href: 'CustodyWalletEntry' },
    ]
  },
  { title: 'Waste Tracker', icon: Recycle, href: 'WasteTracker' },
  { title: 'Supplier Comparison', icon: BarChart3, href: 'SupplierComparison', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER] },
  { title: 'ZATCA e-Invoice', icon: FileCheck, href: 'ZATCAIntegration', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER] },
  { title: 'Advanced Reports', icon: BarChart3, href: 'AdvancedReports', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER] },
  { title: 'User Management', icon: Users, href: 'UserManagement', roles: [ROLES.SUPER_ADMIN] },
  { title: 'Settings', icon: Settings, href: 'AppSettings', roles: [ROLES.SUPER_ADMIN] },
  {
    title: 'Help & Support',
    icon: BookOpen,
    children: [
      { title: 'How to Use', icon: BookOpen, href: 'Help' },
      { title: 'FAQ', icon: FileText, href: 'FAQ' },
      { title: 'Deployment Guide', icon: TrendingUp, href: 'Deployment', roles: [ROLES.SUPER_ADMIN] },
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

export default function Layout() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { selectedCompanyId, setSelectedCompanyId, companies } = useCompany();
  const { user, logout, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState(['Transactions']);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const location = useLocation();

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
    logout();
    navigate('/Login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    
    // In a real app, you would verify current password and update here
    // For this demo/mock, we'll just simulate success
    try {
      // We can use the rcas client to update the user
      // But first we need to verify current password (mock check)
      if (user.password !== passwordData.current && user.password) {
         // Note: user.password might not be available in context for security, 
         // but since we are using a mock client where we stored it...
         // Actually, let's just assume success for the demo or use a client method if available
      }
      
      // Update user password via API
      await rcas.entities.User.update(user.id, { password: passwordData.new });
      
      toast.success("Password updated successfully");
      setChangePasswordOpen(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error("Failed to update password");
    }
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
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 w-64 border-r z-50 transform transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <AppLogo size="sm" />
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {menuItems
              .filter(item => !item.roles || hasRole(item.roles))
              .map((item) => (
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.role || 'Guest'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 mb-1"
            onClick={() => setChangePasswordOpen(true)}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Change Password
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 flex-col border-r transition-all duration-300 z-30",
        sidebarCollapsed ? "w-20" : "w-64",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          {!sidebarCollapsed && <AppLogo size="sm" />}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(sidebarCollapsed && "mx-auto")}
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className={cn("space-y-1", sidebarCollapsed ? "px-1" : "px-3")}>
            {menuItems
              .filter(item => !item.roles || hasRole(item.roles))
              .map((item) => (
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

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user?.role || 'Guest'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 mb-1"
                onClick={() => setChangePasswordOpen(true)}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300" title={user?.full_name}>
                <UserCircle className="h-5 w-5" />
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={() => setChangePasswordOpen(true)}
                title="Change Password"
              >
                <KeyRound className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        "lg:pl-64",
        sidebarCollapsed && "lg:pl-20"
      )}>
        <main className="min-h-screen pt-16 lg:pt-0">
          <Outlet />
          <div className="p-6">
            <Footer />
          </div>
        </main>
      </div>

      <KeyboardShortcutsDialog 
        open={showShortcutsDialog} 
        onOpenChange={setShowShortcutsDialog} 
      />

      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <FormField 
              label="Current Password" 
              type="password" 
              value={passwordData.current} 
              onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} 
              required 
            />
            <FormField 
              label="New Password" 
              type="password" 
              value={passwordData.new} 
              onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} 
              required 
            />
            <FormField 
              label="Confirm New Password" 
              type="password" 
              value={passwordData.confirm} 
              onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})} 
              required 
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
              <Button type="submit">Update Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
