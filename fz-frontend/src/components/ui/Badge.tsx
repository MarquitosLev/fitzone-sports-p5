import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'navy'
  | 'navy-soft'
  | 'coral'
  | 'coral-soft'
  | 'green'
  | 'green-soft'
  | 'gold'
  | 'gold-soft'
  | 'red'
  | 'red-soft'
  | 'dark';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  showDot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  showDot = false,
  className = '',
}: BadgeProps) {
  const baseClasses =
    'inline-flex items-center font-bold tracking-wide uppercase rounded-full select-none transition-colors';

  const sizeClasses: Record<BadgeSize, string> = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  };

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    navy: 'bg-[#1B2A55] text-white',
    'navy-soft': 'bg-[#1B2A55]/10 text-[#1B2A55] border border-[#1B2A55]/20',
    coral: 'bg-[#F26D6D] text-white',
    'coral-soft': 'bg-[#FEEAEA] text-[#F26D6D] border border-[#F26D6D]/30',
    green: 'bg-[#2E9E5B] text-white',
    'green-soft': 'bg-[#EAF7EE] text-[#2E9E5B] border border-[#2E9E5B]/30',
    gold: 'bg-[#F0B429] text-[#1B2A55]',
    'gold-soft': 'bg-[#FEF7E6] text-[#B7791F] border border-[#F0B429]/40',
    red: 'bg-[#E5484D] text-white',
    'red-soft': 'bg-[#FDECEE] text-[#E5484D] border border-[#E5484D]/30',
    dark: 'bg-slate-900 text-white',
  };

  const dotColorClasses: Record<BadgeVariant, string> = {
    default: 'bg-slate-400',
    navy: 'bg-white',
    'navy-soft': 'bg-[#1B2A55]',
    coral: 'bg-white',
    'coral-soft': 'bg-[#F26D6D]',
    green: 'bg-white',
    'green-soft': 'bg-[#2E9E5B]',
    gold: 'bg-[#1B2A55]',
    'gold-soft': 'bg-[#B7791F]',
    red: 'bg-white',
    'red-soft': 'bg-[#E5484D]',
    dark: 'bg-white',
  };

  return (
    <span
      className={`
        ${baseClasses}
        ${sizeClasses[size] || sizeClasses.md}
        ${variantClasses[variant] || variantClasses.default}
        ${className}
      `}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColorClasses[variant] || 'bg-current'
          }`}
        />
      )}
      {children}
    </span>
  );
}
