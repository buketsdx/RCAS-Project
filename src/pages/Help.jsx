import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Edit2, Trash2, Save, Filter, Download, Printer, ChevronDown, ChevronUp } from 'lucide-react';

export default function Help() {
  const [expanded, setExpanded] = useState({});

  const toggleSection = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const tutorials = [
    {
      id: 'dashboard',
      title: '📊 Dashboard Overview',
      description: 'Get started with the main dashboard',
      steps: [
        'The Dashboard shows you a complete overview of your business',
        'View key statistics, recent transactions, and important alerts',
        'Quick access cards let you jump to frequently used features',
        'All data updates in real-time as you make changes'
      ]
    },
    {
      id: 'company-management',
      title: '🏢 Managing Multiple Companies',
      description: 'How to work with multiple companies in RCAS',
      steps: [
        'Click "Company Management" from the sidebar to manage companies',
        'View all your companies in the table with details like name, type, and status',
        'Click "Add" button to create a new company - fill in company name, type, GST, contact info, etc.',
        'Each company can have its own password for extra security (optional)',
        'Click the "Edit" button (pencil icon) to modify company details',
        'Click the "Switch" button to quickly switch to that company',
        'Once switched, all data (branches, ledgers, invoices) belong only to that company',
        'Your current company is displayed in the top navigation bar',
        'All new records created will automatically belong to the active company'
      ]
    },
    {
      id: 'company-switching',
      title: '🔄 Switching Between Companies',
      description: 'How to change your active company quickly',
      steps: [
        'Look at the top navigation bar - you\'ll see your current company name',
        'Click the company name or the dropdown arrow to see all available companies',
        'Click on any company to switch to it',
        'If the company has a password, a dialog will appear asking for verification',
        'Enter the correct password and click "Verify" to switch',
        'You can also use the keyboard shortcut: Ctrl + Alt + C to open company switcher',
        'After switching, all lists automatically filter to show only that company\'s data',
        'Your last selected company is remembered when you close and reopen the app'
      ]
    },
    {
      id: 'company-password',
      title: '🔐 Setting Up Company Password Protection',
      description: 'How to secure individual companies with passwords',
      steps: [
        'Go to Company Management from the sidebar',
        'Click "Edit" on the company you want to protect',
        'Scroll down to the "Password" field in the form',
        'Enter a strong password (optional - leave blank if no protection needed)',
        'Click "Update" to save the changes',
        'From now on, whenever anyone tries to switch to this company, they\'ll need to enter the password',
        'The password dialog appears and requires correct entry before switching',
        'You can remove the password anytime by editing the company and clearing the password field',
        'Passwords are stored securely and are required every time company is switched'
      ]
    },
    {
      id: 'logo-upload',
      title: '🎨 Uploading Company Logo',
      description: 'How to upload and customize your company logo',
      steps: [
        'Go to Company Info from the sidebar',
        'Select the company you want to add logo for using the dropdown',
        'Click on the "Logo" section or the "Upload Logo" button',
        'Select an image file from your computer (JPG, PNG, etc.)',
        'The image appears in the editor preview window',
        'You can now edit the image using various tools before saving'
      ]
    },
    {
      id: 'logo-editor',
      title: '🖼️ Image Editor - Crop and Adjust',
      description: 'How to crop and adjust your company logo',
      steps: [
        'After uploading an image, the Image Editor dialog opens',
        'Use the "Brightness" slider to make image lighter or darker',
        'Use the "Contrast" slider to increase or decrease color difference',
        'Use the "Saturation" slider to make colors more or less vivid',
        'Use the "Rotation" slider to rotate the image (0° to 360°)',
        'Use the "Scale" slider to zoom in or out on the image',
        'To crop: Click "Enable Crop" button to activate crop tool',
        'Drag on the preview to draw a crop box around the part you want to keep',
        'Use corner handles to resize the crop area, or drag inside to move it',
        'Once satisfied with the crop, click "Apply Crop"',
        'Click "Save Logo" to store the edited image with your company',
        'The logo appears throughout the app on invoices and reports'
      ]
    },
    {
      id: 'company-data-separation',
      title: '📋 Understanding Company-Specific Data',
      description: 'How data is organized by company',
      steps: [
        'Each company has completely separate data - no mixing between companies',
        'When you create Branches, they belong only to the selected company',
        'When you add Ledgers, they are specific to that company',
        'Invoices, sales orders, and all transactions are company-specific',
        'When you switch companies, all lists automatically show only that company\'s data',
        'This ensures financial records are kept separate and organized by company',
        'If a company is missing data, it\'s probably because it was created in a different company context',
        'Always check the top navigation bar to confirm which company you\'re working with'
      ]
    },
    {
      id: 'masters',
      title: '🏢 Setting Up Masters (Account Groups, Ledgers, etc.)',
      description: 'How to configure your business masters',
      steps: [
        'Go to Masters section from sidebar',
        'Make sure you\'ve selected the correct company (check top navigation)',
        'Start with Account Groups - define your chart of accounts',
        'Add Ledgers for each account you want to track (they\'ll be linked to your company)',
        'Configure Stock Groups and Stock Items for inventory',
        'Set up Measurement Units for your products',
        'Add Branches - these will be filtered by your current company',
        'Add Godowns (warehouses) if you have multiple storage locations',
        'Define Cost Centers for better expense tracking',
        'Create Voucher Types for different transaction types',
        'All masters created here belong to the currently selected company'
      ]
    },
    {
      id: 'branches-company',
      title: '🏭 Managing Branches Per Company',
      description: 'How to set up branches for each company',
      steps: [
        'Go to Branches from the Masters section',
        'The list shows only branches for your currently selected company',
        'Click "Add" to create a new branch for this company',
        'Fill in branch name, location, and other details',
        'The company will be automatically assigned (pre-filled)',
        'Click "Create" to save the branch',
        'Edit existing branches with the "Edit" button',
        'Delete branches with the "Delete" button if no longer needed',
        'When you switch companies, the branch list updates to show only that company\'s branches',
        'This helps organize locations by company effectively'
      ]
    },
    {
      id: 'add-data',
      title: '➕ Adding New Records (Add Button)',
      description: 'How to add new data to your system',
      steps: [
        'Look for the "Add" button (usually green, top-right of lists)',
        'Click the "Add" button to open a form dialog',
        'Fill in all required fields (marked with *)',
        'Optional fields can be left blank',
        'The company will be auto-filled with your currently selected company',
        'Click "Create" button to save the new record',
        'You\'ll see a success message once saved',
        'The new record appears at the top of the list and belongs to this company'
      ]
    },
    {
      id: 'edit-data',
      title: '✏️ Editing Existing Records (Edit Button)',
      description: 'How to modify existing data',
      steps: [
        'Find the record you want to edit in the list',
        'Click the Edit button (pencil icon) on that row',
        'The form opens with current values pre-filled',
        'Modify the fields you want to change',
        'Click "Update" button to save changes',
        'Confirmation message appears when update is successful',
        'The list refreshes automatically'
      ]
    },
    {
      id: 'delete-data',
      title: '🗑️ Deleting Records (Delete Button)',
      description: 'How to remove records from your system',
      steps: [
        'Find the record you want to delete in the list',
        'Click the Delete button (trash icon) on that row',
        'A confirmation dialog will appear asking "Are you sure?"',
        'Click "Delete" to confirm or cancel to abort',
        'The record is permanently removed',
        'A success message confirms the deletion',
        'Be careful - deleted records cannot be recovered'
      ]
    },
    {
      id: 'search-filter',
      title: '🔍 Searching and Filtering Data',
      description: 'How to find what you need quickly',
      steps: [
        'Each list has a search box (with magnifying glass icon)',
        'Type any text to search - results update instantly',
        'Search works across all columns',
        'Clear the search box to see all records again',
        'Results show pagination at the bottom',
        'Use arrow buttons to navigate between pages',
        'Page size can be adjusted in settings'
      ]
    },
    {
      id: 'transactions',
      title: '💳 Creating Transactions (Sales, Purchase, Vouchers)',
      description: 'How to record business transactions',
      steps: [
        'Go to Transactions section',
        'Select the type of transaction (Sales Invoice, Purchase, etc.)',
        'Click "Add" or "New" button',
        'Select customer/vendor from dropdown',
        'Add line items - select product, quantity, rate',
        'System calculates totals automatically',
        'Add notes or references if needed',
        'Click "Save" to record the transaction',
        'Print or email directly from the view',
        'Transaction belongs to your currently selected company'
      ]
    },
    {
      id: 'keyboard-shortcuts-full',
      title: '⌨️ Complete Keyboard Shortcuts Guide',
      description: 'All available keyboard shortcuts for faster data entry',
      steps: [
        '▶ DATA ENTRY SHORTCUTS:',
        '  • Ctrl + N = Create new record (in most pages)',
        '  • Ctrl + S = Save current form/transaction',
        '  • Ctrl + E = Edit selected record',
        '  • Alt + D = Duplicate selected record',
        '  • Alt + L = Show line items in transactions',
        '',
        '▶ NAVIGATION SHORTCUTS:',
        '  • Alt + 1 = Go to Dashboard',
        '  • Alt + 2 = Go to Ledgers',
        '  • Alt + 3 = Go to Stock Items',
        '  • Alt + 4 = Go to Customers',
        '  • Alt + 5 = Go to Suppliers',
        '  • Alt + 6 = Go to Reports',
        '  • Alt + 7 = Go to Settings',
        '  • Home = Scroll to top of page',
        '  • Ctrl + Alt + C = Open company switcher',
        '',
        '▶ UTILITY SHORTCUTS:',
        '  • Ctrl + F = Open search in page',
        '  • Ctrl + P = Print current page',
        '  • F5 = Refresh current page',
        '  • Esc = Close dialog/modal',
        '  • Shift + ? = Show this shortcuts dialog',
        '  • Tab = Move to next form field',
        '  • Shift + Tab = Move to previous form field',
        '  • Enter = Submit form or confirm action',
        '',
        '▶ PRO TIPS:',
        '  • Combine shortcuts for speed: Ctrl+N then Ctrl+S',
        '  • Use Alt+2-5 to jump between main pages quickly',
        '  • Open shortcuts reference anytime with Shift+?'
      ]
    },
    {
      id: 'reports',
      title: '📈 Viewing Reports and Analytics',
      description: 'How to get insights from your data',
      steps: [
        'Go to Accounts & Reports section',
        'Select the report you want to view',
        'Choose date range if required (reports show only selected company data)',
        'Add filters if you want specific data',
        'View the report on screen',
        'Click Download button to export as PDF or Excel',
        'Click Print button to print the report',
        'Some reports have interactive charts',
        'All reports are automatically filtered by your selected company'
      ]
    },
    {
      id: 'themes',
      title: '🌙 Changing App Theme',
      description: 'How to switch between light and dark modes',
      steps: [
        'Scroll to the bottom of the page to find Footer',
        'Look for "Appearance" section in footer',
        'Click "System" to auto-detect your device theme',
        'Click "Light" to use light mode always',
        'Click "Dark" to use dark mode always',
        'Your preference is saved automatically',
        'Theme applies immediately across entire app',
        'Works even after you close and reopen the app'
      ]
    },
    {
      id: 'data-backup',
      title: '💾 Data Backup and Safety',
      description: 'How your data is protected',
      steps: [
        'All data is saved in your browser\'s local storage',
        'Your data never leaves your computer',
        'No cloud upload unless you export',
        'To backup: Go to Settings > Export Data',
        'Choose what to export (all or specific entities)',
        'Download the JSON file to your computer',
        'To restore: Go to Settings > Import Data',
        'Select the backup file and click Import',
        'Clear browser data will delete all records'
      ]
    }
  ];

  return (
    <div>
      <PageHeader
        title="Help & Tutorial"
        subtitle="Learn how to use every feature of RCAS"
        icon={BookOpen}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to RCAS Help Center</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300">
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
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
                        <p className="text-slate-700 dark:text-slate-300 pt-0.5">
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
                <p className="text-slate-600 dark:text-slate-300 text-sm">
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
                <p className="text-slate-600 dark:text-slate-300 text-sm">
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
                <p className="text-slate-600 dark:text-slate-300 text-sm">
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
                <p className="text-slate-600 dark:text-slate-300 text-sm">
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
                <p className="text-slate-600 dark:text-slate-300 text-sm">
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
                <p className="text-slate-600 dark:text-slate-300 text-sm">
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
            <p className="text-slate-600 dark:text-slate-300 mb-4">
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
