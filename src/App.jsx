import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { AuthProvider, ROLES } from '@/context/AuthContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from '@vercel/speed-insights/react';
import '@emran-alhaddad/saudi-riyal-font/index.css';
import Layout from './Layout';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));

// Pages - Company Section
const CompanyInfo = React.lazy(() => import('./pages/CompanyInfo'));
const CompanyManagement = React.lazy(() => import('./pages/CompanyManagement'));
const Branches = React.lazy(() => import('./pages/Branches'));
const Currencies = React.lazy(() => import('./pages/Currencies'));

// Pages - Masters Section
const AccountGroups = React.lazy(() => import('./pages/AccountGroups'));
const Ledgers = React.lazy(() => import('./pages/Ledgers'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const SupplierComparison = React.lazy(() => import('./pages/SupplierComparison'));
const StockGroups = React.lazy(() => import('./pages/StockGroups'));
const StockItems = React.lazy(() => import('./pages/StockItems'));
const Units = React.lazy(() => import('./pages/Units'));
const Godowns = React.lazy(() => import('./pages/Godowns'));
const CostCenters = React.lazy(() => import('./pages/CostCenters'));
const VoucherTypes = React.lazy(() => import('./pages/VoucherTypes'));

// Pages - Transactions Section
const Sales = React.lazy(() => import('./pages/Sales'));
const Purchase = React.lazy(() => import('./pages/Purchase'));
const ReceiptVoucher = React.lazy(() => import('./pages/ReceiptVoucher'));
const PaymentVoucher = React.lazy(() => import('./pages/PaymentVoucher'));
const ContraVoucher = React.lazy(() => import('./pages/ContraVoucher'));
const JournalVoucher = React.lazy(() => import('./pages/JournalVoucher'));
const CreditNote = React.lazy(() => import('./pages/CreditNote'));
const CreditNoteForm = React.lazy(() => import('./pages/CreditNoteForm'));
const DebitNote = React.lazy(() => import('./pages/DebitNote'));
const DebitNoteForm = React.lazy(() => import('./pages/DebitNoteForm'));
const SalesOrder = React.lazy(() => import('./pages/SalesOrder'));
const SalesOrderForm = React.lazy(() => import('./pages/SalesOrderForm'));
const PurchaseOrder = React.lazy(() => import('./pages/PurchaseOrder'));
const PurchaseOrderForm = React.lazy(() => import('./pages/PurchaseOrderForm'));
const SalesInvoice = React.lazy(() => import('./pages/SalesInvoice'));
const PurchaseInvoice = React.lazy(() => import('./pages/PurchaseInvoice'));

// Pages - Inventory Section
const StockSummary = React.lazy(() => import('./pages/StockSummary'));
const StockAdjustment = React.lazy(() => import('./pages/StockAdjustment'));
const StockItemReport = React.lazy(() => import('./pages/StockItemReport'));
const GodownSummary = React.lazy(() => import('./pages/GodownSummary'));
const ReorderStatus = React.lazy(() => import('./pages/ReorderStatus'));

// Pages - Accounts & Reports
const Daybook = React.lazy(() => import('./pages/Daybook'));
const LedgerReport = React.lazy(() => import('./pages/LedgerReport'));
const TrialBalance = React.lazy(() => import('./pages/TrialBalance'));
const ProfitAndLoss = React.lazy(() => import('./pages/ProfitAndLoss'));
const BalanceSheet = React.lazy(() => import('./pages/BalanceSheet'));
const CashFlow = React.lazy(() => import('./pages/CashFlow'));
const BankReconciliation = React.lazy(() => import('./pages/BankReconciliation'));
const Outstanding = React.lazy(() => import('./pages/Outstanding'));

// Pages - VAT & Payroll
const VATComputation = React.lazy(() => import('./pages/VATComputation'));
const VATReturns = React.lazy(() => import('./pages/VATReturns'));
const Employees = React.lazy(() => import('./pages/Employees'));
const SalaryComponents = React.lazy(() => import('./pages/SalaryComponents'));
const SalaryProcessing = React.lazy(() => import('./pages/SalaryProcessing'));
const PayrollReports = React.lazy(() => import('./pages/PayrollReports'));

// Pages - Special Trackers
const CustodyWallets = React.lazy(() => import('./pages/CustodyWallets'));
const CustodyWalletEntry = React.lazy(() => import('./pages/CustodyWalletEntry'));
const WasteTracker = React.lazy(() => import('./pages/WasteTracker'));
const ZakatCalc = React.lazy(() => import('./pages/ZakatCalc'));
const ZATCAIntegration = React.lazy(() => import('./pages/ZATCAIntegration'));
const AdvancedReports = React.lazy(() => import('./pages/AdvancedReports'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const AppSettings = React.lazy(() => import('./pages/AppSettings'));
const Contra = React.lazy(() => import('./pages/Contra'));
const Payment = React.lazy(() => import('./pages/Payment'));
const Receipt = React.lazy(() => import('./pages/Receipt'));
const Journal = React.lazy(() => import('./pages/Journal'));
const PrintInvoice = React.lazy(() => import('./pages/PrintInvoice'));

// Pages - Help & Support
const Help = React.lazy(() => import('./pages/Help'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Deployment = React.lazy(() => import('./pages/Deployment'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = React.lazy(() => import('./pages/TermsAndConditions'));
const BranchDailyClose = React.lazy(() => import('./pages/BranchDailyClose'));
const CustomerBooking = React.lazy(() => import('./pages/CustomerBooking'));
const BookingManagement = React.lazy(() => import('./pages/BookingManagement'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } }
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen w-full bg-background/50 backdrop-blur-sm">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <CurrencyProvider>
              <SubscriptionProvider>
                <ConfirmProvider>
                  <Router>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
                    {/* Public Routes */}
                    <Route path="/Login" element={<Login />} />
                    <Route path="/Signup" element={<Signup />} />
                    <Route path="/ForgotPassword" element={<ForgotPassword />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Layout />}>
                        <Route index element={<Navigate to="/Dashboard" replace />} />
                        <Route path="Dashboard" element={<Dashboard />} />

                        {/* Branch Operations */}
                        <Route path="BranchDailyClose" element={<BranchDailyClose />} />
                        <Route path="CustomerBooking" element={<CustomerBooking />} />
                        <Route path="BookingManagement" element={<BookingManagement />} />

                        {/* --- COMPANY SECTION --- */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER]} />}>
                          <Route path="CompanyInfo" element={<CompanyInfo />} />
                          <Route path="CompanyManagement" element={<CompanyManagement />} />
                          <Route path="Branches" element={<Branches />} />
                          <Route path="Currencies" element={<Currencies />} />
                        </Route>

                        {/* --- MASTERS SECTION --- */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER]} />}>
                          <Route path="AccountGroups" element={<AccountGroups />} />
                          <Route path="Ledgers" element={<Ledgers />} />
                          <Route path="Customers" element={<Customers />} />
                          <Route path="Suppliers" element={<Suppliers />} />
                          <Route path="SupplierComparison" element={<SupplierComparison />} />
                          <Route path="StockGroups" element={<StockGroups />} />
                          <Route path="StockItems" element={<StockItems />} />
                          <Route path="Units" element={<Units />} />
                          <Route path="Godowns" element={<Godowns />} />
                          <Route path="CostCenters" element={<CostCenters />} />
                          <Route path="VoucherTypes" element={<VoucherTypes />} />
                        </Route>

                        {/* --- TRANSACTIONS SECTION --- */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER, ROLES.CASHIER]} />}>
                          <Route path="Sales" element={<Sales />} />
                          <Route path="Purchase" element={<Purchase />} />
                          <Route path="Receipt" element={<Receipt />} />
                          <Route path="ReceiptVoucher" element={<ReceiptVoucher />} />
                          <Route path="Payment" element={<Payment />} />
                          <Route path="PaymentVoucher" element={<PaymentVoucher />} />
                          <Route path="Contra" element={<Contra />} />
                          <Route path="ContraVoucher" element={<ContraVoucher />} />
                          <Route path="Journal" element={<Journal />} />
                          <Route path="JournalVoucher" element={<JournalVoucher />} />
                          <Route path="CreditNote" element={<CreditNote />} />
                          <Route path="CreditNoteForm" element={<CreditNoteForm />} />
                          <Route path="DebitNote" element={<DebitNote />} />
                          <Route path="DebitNoteForm" element={<DebitNoteForm />} />
                          <Route path="SalesOrder" element={<SalesOrder />} />
                          <Route path="SalesOrderForm" element={<SalesOrderForm />} />
                          <Route path="PurchaseOrder" element={<PurchaseOrder />} />
                          <Route path="PurchaseOrderForm" element={<PurchaseOrderForm />} />
                          <Route path="SalesInvoice" element={<SalesInvoice />} />
                          <Route path="PurchaseInvoice" element={<PurchaseInvoice />} />
                          <Route path="PrintInvoice" element={<PrintInvoice />} />
                        </Route>

                        {/* --- INVENTORY SECTION --- */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER]} />}>
                          <Route path="StockSummary" element={<StockSummary />} />
                          <Route path="StockAdjustment" element={<StockAdjustment />} />
                          <Route path="StockItemReport" element={<StockItemReport />} />
                          <Route path="GodownSummary" element={<GodownSummary />} />
                          <Route path="ReorderStatus" element={<ReorderStatus />} />
                        </Route>

                        {/* --- ACCOUNTS & REPORTS --- */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER]} />}>
                          <Route path="Daybook" element={<Daybook />} />
                          <Route path="LedgerReport" element={<LedgerReport />} />
                          <Route path="TrialBalance" element={<TrialBalance />} />
                          <Route path="ProfitAndLoss" element={<ProfitAndLoss />} />
                          <Route path="BalanceSheet" element={<BalanceSheet />} />
                          <Route path="CashFlow" element={<CashFlow />} />
                          <Route path="BankReconciliation" element={<BankReconciliation />} />
                          <Route path="Outstanding" element={<Outstanding />} />
                        </Route>

                        {/* --- VAT & PAYROLL --- */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER]} />}>
                          <Route path="VATComputation" element={<VATComputation />} />
                          <Route path="VATReturns" element={<VATReturns />} />
                          <Route path="Employees" element={<Employees />} />
                          <Route path="SalaryComponents" element={<SalaryComponents />} />
                          <Route path="SalaryProcessing" element={<SalaryProcessing />} />
                          <Route path="PayrollReports" element={<PayrollReports />} />
                        </Route>

                        {/* --- SPECIAL TRACKERS --- */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.OWNER]} />}>
                          <Route path="CustodyWallets" element={<CustodyWallets />} />
                          <Route path="CustodyWalletEntry" element={<CustodyWalletEntry />} />
                        </Route>

                        <Route path="WasteTracker" element={<WasteTracker />} />
                        
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OWNER]} />}>
                          <Route path="ZATCAIntegration" element={<ZATCAIntegration />} />
                          <Route path="ZakatCalc" element={<ZakatCalc />} />
                          <Route path="AdvancedReports" element={<AdvancedReports />} />
                        </Route>

                        {/* --- SETTINGS & CONFIGURATION --- */}
                        <Route path="AppSettings" element={<AppSettings />} />

                        {/* Super Admin Only */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                          <Route path="UserManagement" element={<UserManagement />} />
                          <Route path="Deployment" element={<Deployment />} />
                        </Route>

                        {/* --- HELP & SUPPORT --- */}
                        <Route path="Help" element={<Help />} />
                        <Route path="FAQ" element={<FAQ />} />
                        <Route path="PrivacyPolicy" element={<PrivacyPolicy />} />
                        <Route path="TermsAndConditions" element={<TermsAndConditions />} />
                      </Route>
                    </Route>
                  </Routes>
                </Suspense>
              </Router>
                </ConfirmProvider>
              </SubscriptionProvider>
            </CurrencyProvider>
          </CompanyProvider>
        </AuthProvider>
        <Toaster />
        <SpeedInsights />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
