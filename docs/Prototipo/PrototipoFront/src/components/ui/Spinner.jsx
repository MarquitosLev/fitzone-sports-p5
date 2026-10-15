import React from 'react';

export function Spinner({ 
  size = 'md', 
  color = 'navy', 
  label, 
  inline = false,
  className = '' 
}) {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-[2.5px]',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colorMap = {
    navy: 'border-[#1B2A55]/20 border-t-[#1B2A55]',
    coral: 'border-[#F26D6D]/25 border-t-[#F26D6D]',
    green: 'border-[#2E9E5B]/25 border-t-[#2E9E5B]',
    gold: 'border-[#F0B429]/25 border-t-[#F0B429]',
    red: 'border-[#E5484D]/25 border-t-[#E5484D]',
    white: 'border-white/25 border-t-white',
    current: 'border-current/25 border-t-current',
  };

  const spinnerElement = (
    <div
      role="status"
      aria-label={label || 'Cargando'}
      className={`inline-block rounded-full animate-spin shrink-0 ${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.navy} ${className}`}
    >
      <span className="sr-only">{label || 'Cargando...'}</span>
    </div>
  );

  if (inline && !label) {
    return spinnerElement;
  }

  return (
    <div className={`flex items-center gap-2.5 ${inline ? 'inline-flex' : 'justify-center p-3'}`}>
      {spinnerElement}
      {label && (
        <span className="text-xs font-semibold text-slate-500 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}
