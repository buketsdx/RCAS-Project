import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('system');
  const [colorTheme, setColorTheme] = useState('emerald');
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'system';
    const savedColor = localStorage.getItem('colorTheme') || 'emerald';
    
    setTheme(saved);
    setColorTheme(savedColor);
    
    applyTheme(saved);
    applyColorTheme(savedColor);
  }, []);

  const applyTheme = (mode) => {
    const html = document.documentElement;
    let shouldBeDark = false;

    if (mode === 'dark') {
      shouldBeDark = true;
    } else if (mode === 'light') {
      shouldBeDark = false;
    } else {
      // System
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (shouldBeDark) {
      html.classList.add('dark');
      setIsDark(true);
    } else {
      html.classList.remove('dark');
      setIsDark(false);
    }
  };

  const applyColorTheme = (color) => {
    const html = document.documentElement;
    // Remove all existing theme classes
    const themes = ['theme-blue', 'theme-purple', 'theme-rose', 'theme-orange'];
    html.classList.remove(...themes);
    
    // Add new theme class if not default (emerald)
    if (color !== 'emerald') {
      html.classList.add(`theme-${color}`);
    }
  };

  const toggleTheme = (mode) => {
    setTheme(mode);
    localStorage.setItem('theme', mode);
    applyTheme(mode);
  };

  const changeColorTheme = (color) => {
    setColorTheme(color);
    localStorage.setItem('colorTheme', color);
    applyColorTheme(color);
  };

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark, 
      colorTheme,
      setTheme: toggleTheme, 
      toggleTheme,
      setColorTheme: changeColorTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
