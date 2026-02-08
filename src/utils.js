// Utility functions for the application
import React from 'react';
import { rcas } from '@/api/rcasClient';

export const createPageUrl = (path) => {
  if (!path) return "/";
  return path.startsWith('/') ? path : `/${path}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US');
};

// Custom currency symbols - support for new Saudi Riyal symbol
export const CUSTOM_SYMBOLS = {
  'SAR': '﷼',      // Saudi Riyal - Will use font icon
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'AED': 'د.إ',    // UAE Dirham
  'KWD': 'د.ك',    // Kuwaiti Dinar
  'QAR': 'ر.ق',    // Qatari Riyal
  'BHD': 'ب.د',    // Bahraini Dinar
  'OMR': 'ر.ع.',   // Omani Rial
  'JOD': 'د.ا',    // Jordanian Dinar
  'EGP': '£',
  'INR': '₹',
  'PKR': '₨',
  'BDT': '৳'
};

// Format currency with professional Saudi Riyal icon for SAR
export const formatCurrency = (amount, currency = 'SAR', symbol = null) => {
  if (!currency) currency = 'SAR';
  if (!amount && amount !== 0) amount = 0;
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === 'SAR') {
    return React.createElement(
      'span',
      { className: 'inline-flex items-center gap-1', style: { verticalAlign: 'middle' } },
      React.createElement('span', { className: 'icon-saudi_riyal_new', style: { display: 'inline-block' } }),
      React.createElement('span', null, formatted)
    );
  }

  const displaySymbol = symbol || CUSTOM_SYMBOLS[currency] || currency;
  return `${displaySymbol} ${formatted}`;
};

export const generateID = (prefix = '', counter = 0) => {
  return `${prefix}${String(counter).padStart(6, '0')}`;
};

// Generate unique voucher code automatically
export const generateVoucherCode = async (voucherType) => {
  try {
    // Mapping of voucher types to prefixes
    const prefixMap = {
      'Sales': 'SAL',
      'Purchase': 'PUR',
      'Receipt': 'RCP',
      'Payment': 'PAY',
      'Journal': 'JNL',
      'Debit Note': 'DNT',
      'Credit Note': 'CNT',
      'Contra': 'CTR',
      'Sales Order': 'SO',
      'Purchase Order': 'PO'
    };

    const prefix = prefixMap[voucherType] || 'VOC';
    
    // Get or create IDCounter for this voucher type
    let idCounters = await rcas.entities.IDCounter.list();
    let counter = idCounters.find(c => c.entity_type === voucherType);

    if (!counter) {
      // Create new counter if it doesn't exist
      counter = await rcas.entities.IDCounter.create({
        entity_type: voucherType,
        prefix: prefix,
        last_number: 0,
        padding: 5
      });
    }

    // Increment counter
    const newNumber = (counter.last_number || 0) + 1;
    await rcas.entities.IDCounter.update(counter.id, {
      last_number: newNumber
    });

    // Generate code
    const code = `${prefix}-${String(newNumber).padStart(counter.padding || 5, '0')}`;
    return code;
  } catch (error) {
    console.error('Error generating voucher code:', error);
    // Fallback to timestamp-based code
    return `${voucherType?.slice(0, 3) || 'VOC'}-${Date.now().toString().slice(-8)}`;
  }
};

export const parseJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  
  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // Handle strings that might contain commas or quotes
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Initialize inbuilt/system ledgers
export const initializeSystemLedgers = async (accountGroups) => {
  try {
    const existingLedgers = await rcas.entities.Ledger.list();
    const systemLedgers = existingLedgers.filter(l => l.is_system);
    
    // If system ledgers already exist, don't recreate them
    if (systemLedgers.length > 0) {
      return;
    }

    // Find group IDs
    const cashGroup = accountGroups.find(g => g.name === 'Bank Accounts' || g.name === 'Cash');
    const receivableGroup = accountGroups.find(g => g.name === 'Accounts Receivable');
    const payableGroup = accountGroups.find(g => g.name === 'Accounts Payable');
    const expenseGroup = accountGroups.find(g => g.name === 'Expenses');

    const inbuiltLedgers = [
      {
        name: 'Cash in Hand',
        name_arabic: 'النقد في الصندوق',
        group_id: cashGroup?.id,
        is_system: true,
        opening_balance: 0,
        opening_balance_type: 'Dr'
      },
      {
        name: 'Bank Account',
        name_arabic: 'حساب البنك',
        group_id: cashGroup?.id,
        is_system: true,
        opening_balance: 0,
        opening_balance_type: 'Dr'
      },
      {
        name: 'Sales Account',
        name_arabic: 'حساب المبيعات',
        group_id: accountGroups.find(g => g.name === 'Income')?.id,
        is_system: true,
        opening_balance: 0,
        opening_balance_type: 'Cr'
      },
      {
        name: 'Purchase Account',
        name_arabic: 'حساب المشتريات',
        group_id: accountGroups.find(g => g.name === 'Expenses')?.id,
        is_system: true,
        opening_balance: 0,
        opening_balance_type: 'Dr'
      },
      {
        name: 'Salary Payable',
        name_arabic: 'الرواتب المستحقة',
        group_id: payableGroup?.id,
        is_system: true,
        opening_balance: 0,
        opening_balance_type: 'Cr'
      }
    ];

    // Create system ledgers
    for (const ledger of inbuiltLedgers) {
      try {
        await rcas.entities.Ledger.create(ledger);
      } catch (error) {
        console.error('Error creating system ledger:', error);
      }
    }
  } catch (error) {
    console.error('Error initializing system ledgers:', error);
  }
};