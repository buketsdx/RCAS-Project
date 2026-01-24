import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const CURRENCY_SYMBOLS = {
  'SAR': 'SAR',      // Saudi Riyal - Will use font icon
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

export function CurrencyProvider({ children }) {
  const [baseCurrency, setBaseCurrency] = useState('SAR');
  const [baseCurrencySymbol, setBaseCurrencySymbol] = useState('﷼');

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('baseCurrency') || 'SAR';
    const savedSymbol = localStorage.getItem('baseCurrencySymbol') || '﷼';
    setBaseCurrency(saved);
    setBaseCurrencySymbol(savedSymbol);
  }, []);

  const setSelectedCurrency = (code, symbol = null) => {
    const finalSymbol = symbol || CURRENCY_SYMBOLS[code] || code;
    setBaseCurrency(code);
    setBaseCurrencySymbol(finalSymbol);
    localStorage.setItem('baseCurrency', code);
    localStorage.setItem('baseCurrencySymbol', finalSymbol);
  };

  return (
    <CurrencyContext.Provider
      value={{
        baseCurrency,
        baseCurrencySymbol,
        setSelectedCurrency,
        CURRENCY_SYMBOLS,
        getCurrencySymbol: (code) => CURRENCY_SYMBOLS[code] || code
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
