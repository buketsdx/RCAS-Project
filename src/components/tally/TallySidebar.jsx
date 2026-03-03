import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";

const TallySidebar = () => {
  const navigate = useNavigate();

  const buttons = [
    { key: 'F1', label: 'Select Company', shortcut: 'F1', path: 'CompanyInfo' },
    { key: 'F2', label: 'Date', shortcut: 'F2', path: 'Dashboard' },
    { key: 'F3', label: 'Company', shortcut: 'F3', path: 'CompanyManagement' },
    { key: 'F4', label: 'Contra', shortcut: 'F4', path: 'Contra' },
    { key: 'F5', label: 'Payment', shortcut: 'F5', path: 'Payment' },
    { key: 'F6', label: 'Receipt', shortcut: 'F6', path: 'Receipt' },
    { key: 'F7', label: 'Journal', shortcut: 'F7', path: 'Journal' },
    { key: 'F8', label: 'Sales', shortcut: 'F8', path: 'Sales' },
    { key: 'F9', label: 'Purchase', shortcut: 'F9', path: 'Purchase' },
    { key: 'F10', label: 'Other Vouchers', shortcut: 'F10', path: 'VoucherTypes' },
    { key: 'F11', label: 'Features', shortcut: 'F11', path: 'AppSettings' },
    { key: 'F12', label: 'Configure', shortcut: 'F12', path: 'AppSettings' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] border-l border-slate-200 w-48 p-2 gap-1.5 select-none">
      {buttons.map((btn) => (
        <button
          key={btn.key}
          className={cn(
            "text-left px-3 py-1.5 rounded-sm border border-[#1c3c5c]/20 hover:bg-[#e2e8f0] group flex justify-between items-center transition-all",
            "active:bg-[#1c3c5c] active:text-white"
          )}
          onClick={() => navigate(`/${btn.path}`)}
        >
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold group-active:text-white/80">{btn.key}:</span>
            <span className="text-[11px] text-[#1c3c5c] font-bold group-active:text-white leading-tight">{btn.label}</span>
          </div>
          <span className="text-[10px] bg-slate-200 text-slate-500 px-1 rounded border border-slate-300 group-active:bg-white/20 group-active:text-white group-active:border-white/30">
            {btn.shortcut}
          </span>
        </button>
      ))}
      <div className="mt-auto pt-4 text-[10px] text-slate-400 font-mono text-center">
        TallyPrime Mode
      </div>
    </div>
  );
};

export default TallySidebar;
