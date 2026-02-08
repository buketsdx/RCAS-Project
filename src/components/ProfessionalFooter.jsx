import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import AppLogo from '@/components/ui/AppLogo';
import { Button } from "@/components/ui/button";
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  Heart,
  Moon,
  Sun,
  Laptop,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ProfessionalFooter() {
  const { theme, setTheme, isDark } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn(
      "border-t transition-colors duration-300 mt-auto",
      isDark ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
    )}>
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-2">
            <AppLogo />
            <p className={cn("text-sm leading-relaxed max-w-sm", isDark ? "text-slate-400" : "text-slate-600")}>
              Empowering businesses with professional accounting and inventory management solutions. Open source, secure, and reliable.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <SocialLink href="https://github.com" icon={Github} label="GitHub" isDark={isDark} />
              <SocialLink href="https://twitter.com" icon={Twitter} label="Twitter" isDark={isDark} />
              <SocialLink href="https://linkedin.com" icon={Linkedin} label="LinkedIn" isDark={isDark} />
              <SocialLink href="mailto:support@rcas.com" icon={Mail} label="Email" isDark={isDark} />
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className={cn("text-sm font-semibold tracking-wider uppercase mb-2", isDark ? "text-slate-100" : "text-slate-900")}>
              Product
            </h3>
            <ul className="space-y-1">
              <FooterLink to="/Dashboard" label="Dashboard" isDark={isDark} />
              <FooterLink to="/Sales" label="Sales" isDark={isDark} />
              <FooterLink to="/Purchase" label="Purchase" isDark={isDark} />
              <FooterLink to="/AdvancedReports" label="Reports" isDark={isDark} />
              <FooterLink to="/ZATCAIntegration" label="ZATCA e-Invoice" isDark={isDark} badge="New" />
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className={cn("text-sm font-semibold tracking-wider uppercase mb-2", isDark ? "text-slate-100" : "text-slate-900")}>
              Support
            </h3>
            <ul className="space-y-1">
              <FooterLink to="/Help" label="Documentation" isDark={isDark} />
              <FooterLink to="/FAQ" label="FAQ" isDark={isDark} />
              <FooterLink to="/Deployment" label="Deployment Guide" isDark={isDark} />
              <FooterLink to="/AppSettings" label="Settings" isDark={isDark} />
              <a 
                href="https://github.com/issues" 
                target="_blank" 
                rel="noreferrer"
                className={cn(
                  "group flex items-center text-sm transition-colors",
                  isDark ? "text-slate-400 hover:text-primary" : "text-slate-600 hover:text-primary"
                )}
              >
                Report an Issue
                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </ul>
          </div>
        </div>
      </div>

      <div className={cn("h-px w-full", isDark ? "bg-slate-800" : "bg-slate-200")} />

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Copyright */}
          <div className={cn("text-sm", isDark ? "text-slate-400" : "text-slate-600")}>
            © {currentYear} RCAS. All rights reserved.
            <span className="hidden sm:inline mx-2">•</span>
            <span className="block sm:inline mt-1 sm:mt-0">
              Developed with <Heart className="h-3 w-3 inline text-red-500 mx-0.5 animate-pulse" /> by Rustam Ali
            </span>
          </div>

          {/* Theme Toggle & Legal */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm">
              <Link to="/PrivacyPolicy" className={cn("hover:underline", isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-900")}>Privacy</Link>
              <Link to="/TermsAndConditions" className={cn("hover:underline", isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-900")}>Terms</Link>
            </div>
            
            <div className={cn("h-4 w-px", isDark ? "bg-slate-800" : "bg-slate-300")} />

            <div className={cn("flex items-center p-1 rounded-full border", isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200")}>
              <ThemeBtn 
                active={theme === 'light'} 
                onClick={() => setTheme('light')} 
                icon={Sun} 
                label="Light"
                isDark={isDark}
              />
              <ThemeBtn 
                active={theme === 'system'} 
                onClick={() => setTheme('system')} 
                icon={Laptop} 
                label="System"
                isDark={isDark}
              />
              <ThemeBtn 
                active={theme === 'dark'} 
                onClick={() => setTheme('dark')} 
                icon={Moon} 
                label="Dark"
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, icon: Icon, label, isDark }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "p-2 rounded-lg transition-all duration-200",
        isDark 
          ? "text-slate-400 hover:bg-slate-800 hover:text-primary" 
          : "text-slate-500 hover:bg-primary/10 hover:text-primary"
      )}
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}

function FooterLink({ to, label, isDark, badge }) {
  return (
    <li>
      <Link 
        to={to} 
        className={cn(
          "group flex items-center text-sm transition-colors",
          isDark ? "text-slate-400 hover:text-primary" : "text-slate-600 hover:text-primary"
        )}
      >
        <ArrowRight className="h-3 w-3 mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
        {label}
        {badge && (
          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

function ThemeBtn({ active, onClick, icon: Icon, label, isDark }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-full transition-all duration-200",
        active 
          ? isDark ? "bg-slate-800 text-primary shadow-sm" : "bg-white text-primary shadow-sm"
          : isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
      )}
      title={`Switch to ${label} theme`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}