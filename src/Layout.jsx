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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Store,
  Check,
  Ticket
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
      { title: 'Booking Management', icon: ClipboardList, href: 'BookingManagement' },
      { title: 'Customer Booking', icon: Ticket, href: 'CustomerBooking' },
      { title: 'Branch Daily Close', icon: Store, href: 'BranchDailyClose' },
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
      { title: 'Stock Adjustment', icon: ArrowRightLeft, href: 'StockAdjustment' },
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
  { title: 'Settings', icon: Settings, href: 'AppSettings' },
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
              ? "bg-primary/10 text-primary" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <div className="ml-4 mt-1 space-y-1 border-l-2 pl-4 border-border">
            {item.children.map((child) => (
              <Link
                key={child.href}
                to={createPageUrl(child.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  location.pathname.includes(child.href)
                    ? "bg-primary/10 text-primary font-medium translate-x-1" 
                    : "text-muted-foreground hover:text-foreground hover:translate-x-1"
                )}
              >
                <div className={cn("h-1.5 w-1.5 rounded-full transition-colors", location.pathname.includes(child.href) ? "bg-primary" : "bg-muted-foreground/30")} />
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
          ? "bg-primary/10 text-primary shadow-sm border border-primary/10" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-300", isActive ? "" : "group-hover:scale-110")} />
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [previousMenus, setPreviousMenus] = useState(['Transactions']);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileSidebarRef = React.useRef(null);
  const location = useLocation();

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const filteredMenuItems = React.useMemo(() => {
    const type = selectedCompany?.business_type;
    let items = [...menuItems]; // Create a shallow copy of the array

    // HIDE SALON FEATURES IF NOT SALON
    if (type !== 'Salon') {
      items = items.map(item => {
        if (item.title === 'Transactions') {
          return {
            ...item,
            children: item.children.filter(child => 
              child.href !== 'BookingManagement' && 
              child.href !== 'CustomerBooking'
            )
          };
        }
        return item;
      });
    }

    if (type === 'Salon') {
      items = items.map(item => {
        if (item.title === 'Inventory') {
          return {
            ...item,
            title: 'Products & Services',
            children: item.children.map(child => {
              if (child.title === 'Godown Summary') return { ...child, title: 'Store Summary', icon: Warehouse };
              return child;
            })
          };
        }
        if (item.title === 'Transactions') {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.title === 'Sales') return { ...child, title: 'Appointments / Billing', icon: UsersRound };
              if (child.title === 'Branch Daily Close') return { ...child, title: 'Daily Close Entry', icon: Store };
              return child;
            })
          };
        }
        if (item.title === 'Masters') {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.title === 'Stock Items') return { ...child, title: 'Services & Products', icon: Package };
              if (child.title === 'Stock Groups') return { ...child, title: 'Categories', icon: FolderTree };
              if (child.title === 'Suppliers') return { ...child, title: 'Vendors', icon: Truck };
              if (child.title === 'Voucher Types') return { ...child, title: 'Transaction Types', icon: FileText };
              if (child.title === 'Godowns') return { ...child, title: 'Stores / Locations', icon: Warehouse };
              if (child.title === 'Cost Centers') return { ...child, title: 'Departments / Sections', icon: Calculator };
              return child;
            })
          };
        }
        if (item.title === 'Payroll') {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.title === 'Employees') return { ...child, title: 'Stylists & Staff', icon: Users };
              return child;
            })
          };
        }
        return item;
      });
    } else if (type === 'Restaurant') {
      items = items.map(item => {
        if (item.title === 'Inventory') {
          return {
            ...item,
            title: 'Kitchen Inventory',
            children: item.children.map(child => {
              if (child.title === 'Godown Summary') return { ...child, title: 'Store Summary', icon: Warehouse };
              return child;
            })
          };
        }
        if (item.title === 'Transactions') {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.title === 'Sales') return { ...child, title: 'Orders / Billing', icon: ClipboardList };
              if (child.title === 'Branch Daily Close') return { ...child, title: 'Daily Close Entry', icon: Store };
              return child;
            })
          };
        }
        if (item.title === 'Masters') {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.title === 'Stock Items') return { ...child, title: 'Menu Items & Ingredients', icon: Package };
              if (child.title === 'Stock Groups') return { ...child, title: 'Menu Categories', icon: FolderTree };
              if (child.title === 'Suppliers') return { ...child, title: 'Vendors', icon: Truck };
              if (child.title === 'Voucher Types') return { ...child, title: 'Order Types', icon: FileText };
              if (child.title === 'Godowns') return { ...child, title: 'Stores / Locations', icon: Warehouse };
              if (child.title === 'Cost Centers') return { ...child, title: 'Departments / Sections', icon: Calculator };
              return child;
            })
          };
        }
        if (item.title === 'Payroll') {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.title === 'Employees') return { ...child, title: 'Kitchen & Service Staff', icon: Users };
              return child;
            })
          };
        }
        return item;
      });
    } else if (type === 'Service') {
       items = items.map(item => {
        if (item.title === 'Inventory') {
          return { ...item, title: 'Service Items' };
        }
        if (item.title === 'Masters') {
          return {
            ...item,
            children: item.children.map(child => {
              if (child.title === 'Stock Items') return { ...child, title: 'Service List', icon: Package };
              return child;
            })
          };
        }
        return item;
      });
    }

    return items;
  }, [selectedCompany?.business_type]);

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

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Detect screen size changes
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle sidebar scroll for auto-collapse on mobile
  React.useEffect(() => {
    if (!isMobile || !mobileSidebarRef.current) return;

    const handleSidebarScroll = () => {
      const scrollTop = mobileSidebarRef.current?.scrollTop || 0;

      if (scrollTop > 10 && !isScrolled && openMenus.length > 0) {
        // User scrolled down - collapse all menus
        setPreviousMenus(openMenus);
        setOpenMenus([]);
        setIsScrolled(true);
      } else if (scrollTop === 0 && isScrolled && previousMenus.length > 0) {
        // User scrolled back to top - restore menus
        setOpenMenus(previousMenus);
        setIsScrolled(false);
      }
    };

    const ref = mobileSidebarRef.current;
    ref?.addEventListener('scroll', handleSidebarScroll);
    return () => ref?.removeEventListener('scroll', handleSidebarScroll);
  }, [isMobile, isScrolled, openMenus, previousMenus]);

  const toggleMenu = (title) => {
    setOpenMenus(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
    // Reset scroll state when user manually toggles menu
    setIsScrolled(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/Login');
  };

  return (
    <div className="min-h-screen transition-colors bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b flex items-center justify-between px-4 z-50 transition-colors bg-card border-border">
        <div className="flex items-center gap-3">
          <Link to="/Dashboard">
            <AppLogo size="sm" showText={false} />
          </Link>
          <span className="font-bold text-sm truncate max-w-[200px]">{selectedCompany?.name || 'RCAS'}</span>
        </div>
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
      <div
        ref={mobileSidebarRef}
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 w-64 border-r z-50 transform transition-transform duration-300 bg-card border-border flex flex-col max-h-screen overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          <Link to="/Dashboard">
            <AppLogo size="sm" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 px-3 py-4">
          {filteredMenuItems
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
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role || 'Guest'}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 flex-col border-r transition-all duration-300 z-30 bg-card border-border",
        sidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          {!sidebarCollapsed && (
            <Link to="/Dashboard">
              <AppLogo size="sm" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(sidebarCollapsed && "mx-auto")}
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className={cn("flex-1 min-h-0 overflow-y-auto space-y-1 py-4", sidebarCollapsed ? "px-1" : "px-3")}>
          {filteredMenuItems
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

        <div className="p-4 border-t border-border flex-shrink-0">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.role || 'Guest'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary" title={user?.full_name}>
                <UserCircle className="h-5 w-5" />
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto p-2 -ml-2 hover:bg-muted group">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-lg tracking-tight leading-none">{selectedCompany?.name || 'Select Company'}</span>
                    <span className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">Switch Company</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground ml-2 group-hover:text-primary transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>My Companies</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {companies.map(company => (
                  <DropdownMenuItem 
                    key={company.id} 
                    onClick={() => setSelectedCompanyId(company.id)}
                    className="cursor-pointer"
                  >
                    <span className={cn("flex-1", selectedCompanyId === company.id && "font-bold")}>{company.name}</span>
                    {selectedCompanyId === company.id && <Check className="h-4 w-4 ml-2 text-primary" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/CompanyInfo')}
                  className="cursor-pointer text-muted-foreground hover:text-primary"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Companies
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] pt-16 lg:pt-0 bg-background">
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
          <div className="px-6 lg:px-8 pb-6">
            <Footer />
          </div>
        </main>
      </div>

      <KeyboardShortcutsDialog 
        open={showShortcutsDialog} 
        onOpenChange={setShowShortcutsDialog} 
      />
    </div>
  );
}
