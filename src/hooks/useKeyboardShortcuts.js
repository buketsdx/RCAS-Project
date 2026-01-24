import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const SHORTCUTS = {
  NEW_ENTRY: { key: 'n', ctrl: true, description: 'Create new entry/voucher' },
  SAVE: { key: 's', ctrl: true, description: 'Save current data' },
  EDIT: { key: 'e', ctrl: true, description: 'Edit selected item' },
  DELETE: { key: 'd', alt: true, description: 'Delete item' },
  LIST: { key: 'l', alt: true, description: 'View list/reports' },
  REFRESH: { key: 'F5', description: 'Refresh data' },
  SETTINGS: { key: 'F12', description: 'Settings' },
  FIND: { key: 'f', ctrl: true, description: 'Find/Search' },
  PRINT: { key: 'p', ctrl: true, description: 'Print' },
  SWITCH_COMPANY: { key: 'c', ctrl: true, alt: true, description: 'Switch company' },
  HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
  
  // Navigation
  SALES: { key: '1', alt: true, description: 'Go to Sales' },
  PURCHASE: { key: '2', alt: true, description: 'Go to Purchase' },
  RECEIPT: { key: '3', alt: true, description: 'Go to Receipt' },
  PAYMENT: { key: '4', alt: true, description: 'Go to Payment' },
  JOURNAL: { key: '5', alt: true, description: 'Go to Journal' },
  MASTERS: { key: '6', alt: true, description: 'Go to Masters' },
  REPORTS: { key: '7', alt: true, description: 'Go to Reports' },
  DASHBOARD: { key: 'Home', description: 'Go to Dashboard' },
};

export function useKeyboardShortcuts(callbacks = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMeta = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Ctrl+N - New Entry
      if (isMeta && !isAlt && !isShift && key === 'n') {
        e.preventDefault();
        if (callbacks.onNewEntry) {
          callbacks.onNewEntry();
        } else {
          toast.info('Create new entry in this page');
        }
      }

      // Ctrl+S - Save
      if (isMeta && !isAlt && !isShift && key === 's') {
        e.preventDefault();
        if (callbacks.onSave) {
          callbacks.onSave();
        } else {
          toast.info('Save (Ctrl+S)');
        }
      }

      // Ctrl+E - Edit
      if (isMeta && !isAlt && !isShift && key === 'e') {
        e.preventDefault();
        if (callbacks.onEdit) {
          callbacks.onEdit();
        } else {
          toast.info('Edit mode');
        }
      }

      // Alt+D - Delete
      if (!isMeta && isAlt && !isShift && key === 'd') {
        e.preventDefault();
        if (callbacks.onDelete) {
          callbacks.onDelete();
        } else {
          toast.info('Delete item');
        }
      }

      // Alt+L - List
      if (!isMeta && isAlt && !isShift && key === 'l') {
        e.preventDefault();
        if (callbacks.onList) {
          callbacks.onList();
        } else {
          toast.info('Show list/reports');
        }
      }

      // Ctrl+F - Find/Search
      if (isMeta && !isAlt && !isShift && key === 'f') {
        e.preventDefault();
        if (callbacks.onFind) {
          callbacks.onFind();
        } else {
          toast.info('Search (Ctrl+F)');
        }
      }

      // Ctrl+P - Print
      if (isMeta && !isAlt && !isShift && key === 'p') {
        e.preventDefault();
        if (callbacks.onPrint) {
          callbacks.onPrint();
        } else {
          window.print();
        }
      }

      // F5 - Refresh
      if (e.key === 'F5') {
        e.preventDefault();
        if (callbacks.onRefresh) {
          callbacks.onRefresh();
        } else {
          window.location.reload();
        }
      }

      // F12 - Settings
      if (e.key === 'F12') {
        e.preventDefault();
        if (callbacks.onSettings) {
          callbacks.onSettings();
        } else {
          navigate('/AppSettings');
        }
      }

      // Shift+? - Help/Shortcuts
      if (isShift && key === '?') {
        e.preventDefault();
        if (callbacks.onHelp) {
          callbacks.onHelp();
        }
      }

      // Alt+1-7 Navigation
      if (!isMeta && isAlt && !isShift && key >= '1' && key <= '7') {
        e.preventDefault();
        const navMap = {
          '1': 'Sales',
          '2': 'Purchase',
          '3': 'Receipt',
          '4': 'Payment',
          '5': 'Journal',
          '6': 'Ledgers',
          '7': 'AdvancedReports'
        };
        navigate(`/${navMap[key]}`);
      }

      // Home key - Dashboard
      if (e.key === 'Home') {
        e.preventDefault();
        navigate('/Dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, callbacks]);
}
