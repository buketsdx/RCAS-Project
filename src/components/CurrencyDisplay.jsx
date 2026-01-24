import React from 'react';

export function CurrencyDisplay({ amount, currency = 'SAR' }) {
  const CUSTOM_SYMBOLS = {
    'SAR': null,      // Saudi Riyal - Will use font icon
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'KWD': 'د.ك',
    'QAR': 'ر.ق',
    'BHD': 'ب.د',
    'OMR': 'ر.ع.',
    'JOD': 'د.ا',
    'EGP': '£',
    'INR': '₹',
    'PKR': '₨',
    'BDT': '৳'
  };

  if (!currency) currency = 'SAR';
  if (!amount && amount !== 0) amount = 0;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === 'SAR') {
    return (
      <span className="inline-flex items-center gap-1 align-middle">
        <span className="icon-saudi_riyal_new" style={{ fontSize: 'inherit' }}></span>
        <span>{formatted}</span>
      </span>
    );
  }

  const displaySymbol = CUSTOM_SYMBOLS[currency] || currency;
  return <span>{displaySymbol} {formatted}</span>;
}
