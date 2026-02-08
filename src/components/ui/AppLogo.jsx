import React from 'react';

export default function AppLogo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { logo: 'h-8 w-8', text: 'text-lg' },
    md: { logo: 'h-10 w-10', text: 'text-xl' },
    lg: { logo: 'h-16 w-16', text: 'text-3xl' },
    xl: { logo: 'h-24 w-24', text: 'text-5xl' }
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size].logo} bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg`}>
        <span className="text-primary-foreground font-bold text-lg">R</span>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${sizes[size].text} font-bold text-primary text-left`}>
            RCAS
          </span>
          <span className="text-xs text-muted-foreground -mt-1">Rustam Chartered Account System</span>
        </div>
      )}
    </div>
  );
}
