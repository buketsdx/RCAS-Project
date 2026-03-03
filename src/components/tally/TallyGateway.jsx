import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/context/CompanyContext';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

const TallyGateway = () => {
  const navigate = useNavigate();
  const { currentCompany: company } = useCompany();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuGroups = [
    {
      title: 'MASTERS',
      items: [
        { label: 'Create', shortcut: 'C', path: 'Ledgers' },
        { label: 'Alter', shortcut: 'A', path: 'Ledgers' },
        { label: 'Chart of Accounts', shortcut: 'H', path: 'AccountGroups' },
      ]
    },
    {
      title: 'TRANSACTIONS',
      items: [
        { label: 'Vouchers', shortcut: 'V', path: 'SalesInvoice' },
        { label: 'Day Book', shortcut: 'K', path: 'Daybook' },
      ]
    },
    {
      title: 'UTILITIES',
      items: [
        { label: 'Banking', shortcut: 'N', path: 'BankReconciliation' },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { label: 'Balance Sheet', shortcut: 'B', path: 'BalanceSheet' },
        { label: 'Profit & Loss A/c', shortcut: 'P', path: 'ProfitAndLoss' },
        { label: 'Stock Summary', shortcut: 'S', path: 'StockSummary' },
        { label: 'Ratio Analysis', shortcut: 'R', path: 'AdvancedReports' },
        { label: 'Display More Reports', shortcut: 'D', path: 'LedgerReport' },
      ]
    }
  ];

  const allItems = menuGroups.flatMap(g => g.items);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      
      // Hotkey navigation
      const item = allItems.find(i => i.shortcut === key);
      if (item) {
        navigate(`/${item.path}`);
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        navigate(`/${allItems[selectedIndex].path}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigate, allItems]);

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center min-h-[70vh] font-mono select-none gap-8 p-4">
      {/* Left Panel: List of Selected Companies */}
      <div className="hidden lg:flex flex-col w-80 border border-slate-200 bg-white shadow-sm self-stretch">
        <div className="bg-[#cbd5e1] px-2 py-1 text-[11px] font-bold text-slate-700 flex justify-between">
          <span>List of Selected Companies</span>
        </div>
        <div className="p-3 flex-1">
          <div className="flex justify-between text-[11px] font-bold text-[#1c3c5c] border-b border-slate-100 pb-1 mb-2">
            <span>Name of Company</span>
            <span>Date of Last Entry</span>
          </div>
          <div className="flex justify-between text-xs py-1 hover:bg-slate-50 cursor-pointer text-[#1c3c5c] font-bold">
            <span>{company?.name || 'RCAS'}</span>
            <span className="font-normal text-slate-500">{format(new Date(), 'd-MMM-yyyy')}</span>
          </div>
          {/* You could map other selected companies here */}
        </div>
        <div className="mt-auto p-3 border-t border-slate-100">
          <div className="text-[10px] text-slate-400">Current Period: 01-Apr-25 to 31-Mar-2026</div>
          <div className="text-[10px] text-slate-400">Current Date: {format(new Date(), 'EEEE, d MMM yyyy')}</div>
        </div>
      </div>

      {/* Center: Gateway of Tally Menu */}
      <div className="w-full max-w-[450px] border-2 border-[#1c3c5c] shadow-[4px_4px_0px_#1c3c5c] bg-white">
        {/* Title Bar */}
        <div className="bg-[#1c3c5c] text-white px-2 py-1 flex justify-between items-center text-sm font-bold">
          <span>Gateway of Tally</span>
        </div>

        {/* Menu Content */}
        <div className="bg-[#f0f4f8] p-4 min-h-[300px]">
          {menuGroups.map((group, groupIdx) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <div className="text-[#1c3c5c] font-bold text-xs mb-1 border-b border-[#cbd5e1] pb-0.5">
                {group.title}
              </div>
              <div className="flex flex-col">
                {group.items.map((item, itemIdx) => {
                  const absoluteIndex = menuGroups.slice(0, groupIdx).reduce((acc, g) => acc + g.items.length, 0) + itemIdx;
                  const isSelected = selectedIndex === absoluteIndex;
                  
                  // Highlight the shortcut letter
                  const labelParts = item.label.split(new RegExp(`(${item.shortcut})`, 'i'));

                  return (
                    <div
                      key={item.label}
                      className={cn(
                        "px-4 py-0.5 cursor-pointer text-sm flex justify-between group transition-colors",
                        isSelected ? "bg-[#e2e8f0] text-[#1c3c5c] font-bold" : "text-slate-700 hover:bg-slate-200"
                      )}
                      onClick={() => navigate(`/${item.path}`)}
                      onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                    >
                      <span>
                        {labelParts.map((part, i) => 
                          part.toUpperCase() === item.shortcut ? (
                            <span key={i} className="text-red-600 font-bold underline underline-offset-2">{part}</span>
                          ) : part
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="bg-[#cbd5e1] px-2 py-0.5 text-[10px] text-slate-600 flex justify-between">
          <span>Use arrows to navigate, Enter to select</span>
          <span>Press bold letter for quick access</span>
        </div>
      </div>
    </div>
  );
};

export default TallyGateway;
