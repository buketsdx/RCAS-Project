import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const KEYBOARD_SHORTCUTS = [
  {
    category: 'Data Entry',
    shortcuts: [
      { keys: 'Ctrl + N', description: 'Create new entry/voucher' },
      { keys: 'Ctrl + S', description: 'Save current data' },
      { keys: 'Ctrl + E', description: 'Edit selected item' },
      { keys: 'Alt + D', description: 'Delete item' },
      { keys: 'Alt + L', description: 'View list/reports' },
    ]
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: 'Home', description: 'Go to Dashboard' },
      { keys: 'Alt + 1', description: 'Sales' },
      { keys: 'Alt + 2', description: 'Purchase' },
      { keys: 'Alt + 3', description: 'Receipt' },
      { keys: 'Alt + 4', description: 'Payment' },
      { keys: 'Alt + 5', description: 'Journal' },
      { keys: 'Alt + 6', description: 'Ledgers' },
      { keys: 'Alt + 7', description: 'Reports' },
    ]
  },
  {
    category: 'Utilities',
    shortcuts: [
      { keys: 'Ctrl + F', description: 'Find/Search' },
      { keys: 'Ctrl + P', description: 'Print' },
      { keys: 'F5', description: 'Refresh data' },
      { keys: 'F12', description: 'Settings' },
      { keys: 'Ctrl + Alt + C', description: 'Switch company' },
      { keys: 'Shift + ?', description: 'Show this help' },
    ]
  }
];

export function KeyboardShortcutsDialog({ open, onOpenChange, isDark }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-2xl max-h-[90vh] overflow-y-auto",
        isDark ? "bg-slate-900" : "bg-white"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(isDark ? "text-slate-100" : "text-slate-900")}>
            ⌨️ Keyboard Shortcuts (Tally Style)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {KEYBOARD_SHORTCUTS.map((group) => (
            <div key={group.category} className="space-y-3">
              <h3 className={cn(
                "text-lg font-semibold",
                isDark ? "text-emerald-400" : "text-emerald-600"
              )}>
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors",
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700"
                        : "bg-slate-50 hover:bg-slate-100"
                    )}
                  >
                    <p className={cn(
                      "flex-1",
                      isDark ? "text-slate-300" : "text-slate-700"
                    )}>
                      {shortcut.description}
                    </p>
                    <kbd className={cn(
                      "ml-4 px-3 py-1 rounded font-mono text-sm font-semibold whitespace-nowrap border-2",
                      isDark
                        ? "bg-slate-700 border-slate-600 text-slate-100"
                        : "bg-slate-200 border-slate-300 text-slate-800"
                    )}>
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className={cn(
            "p-4 rounded-lg",
            isDark
              ? "bg-blue-900/30 border border-blue-800"
              : "bg-blue-50 border border-blue-200"
          )}>
            <p className={cn(
              "text-sm",
              isDark ? "text-blue-300" : "text-blue-800"
            )}>
              💡 <strong>Pro Tip:</strong> These shortcuts follow Tally's keyboard shortcut pattern for fast data entry. Use them to speed up your work!
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Close (ESC)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
