import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';

// Placeholder Component (Taaki blank screen na aaye jab tak asli file na bane)
const Page = ({ title }) => (
  <div className="bg-white rounded-2xl p-10 border border-slate-100 text-center shadow-sm">
    <div className="text-4xl mb-4 text-emerald-500">🏗️</div>
    <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
    <p className="text-slate-500 mt-2">Rustam bhai, is page ka asli code abhi lagana baaki hai.</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Main Layout: Sidebar hamesha dikhta rahega */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="Dashboard" element={<Dashboard />} />

            {/* --- COMPANY SECTION --- */}
            <Route path="CompanyInfo" element={<Page title="Company Information" />} />
            <Route path="Branches" element={<Page title="Branches Management" />} />
            <Route path="Currencies" element={<Page title="Currencies" />} />

            {/* --- MASTERS SECTION --- */}
            <Route path="AccountGroups" element={<Page title="Account Groups" />} />
            <Route path="Ledgers" element={<Page title="Ledgers Master" />} />
            <Route path="StockGroups" element={<Page title="Stock Groups" />} />
            <Route path="StockItems" element={<Page title="Stock Items" />} />
            <Route path="Units" element={<Page title="Measurement Units" />} />
            <Route path="Godowns" element={<Page title="Godowns / Warehouse" />} />
            <Route path="CostCenters" element={<Page title="Cost Centers" />} />
            <Route path="VoucherTypes" element={<Page title="Voucher Types" />} />

            {/* --- TRANSACTIONS SECTION --- */}
            <Route path="Sales" element={<Page title="Sales Register" />} />
            <Route path="Purchase" element={<Page title="Purchase Register" />} />
            <Route path="Receipt" element={<Page title="Receipt Voucher" />} />
            <Route path="Payment" element={<Page title="Payment Voucher" />} />
            <Route path="Contra" element={<Page title="Contra Entry" />} />
            <Route path="Journal" element={<Page title="Journal Voucher" />} />
            <Route path="CreditNote" element={<Page title="Credit Note" />} />
            <Route path="DebitNote" element={<Page title="Debit Note" />} />
            <Route path="SalesOrder" element={<Page title="Sales Order" />} />
            <Route path="PurchaseOrder" element={<Page title="Purchase Order" />} />

            {/* --- INVENTORY SECTION --- */}
            <Route path="StockSummary" element={<Page title="Stock Summary" />} />
            <Route path="StockItemReport" element={<Page title="Stock Item Report" />} />
            <Route path="GodownSummary" element={<Page title="Godown Summary" />} />
            <Route path="ReorderStatus" element={<Page title="Reorder Status" />} />

            {/* --- ACCOUNTS & REPORTS --- */}
            <Route path="DayBook" element={<Page title="Day Book" />} />
            <Route path="LedgerReport" element={<Page title="Ledger Reports" />} />
            <Route path="TrialBalance" element={<Page title="Trial Balance" />} />
            <Route path="ProfitAndLoss" element={<Page title="Profit & Loss Account" />} />
            <Route path="BalanceSheet" element={<Page title="Balance Sheet" />} />
            <Route path="CashFlow" element={<Page title="Cash Flow Statement" />} />
            <Route path="BankReconciliation" element={<Page title="Bank Reconciliation" />} />
            <Route path="Outstanding" element={<Page title="Outstanding Reports" />} />

            {/* --- VAT & PAYROLL --- */}
            <Route path="VATComputation" element={<Page title="VAT Computation" />} />
            <Route path="VATReturns" element={<Page title="VAT Returns" />} />
            <Route path="Employees" element={<Page title="Employee Management" />} />
            <Route path="SalaryComponents" element={<Page title="Salary Components" />} />
            <Route path="SalaryProcessing" element={<Page title="Salary Processing" />} />
            <Route path="PayrollReports" element={<Page title="Payroll Reports" />} />

            {/* --- SPECIAL TRACKERS --- */}
            <Route path="CustodyWallets" element={<Page title="Custody Wallets" />} />
            <Route path="FlowerWasteTracker" element={<Page title="Flower Waste Tracker" />} />
            <Route path="ZATCAIntegration" element={<Page title="ZATCA e-Invoice" />} />
            <Route path="AdvancedReports" element={<Page title="Advanced Reports" />} />
            <Route path="AppSettings" element={<Page title="System Settings" />} />

            {/* Catch-all for unknown routes */}
            <Route path="*" element={<Page title="Page Under Construction" />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;