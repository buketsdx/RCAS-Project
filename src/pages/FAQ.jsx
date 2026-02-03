import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const [expanded, setExpanded] = useState({});

  const toggleFAQ = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const faqCategories = [
    {
      category: 'Getting Started',
      questions: [
        {
          id: 'gs1',
          q: 'Is RCAS really free?',
          a: 'Yes! RCAS is completely free and open source. You can use it for lifetime without any cost or restrictions. No hidden charges, no premium version. We rely on community support and donations to keep development active.'
        },
        {
          id: 'gs2',
          q: 'Do I need to install anything?',
          a: 'No installation needed! RCAS is a web application that runs directly in your browser. Just open the URL and start using it. No servers, no complex setup.'
        },
        {
          id: 'gs3',
          q: 'Is my data secure?',
          a: 'Yes! Your data stays on your computer. It\'s stored in your browser\'s local storage. Your data never goes to any server unless you explicitly export it. You have complete control.'
        },
        {
          id: 'gs4',
          q: 'Can I use RCAS offline?',
          a: 'Yes! Once loaded, RCAS works completely offline. You can continue working even if internet is disconnected. Changes sync when you come back online.'
        }
      ]
    },
    {
      category: 'Data & Storage',
      questions: [
        {
          id: 'ds1',
          q: 'Where is my data stored?',
          a: 'By default, data is stored in your browser (LocalStorage). However, you can now connect to external databases like Supabase (PostgreSQL), Firebase (Firestore), or your own SQL server via the Settings > Database tab.'
        },
        {
          id: 'ds2',
          q: 'Can I connect to MySQL, MSSQL, or MongoDB?',
          a: 'Yes! Use the "Custom REST API" option in Database Settings. You will need a backend API that talks to your database. We provide a standard API structure you can implement.'
        },
        {
          id: 'ds3',
          q: 'What happens if I clear browser data?',
          a: 'If using LocalStorage, your data will be deleted (unless backed up). If using Supabase/Firebase/SQL, your data is safe on the server and will reappear when you log in again.'
        },
        {
          id: 'ds4',
          q: 'How do I backup my data?',
          a: 'For LocalStorage: Go to Settings > Export Data. For External Databases: Use the backup tools provided by your database provider (e.g., Supabase dashboard).'
        },
        {
          id: 'ds5',
          q: 'How do I restore from backup?',
          a: 'Go to Settings > Import Data to restore JSON backups to LocalStorage. For external databases, use their respective import tools.'
        }
      ]
    },
    {
      category: 'Deployment & Online',
      questions: [
        {
          id: 'dep1',
          q: 'Can I host this on XAMPP?',
          a: 'Yes! Build the project (`npm run build`) and copy the `dist` folder to `htdocs`. We include an `.htaccess` file to handle routing automatically.'
        },
        {
          id: 'dep2',
          q: 'How do I access my local XAMPP site from the internet?',
          a: 'Use Cloudflare Tunnel. Run `cloudflared tunnel --url http://localhost:80`. It gives you a secure public URL (https://...) to share with others.'
        },
        {
          id: 'dep3',
          q: 'Can multiple people use it at the same time?',
          a: 'If you use an external database (Supabase/Firebase/SQL), yes! Multiple users can connect to the same database and see live updates.'
        }
      ]
    },
    {
      category: 'Features & Usage',
      questions: [
        {
          id: 'fu1',
          q: 'How many records can I store?',
          a: 'Browser storage typically allows 5-10MB of data. This can store thousands of transactions. Exact limit depends on your browser and device.'
        },
        {
          id: 'fu2',
          q: 'Can I create custom reports?',
          a: 'The built-in reports cover most business needs. For custom reports, export data to Excel and create pivot tables. Advanced features coming soon!'
        },
        {
          id: 'fu3',
          q: 'Can multiple users access the same data?',
          a: 'Currently RCAS is single-user per browser. However, you can have multiple companies and switch between them. Each company can have a password for security.'
        },
        {
          id: 'fu4',
          q: 'How do I print invoices?',
          a: 'Open any invoice/voucher, click the Print button. Your browser\'s print dialog opens. Customize and print to PDF or paper. Professional formatting included.'
        },
        {
          id: 'fu5',
          q: 'Can I email invoices to customers?',
          a: 'Export to PDF and email manually for now. Email integration is coming in future updates. Subscribe to GitHub for announcements.'
        }
      ]
    },
    {
      category: 'Company Management',
      questions: [
        {
          id: 'cm1',
          q: 'Can I manage multiple companies in RCAS?',
          a: 'Yes! RCAS supports multiple companies. Go to Company Management from sidebar. Each company is completely separate with its own data, branches, ledgers, and invoices. Switch between companies anytime.'
        },
        {
          id: 'cm2',
          q: 'How do I switch between companies?',
          a: 'Look at the top navigation bar to see your current company. Click the company name to see all available companies. Select the one you want to switch to. If it has a password, you\'ll need to enter it. You can also use Ctrl+Alt+C keyboard shortcut.'
        },
        {
          id: 'cm3',
          q: 'Can I password protect a company?',
          a: 'Yes! Go to Company Management, edit a company, add a password, and save. From now on, anyone switching to that company must enter the correct password. This is optional - leave password blank for no protection.'
        },
        {
          id: 'cm4',
          q: 'Is data truly separate between companies?',
          a: 'Completely separate! When you switch companies, all lists (branches, ledgers, invoices) show only that company\'s data. New records automatically belong to the active company. No data mixing or cross-contamination.'
        },
        {
          id: 'cm5',
          q: 'Why don\'t my branches appear after switching companies?',
          a: 'Branches are filtered by company. If you switched companies and don\'t see branches, they were created in a different company. Switch back to the original company to find them, or create new branches in the current company.'
        },
        {
          id: 'cm6',
          q: 'How do I create a new company?',
          a: 'Go to Company Management from sidebar. Click "Add" button. Fill in company name, type (Sole Proprietor, Partnership, etc.), GST number, contact details, and other info. Click "Create". New company is ready to use immediately.'
        }
      ]
    },
    {
      category: 'Logo Upload & Image Editing',
      questions: [
        {
          id: 'logo1',
          q: 'How do I upload a company logo?',
          a: 'Go to Company Info from sidebar. Select your company. Click the Logo section or "Upload Logo" button. Choose an image from your computer (JPG, PNG, etc.). The image editor opens automatically. Edit as needed, then save.'
        },
        {
          id: 'logo2',
          q: 'Can I crop my logo image?',
          a: 'Yes! After uploading, click "Enable Crop" in the image editor. Draw a box on the image by dragging. Resize with corner handles. Move the crop area as needed. Click "Apply Crop" when satisfied.'
        },
        {
          id: 'logo3',
          q: 'What adjustments can I make to my logo?',
          a: 'Brightness - make it lighter or darker. Contrast - adjust color difference. Saturation - make colors more or less vivid. Rotation - rotate the image 0-360°. Scale - zoom in or out. All sliders preview in real-time.'
        },
        {
          id: 'logo4',
          q: 'How do I rotate my logo?',
          a: 'In the Image Editor, use the "Rotation" slider. Drag it left (counter-clockwise) or right (clockwise). You can set any rotation between 0-360°. Changes preview instantly. Click "Save Logo" when done.'
        },
        {
          id: 'logo5',
          q: 'Can I resize the logo?',
          a: 'In the Image Editor, use the "Scale" slider to zoom in/out on the image. Combined with crop tool, you can resize the final logo. Preview updates instantly.'
        }
      ]
    },
    {
      category: 'Keyboard Shortcuts',
      questions: [
        {
          id: 'kb1',
          q: 'What keyboard shortcuts are available?',
          a: 'Many! Press Shift+? anytime to see the complete shortcuts reference. Main ones: Ctrl+N (new), Ctrl+S (save), Ctrl+E (edit), Alt+1-7 (navigation), Ctrl+Alt+C (company switcher). See Help > Keyboard Shortcuts Guide for complete list.'
        },
        {
          id: 'kb2',
          q: 'How do I create a new record with keyboard?',
          a: 'Press Ctrl+N on most pages. The "Add" form opens. Fill details and press Ctrl+S to save. Or use Tab to navigate fields and Enter to confirm. Much faster than mouse clicking!'
        },
        {
          id: 'kb3',
          q: 'Can I navigate between pages with keyboard?',
          a: 'Yes! Press Alt+1 for Dashboard, Alt+2 for Ledgers, Alt+3 for Stock, Alt+4 for Customers, Alt+5 for Suppliers, Alt+6 for Reports, Alt+7 for Settings. No mouse needed!'
        },
        {
          id: 'kb4',
          q: 'How do I switch companies with keyboard?',
          a: 'Press Ctrl+Alt+C to open company switcher. Use arrow keys to select company. Press Enter to switch. If password is set, type it and press Enter. Very fast for switching between companies!'
        },
        {
          id: 'kb5',
          q: 'What is the shortcut to see all shortcuts?',
          a: 'Press Shift+? (Shift + forward slash) anytime to open the keyboard shortcuts reference dialog. Shows all available shortcuts organized by category.'
        }
      ]
    },
    {
      category: 'Technical',
      questions: [
        {
          id: 'tech1',
          q: 'What browsers are supported?',
          a: 'Chrome, Firefox, Safari, Edge - all modern browsers. Requires JavaScript enabled. For best experience, use latest browser version.'
        },
        {
          id: 'tech2',
          q: 'Will RCAS work on mobile?',
          a: 'Yes! Responsive design works on phones and tablets. Not optimized for small screens yet. Desktop experience recommended for data entry.'
        },
        {
          id: 'tech3',
          q: 'How often is RCAS updated?',
          a: 'Regular updates based on community feedback. Check GitHub for latest version. Updates are backward compatible - your data stays safe.'
        },
        {
          id: 'tech4',
          q: 'Can I host RCAS on my own server?',
          a: 'Yes! RCAS is open source. Download from GitHub and deploy on your server. Full instructions in deployment guide. Community support available.'
        }
      ]
    },
    {
      category: 'Troubleshooting',
      questions: [
        {
          id: 'ts1',
          q: 'Data is not saving - what do I do?',
          a: 'Check if localStorage is enabled in your browser. Clear cache and reload. Try a different browser. Contact support if problem persists.'
        },
        {
          id: 'ts2',
          q: 'Form is slow or unresponsive',
          a: 'If you have too much data, browser might slow down. Clear old records. Export data, clear browser data, import fresh data. Use latest browser version.'
        },
        {
          id: 'ts3',
          q: 'Numbers not calculating correctly',
          a: 'Clear browser cache and reload. Check decimal formats. Try switching theme and back. Report bug on GitHub with details.'
        },
        {
          id: 'ts4',
          q: 'Page says "No routes matched"',
          a: 'This is a navigation error. Go back to Dashboard. Refresh the page. If persists, clear cache and reload entire app.'
        },
        {
          id: 'ts5',
          q: 'Dark mode not working properly',
          a: 'Check system settings. Try "System" theme option. Clear cache if theme doesn\'t apply. Toggle between Light and Dark manually.'
        }
      ]
    },
    {
      category: 'Support & Community',
      questions: [
        {
          id: 'sc1',
          q: 'How do I report a bug?',
          a: 'Visit https://github.com/rcas/issues. Describe the bug in detail. Include browser version, steps to reproduce. Screenshots helpful! Community will investigate.'
        },
        {
          id: 'sc2',
          q: 'Can I request a feature?',
          a: 'Yes! Open a GitHub issue with "Feature Request" label. Explain your need clearly. Upvote other requests you like. Popular features get implemented first.'
        },
        {
          id: 'sc3',
          q: 'How can I support RCAS development?',
          a: '1) Star on GitHub 2) Sponsor us financially 3) Report bugs and request features 4) Contribute code if you\'re a developer 5) Share RCAS with others'
        },
        {
          id: 'sc4',
          q: 'Is there a community forum?',
          a: 'GitHub discussions available. Slack community coming soon. Follow GitHub for updates. Meanwhile, email support is available.'
        },
        {
          id: 'sc5',
          q: 'Do you provide paid support?',
          a: 'Currently community-driven support only. Paid support options coming soon. For now, free email support available to everyone.'
        }
      ]
    }
  ];

  return (
    <div>
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about RCAS"
        icon={HelpCircle}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Info Box */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-slate-600 dark:text-slate-300">
              Can't find your answer? <a href="mailto:support@rcas.com" className="text-blue-600 dark:text-blue-400 hover:underline">Email us</a> or <a href="https://github.com/rcas/issues" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">ask on GitHub</a>.
            </p>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category) => (
            <div key={category.category}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.questions.map((faq) => (
                  <Card key={faq.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full text-left p-6 flex items-start justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-1 pr-4">
                        {faq.q}
                      </p>
                      {expanded[faq.id] ? (
                        <ChevronUp className="h-5 w-5 text-slate-500 flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0 mt-1" />
                      )}
                    </button>

                    {expanded[faq.id] && (
                      <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Can't find what you're looking for?</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-200">
            <p className="mb-4">
              Our community is here to help! Here are some ways to get support:
            </p>
            <ul className="space-y-2 ml-4">
              <li>📧 <a href="mailto:support@rcas.com" className="underline hover:no-underline">Email Support</a></li>
              <li>🐛 <a href="https://github.com/rcas/issues" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Report Bug on GitHub</a></li>
              <li>💡 <a href="https://github.com/rcas/issues" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Request Feature</a></li>
              <li>📚 <a href="/Help" className="underline hover:no-underline">Read Full Tutorial</a></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
