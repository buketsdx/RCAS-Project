import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Edit2, Trash2, Filter, Download, Printer, ChevronDown, ChevronUp } from 'lucide-react';

import { ThemeToggle } from '@/components/common/ThemeToggle';
export default function Help() {
  const [expanded, setExpanded] = useState({});

  const toggleSection = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tutorials = [
    {
      id: 'dashboard',
      title: '📊 Dashboard Overview',
      description: 'Understanding your business at a glance',
      steps: [
        'The Dashboard is your central command center. It provides a real-time snapshot of your business health.',
        '**Key Metrics Cards:** Located at the top, these show your Total Sales, Total Purchases, Total Receivables (money customers owe you), and Total Payables (money you owe suppliers).',
        '**Financial Graph:** A visual bar chart comparing Sales vs Purchases over the last 6 months to track growth.',
        '**Recent Transactions:** A quick-access list of the 5 most recent entries, allowing you to verify recent activity without searching.',
        '**Low Stock Alerts:** Critical warnings for items that have fallen below their reorder level. Check this daily to avoid stockouts.',
        '**Quick Actions:** Shortcut buttons to immediately create a Sales Invoice, Purchase Bill, or Receipt Voucher.'
      ]
    },
    {
      id: 'company-setup',
      title: '🏢 Company Setup & Management',
      description: 'Creating and managing your business entities',
      steps: [
        '**Creating a Company:** Go to "Company Management" > Click "Add Company". You can manage multiple businesses in one app.',
        '**Required Details:** Fill in the Company Name, Mailing Address, State, and Country accurately.',
        '**Tax Information:** Enter your GSTIN or VAT Number. This will be printed on all your invoices.',
        '**Financial Year:** Set "Books Begin From" (e.g., 1st April). You cannot record transactions dated before this.',
        '**Security:** Set a company-specific password to restrict access to sensitive financial data.',
        '**Logo Setup:** After creating the company, click the "Image" icon to upload and crop your business logo.',
        '**Switching Companies:** Use the dropdown in the top navigation bar or the "Switch" button in the list to toggle between companies.'
      ]
    },
    {
      id: 'masters-inventory',
      title: '📦 Inventory Masters (Stock)',
      description: 'Setting up Products, Units, and Categories',
      steps: [
        '**1. Measurement Units:** Go to Masters > Units. Define how you sell (e.g., "Pcs", "Kg", "Box", "Mtr").',
        '**2. Stock Groups:** Go to Masters > Stock Groups. Create categories to organize items (e.g., "Raw Material", "Finished Goods").',
        '**3. Stock Items:** Go to Masters > Stock Items > Add Item.',
        '• **Name:** Enter the Product Name (e.g., "iPhone 15 Pro").',
        '• **Group:** Link it to a category (e.g., "Mobiles").',
        '• **Unit:** Select the measurement unit.',
        '• **Tax Rate:** Set the default VAT/GST % for this item.',
        '• **Opening Balance:** If you have existing stock, enter the Quantity and Rate.',
        '• **Reorder Level:** Set the minimum quantity to trigger Low Stock Alerts.'
      ]
    },
    {
      id: 'masters-accounting',
      title: '📒 Accounting Masters (Ledgers)',
      description: 'Setting up Customers, Suppliers, and Expenses',
      steps: [
        '**Account Groups:** Pre-defined categories like "Sundry Debtors", "Indirect Expenses". You usually don\'t need to create new groups.',
        '**Creating Ledgers:** Go to Masters > Ledgers > Add Ledger.',
        '**For Customers:** Name the ledger (e.g., "John Doe") and select Group "Sundry Debtors".',
        '**For Suppliers:** Name the ledger (e.g., "ABC Corp") and select Group "Sundry Creditors".',
        '**For Expenses:** Name the ledger (e.g., "Office Rent", "Electricity") and select Group "Indirect Expenses".',
        '**For Bank Accounts:** Name the ledger (e.g., "HDFC Bank") and select Group "Bank Accounts".',
        '**VAT/Tax Info:** For business parties, ensure you enter their VAT/GST Number and Address correctly.'
      ]
    },
    {
      id: 'sales-invoice',
      title: '💰 Creating Sales Invoices (Billing)',
      description: 'Comprehensive guide to billing customers',
      steps: [
        'Navigate to Transactions > Sales Invoice.',
        '**Header Details:**',
        '• **Customer Type:** Select "VAT Customer" for B2B (Business to Business) or "General" for B2C (Retail).',
        '• **Party Name:** Select from the dropdown. If the customer is new, click "+ New Customer" to add them instantly.',
        '• **Invoice Date:** The date of the sale (defaults to today).',
        '**Item Details:**',
        '• Select the Product from the dropdown list.',
        '• Enter Quantity. The Rate is auto-filled from the Item Master but can be edited.',
        '• **Discount:** Enter a percentage or fixed amount if applicable.',
        '• **Tax:** Select the VAT/GST rate. The system calculates the tax amount automatically.',
        '• Click "Add" to insert the item into the invoice.',
        '**Finalization:**',
        '• **Narration:** Add remarks or notes (e.g., "Delivered via Courier").',
        '• **Save:** Click "Save" to finalize. The system generates a unique Invoice Number and reduces stock.',
        '• **Print:** Click the Printer icon on the list view to generate a professional PDF invoice.'
      ]
    },
    {
      id: 'purchase-invoice',
      title: '🛒 Recording Purchases',
      description: 'Entering supplier bills into the system',
      steps: [
        'Navigate to Transactions > Purchase Invoice.',
        '**Supplier Details:** Select your Supplier (Creditor) from the list.',
        '**Ref No:** Enter the Supplier\'s Invoice Number. This is crucial for tracking and reconciliation.',
        '**Ref Date:** Enter the date printed on the Supplier\'s bill.',
        '**Adding Items:** Select items, enter Quantity and Cost Price. This will INCREASE your stock levels.',
        '**Taxation:** Enter the tax amounts as per the bill to ensure accurate accounting.',
        '**Save:** Saving updates your Accounts Payable (money you owe) and Inventory.'
      ]
    },
    {
      id: 'payments-receipts',
      title: '💸 Payments & Receipts',
      description: 'Handling Cash and Bank transactions',
      steps: [
        '**Receipt Voucher:** Use this when you receive money from a customer.',
        '• **Account:** Choose where money is coming in ("Cash" or "Bank").',
        '• **Party:** Choose the Customer who is paying.',
        '• **Amount:** Enter the received amount. This reduces the customer\'s outstanding balance.',
        '**Payment Voucher:** Use this when you pay a supplier or an expense.',
        '• **Account:** Choose source of funds ("Cash" or "Bank").',
        '• **Party:** Choose Supplier (for bills) or Expense Ledger (e.g., Rent).',
        '• **Amount:** Enter the paid amount.',
        '**Contra Voucher:** Use for internal transfers (Cash Deposit to Bank, Cash Withdrawal from Bank).'
      ]
    },
    {
      id: 'reports-guide',
      title: '📈 Financial Reports Guide',
      description: 'How to read and use reports',
      steps: [
        '**Day Book:** A chronological record of every transaction (Sales, Purchase, Receipt, etc.) for a selected date range.',
        '**Ledger Report:** The detailed statement of a specific account. Use this to send statements to customers or reconcile with suppliers.',
        '**Trial Balance:** A summary of all ledger balances. The Debit and Credit totals must match for accurate accounting.',
        '**Profit & Loss:** Shows your Financial Performance. Turnover (Sales) - Cost of Goods - Expenses = Net Profit.',
        '**Balance Sheet:** Shows your Financial Position. Assets (what you own) vs Liabilities (what you owe).',
        '**Stock Summary:** Shows current Quantity, Rate, and Value of all inventory items.',
        '**Exporting:** All reports can be downloaded as Excel or PDF for sharing or offline analysis.'
      ]
    },
    {
      id: 'data-security',
      title: '🛡️ Data Security & Backup',
      description: 'Protecting your business data',
      steps: [
        '**Local Storage:** RCAS stores data securely in your browser\'s local storage. It never leaves your device unless you export it.',
        '**Backup:** Regularly go to Settings > "Export Data". This downloads a JSON file containing all your companies, ledgers, and transactions.',
        '**Restore:** If you switch computers or clear your browser, use Settings > "Import Data" to upload your backup file.',
        '**Company Password:** Set a strong password in Company Management to prevent unauthorized access within the application.',
        '**Warning:** Clearing browser cache/data will delete your records. Always keep a recent backup file!'
      ]
    },
    {
      id: 'keyboard-shortcuts',
      title: '⚡ Keyboard Shortcuts',
      description: 'Speed up your work',
      steps: [
        '**General:**',
        '• **Ctrl + N**: Create New Record (Invoice, Ledger, Item)',
        '• **Ctrl + S**: Save Current Form',
        '• **Ctrl + P**: Print Current View',
        '• **Ctrl + F**: Focus Search Box',
        '• **Esc**: Close Dialogs / Cancel',
        '**Navigation:**',
        '• **Alt + 1**: Go to Dashboard',
        '• **Alt + 2**: Go to Sales',
        '• **Alt + 3**: Go to Purchases',
        '• **Alt + 4**: Go to Ledgers',
        '• **Alt + 5**: Go to Stock Items',
        '**System:**',
        '• **Ctrl + Alt + C**: Switch Company'
      ]
    }
  ,
    {
      id: 'themes',
      title: '🌙 Changing App Theme',
      description: 'How to switch between light and dark modes',
      steps: [
        'Locate the theme toggle button (Sun/Moon icon), usually in the top-right corner of the application header.',
        'Click the button to open a dropdown menu with theme options.',
        '**Light:** Select this to use the light theme.',
        '**Dark:** Select this to use the dark theme.',
        '**System:** Select this to automatically sync with your operating system\'s theme.',
        'Your preference is saved automatically and will be remembered the next time you open the app.'
      ]
    }
];

  return (
    <div>
      <PageHeader
        title="Help & Tutorial"
        subtitle="Learn how to use every feature of RCAS"
        icon={BookOpen}
      >
        {/* Add the ThemeToggle button to your main layout or a shared header component */}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </PageHeader>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to RCAS Help Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 dark:text-slate-200">
              This guide will walk you through every feature of RCAS accounting software. Follow the tutorials below to learn how to use specific features.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>Pro Tip:</strong> Start with the Dashboard Overview, then learn about Masters setup. All other features will make sense once you understand these basics.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tutorials */}
        <div className="space-y-4">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.id} className="overflow-hidden">
              <button
                onClick={() => toggleSection(tutorial.id)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
                    {tutorial.description}
                  </p>
                </div>
                {expanded[tutorial.id] ? (
                  <ChevronUp className="h-5 w-5 text-slate-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0" />
                )}
              </button>

              {expanded[tutorial.id] && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50">
                  <ol className="space-y-3">
                    {tutorial.steps.map((step, index) => (
                      <li key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 pt-0.5">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Quick Reference Cards */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Button Reference Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  Add Button
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-200 text-sm">
                  <strong>Purpose:</strong> Create new records<br/>
                  <strong>Look for:</strong> Green button usually at top-right<br/>
                  <strong>Action:</strong> Opens a form to fill new data
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-blue-500" />
                  Edit Button
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-200 text-sm">
                  <strong>Purpose:</strong> Modify existing records<br/>
                  <strong>Look for:</strong> Pencil icon on each row<br/>
                  <strong>Action:</strong> Opens form with current values
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Delete Button
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-200 text-sm">
                  <strong>Purpose:</strong> Remove records permanently<br/>
                  <strong>Look for:</strong> Trash icon on each row<br/>
                  <strong>Action:</strong> Asks for confirmation before deleting
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-500" />
                  Search Box
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-200 text-sm">
                  <strong>Purpose:</strong> Find records quickly<br/>
                  <strong>Look for:</strong> Search icon at top of tables<br/>
                  <strong>Action:</strong> Type to filter results instantly
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-indigo-500" />
                  Download Button
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-200 text-sm">
                  <strong>Purpose:</strong> Export data to file<br/>
                  <strong>Look for:</strong> Download icon on reports<br/>
                  <strong>Action:</strong> Saves as PDF or Excel format
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-orange-500" />
                  Print Button
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-200 text-sm">
                  <strong>Purpose:</strong> Print records<br/>
                  <strong>Look for:</strong> Printer icon on reports<br/>
                  <strong>Action:</strong> Opens print dialog
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-8 border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-4">💡 Pro Tips for Success</h3>
          <ul className="space-y-3 text-emerald-900 dark:text-emerald-100">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <span>Always set up Masters (Account Groups, Ledgers, Stock Groups) before creating transactions</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <span>Use consistent naming for ledgers and accounts to avoid confusion</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <span>Regularly backup your data using the export function in Settings</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">4.</span>
              <span>Use the search feature to quickly find records instead of scrolling</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">5.</span>
              <span>Keep your device browser cache clear monthly for optimal performance</span>
            </li>
          </ul>
        </div>

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-200 mb-4">
              If you can't find the answer here, our support team is ready to help!
            </p>
            <div className="flex gap-4">
              <a href="mailto:support@rcas.com">
                <Button>Email Support</Button>
              </a>
              <a href="https://github.com/rcas/issues" target="_blank" rel="noopener noreferrer">
                <Button variant="outline">Report Issue on GitHub</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
