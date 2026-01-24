import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Moon, Sun, Monitor, Heart, Github, Mail, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { theme, toggleTheme } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Brand & Description */}
          <div className="md:col-span-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">RCAS</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Accounting software for Small and Medium Businesses. Free and open source with lifetime usage.
            </p>
            <div className="mt-3 flex gap-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                <Github className="h-4 w-4" />
              </a>
              <a href="mailto:support@rcas.com" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/Dashboard" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">Dashboard</Link></li>
              <li><Link to="/Help" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1"><HelpCircle className="h-3 w-3" /> How to Use</Link></li>
              <li><Link to="/FAQ" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">FAQ</Link></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">Deployment</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Support</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="mailto:support@rcas.com" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">Email Support</a></li>
              <li><a href="https://github.com/rcas/issues" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">Report Issues</a></li>
              <li><a href="https://github.com/rcas" target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">GitHub</a></li>
              <li><a href="#" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1"><Heart className="h-3 w-3 text-red-500" /> Sponsor</a></li>
            </ul>
          </div>

          {/* Theme Switcher */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">Theme</h4>
            <div className="flex gap-2">
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="xs"
                onClick={() => toggleTheme('system')}
                className="flex-1"
                title="System Theme"
              >
                <Monitor className="h-3 w-3" />
              </Button>
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="xs"
                onClick={() => toggleTheme('light')}
                className="flex-1"
                title="Light Theme"
              >
                <Sun className="h-3 w-3" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="xs"
                onClick={() => toggleTheme('dark')}
                className="flex-1"
                title="Dark Theme"
              >
                <Moon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs">
            {/* Copyright */}
            <div className="text-slate-600 dark:text-slate-400">
              <p>&copy; {currentYear} RCAS. All rights reserved.</p>
            </div>

            {/* Version */}
            <div className="text-slate-600 dark:text-slate-400">
              <p>Version 1.0.0 | Built with ❤️ for SMBs</p>
            </div>

            {/* Links */}
            <div className="flex gap-3 text-xs">
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-0.5">
                <FileText className="h-3 w-3" />
                License
              </a>
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                Privacy
              </a>
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Free & Open Source Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 py-2 text-center">
          <p className="text-xs text-emerald-900 dark:text-emerald-100">
            💚 Free and open source. Use it for lifetime without restrictions. <a href="#" className="font-semibold underline hover:no-underline">Sponsor us</a> to keep development active!
          </p>
        </div>
      </div>
    </footer>
  );
}
