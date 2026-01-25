import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { CompanyProvider } from '@/context/CompanyContext';
import '@emran-alhaddad/saudi-riyal-font/index.css';
import Layout from './Layout';

// Pages - Dashboard
import Dashboard from './pages/Dashboard';

// Pages - Company Section
import CompanyInfo from './pages/CompanyInfo';
import CompanyManagement from './pages/CompanyManagement';
import Branches from './pages/Branches';
import Currencies from './pages/Currencies';

// Pages - Masters Section
import AccountGroups from './pages/AccountGroups';
import Ledgers from './pages/Ledgers';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import StockGroups from './pages/StockGroups';
import StockItems from './pages/StockItems';
import Units from './pages/Units';
import Godowns from './pages/Godowns';
import CostCenters from './pages/CostCenters';
import VoucherTypes from './pages/VoucherTypes';

// Pages - Transactions Section
import Sales from './pages/Sales';
import Purchase from './pages/Purchase';
import ReceiptVoucher from './pages/ReceiptVoucher';
import PaymentVoucher from './pages/PaymentVoucher';
import ContraVoucher from './pages/ContraVoucher';
import JournalVoucher from './pages/JournalVoucher';
import CreditNote from './pages/CreditNote';
import CreditNoteForm from './pages/CreditNoteForm';
import DebitNote from './pages/DebitNote';
import DebitNoteForm from './pages/DebitNoteForm';
import SalesOrder from './pages/SalesOrder';
import SalesOrderForm from './pages/SalesOrderForm';
import PurchaseOrder from './pages/PurchaseOrder';
import PurchaseOrderForm from './pages/PurchaseOrderForm';
import SalesInvoice from './pages/SalesInvoice';
import PurchaseInvoice from './pages/PurchaseInvoice';

// Pages - Inventory Section
import StockSummary from './pages/StockSummary';
import StockItemReport from './pages/StockItemReport';
import GodownSummary from './pages/GodownSummary';
import ReorderStatus from './pages/ReorderStatus';

// Pages - Accounts & Reports
import Daybook from './pages/Daybook';
import LedgerReport from './pages/LedgerReport';
import TrialBalance from './pages/TrialBalance';
import ProfitAndLoss from './pages/ProfitAndLoss';
import BalanceSheet from './pages/BalanceSheet';
import CashFlow from './pages/CashFlow';
import BankReconciliation from './pages/BankReconciliation';
import Outstanding from './pages/Outstanding';

// Pages - VAT & Payroll
import VATComputation from './pages/VATComputation';
import VATReturns from './pages/VATReturns';
import Employees from './pages/Employees';
import SalaryComponents from './pages/SalaryComponents';
import SalaryProcessing from './pages/SalaryProcessing';
import PayrollReprts from './pages/PayrollReprts';

// Pages - Special Trackers
import CustodyWallets from './pages/CustodyWallets';
import CustodyWalletEntry from './pages/CustodyWalletEntry';
import FlowerWasteTracker from './pages/FlowerWasteTracker';
import ZATCAIntegration from './pages/ZATCAIntegration';
import AdvancedReports from './pages/AdvancedReports';
import AppSettings from './pages/AppSettings';
import Contra from './pages/Contra';
import Payment from './pages/Payment';
import Receipt from './pages/Receipt';
import Journal from './pages/Journal';
import PrintInvoice from './pages/PrintInvoice';

// Pages - Help & Support
import Help from './pages/Help';
import FAQ from './pages/FAQ';
import Deployment from './pages/Deployment';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <ThemeProvider>
          <CompanyProvider>
            <Router>
              <Routes>
          {/* Main Layout: Sidebar hamesha dikhta rahega */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="Dashboard" element={<Dashboard />} />

            {/* --- COMPANY SECTION --- */}
            <Route path="CompanyInfo" element={<CompanyInfo />} />
            <Route path="CompanyManagement" element={<CompanyManagement />} />
            <Route path="Branches" element={<Branches />} />
            <Route path="Currencies" element={<Currencies />} />

            {/* --- MASTERS SECTION --- */}
            <Route path="AccountGroups" element={<AccountGroups />} />
            <Route path="Ledgers" element={<Ledgers />} />
            <Route path="Customers" element={<Customers />} />
            <Route path="Suppliers" element={<Suppliers />} />
            <Route path="StockGroups" element={<StockGroups />} />
            <Route path="StockItems" element={<StockItems />} />
            <Route path="Units" element={<Units />} />
            <Route path="Godowns" element={<Godowns />} />
            <Route path="CostCenters" element={<CostCenters />} />
            <Route path="VoucherTypes" element={<VoucherTypes />} />

            {/* --- TRANSACTIONS SECTION --- */}
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

            {/* --- INVENTORY SECTION --- */}
            <Route path="StockSummary" element={<StockSummary />} />
            <Route path="StockItemReport" element={<StockItemReport />} />
            <Route path="GodownSummary" element={<GodownSummary />} />
            <Route path="ReorderStatus" element={<ReorderStatus />} />

            {/* --- ACCOUNTS & REPORTS --- */}
            <Route path="Daybook" element={<Daybook />} />
            <Route path="LedgerReport" element={<LedgerReport />} />
            <Route path="TrialBalance" element={<TrialBalance />} />
            <Route path="ProfitAndLoss" element={<ProfitAndLoss />} />
            <Route path="BalanceSheet" element={<BalanceSheet />} />
            <Route path="CashFlow" element={<CashFlow />} />
            <Route path="BankReconciliation" element={<BankReconciliation />} />
            <Route path="Outstanding" element={<Outstanding />} />

            {/* --- VAT & PAYROLL --- */}
            <Route path="VATComputation" element={<VATComputation />} />
            <Route path="VATReturns" element={<VATReturns />} />
            <Route path="Employees" element={<Employees />} />
            <Route path="SalaryComponents" element={<SalaryComponents />} />
            <Route path="SalaryProcessing" element={<SalaryProcessing />} />
            <Route path="PayrollReprts" element={<PayrollReprts />} />
            <Route path="PayrollReports" element={<PayrollReprts />} />

            {/* --- SPECIAL TRACKERS --- */}
            <Route path="CustodyWallets" element={<CustodyWallets />} />
            <Route path="CustodyWalletEntry" element={<CustodyWalletEntry />} /> {/*Custody Wallet Entry Route Added*/}
            <Route path="FlowerWasteTracker" element={<FlowerWasteTracker />} />
            <Route path="ZATCAIntegration" element={<ZATCAIntegration />} />
            <Route path="AdvancedReports" element={<AdvancedReports />} />
            <Route path="AppSettings" element={<AppSettings />} />
            {/* --- HELP & SUPPORT --- */}
            <Route path="Help" element={<Help />} />
            <Route path="FAQ" element={<FAQ />} />
            <Route path="Deployment" element={<Deployment />} />
          </Route>
        </Routes>
      </Router>
          </CompanyProvider>
      </ThemeProvider>
    </CurrencyProvider>
    </QueryClientProvider>
  );
}

export default App;