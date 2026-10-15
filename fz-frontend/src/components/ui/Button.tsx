import React from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'coral' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  loadingText?: React.ReactNode;
  disabled?: boolean;
  leftIcon?: React.ReactNode | React.ElementType;
  rightIcon?: React.ReactNode | React.ElementType;
  icon?: React.ReactNode | React.ElementType;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false, // Alias for isLoading
  loadingText,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  icon: Icon, // Alias for leftIcon
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isButtonLoading = isLoading || loading;
  const isButtonDisabled = disabled || isButtonLoading;

  // Icons resolution
  const PrefixIcon = LeftIcon || Icon;

  // Base styling with modern micro-transitions and accessible focus rings
  const baseClasses =
    'relative inline-flex items-center justify-center font-bold font-manrope rounded-xl transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed';

  // Variants mapped to FitZone theme tokens
  const variantClasses: Record<ButtonVariant, string> = {
    // Primary: FitZone Navy
    primary:
      'bg-[#1B2A55] text-white hover:bg-[#263B72] focus-visible:ring-[#1B2A55] shadow-sm hover:shadow-md disabled:bg-[#1B2A55]/50 disabled:text-white/70',
    // Coral: FitZone Coral (High-impact CTA)
    coral:
      'bg-[#F26D6D] text-white hover:bg-[#e05959] focus-visible:ring-[#F26D6D] shadow-sm hover:shadow-md disabled:bg-[#F26D6D]/50 disabled:text-white/70',
    // Secondary: Light bordered slate / subtle navy tint
    secondary:
      'bg-white text-[#1B2A55] border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-[#1B2A55]/30 shadow-xs disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200',
    // Danger: FitZone Red for destructive actions
    danger:
      'bg-[#E5484D] text-white hover:bg-[#d03d42] focus-visible:ring-[#E5484D] shadow-sm hover:shadow-md disabled:bg-[#E5484D]/50 disabled:text-white/70',
    // Success: FitZone Green
    success:
      'bg-[#2E9E5B] text-white hover:bg-[#25834b] focus-visible:ring-[#2E9E5B] shadow-sm hover:shadow-md disabled:bg-[#2E9E5B]/50 disabled:text-white/70',
    // Outline: Transparent with solid themed border
    outline:
      'bg-transparent text-[#1B2A55] border-2 border-[#1B2A55] hover:bg-[#1B2A55]/5 focus-visible:ring-[#1B2A55] disabled:border-slate-300 disabled:text-slate-400',
    // Ghost: Flat transparent for low-emphasis actions
    ghost:
      'bg-transparent text-slate-600 hover:text-[#1B2A55] hover:bg-slate-100 focus-visible:ring-slate-300 disabled:text-slate-300 disabled:hover:bg-transparent',
  };

  // Size specifications
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-xs gap-1.5 min-h-[28px]',
    sm: 'px-3.5 py-1.5 text-xs gap-1.5 min-h-[34px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[42px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 min-h-[50px]',
  };

  // Icon sizing based on button size
  const iconSizeMap: Record<ButtonSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Spinner color resolution based on variant
  const getSpinnerColor = (): 'navy' | 'white' => {
    if (variant === 'secondary' || variant === 'outline' || variant === 'ghost') {
      return 'navy';
    }
    return 'white';
  };

  // Render icon helper
  const renderIcon = (IconComponent: React.ReactNode | React.ElementType) => {
    if (!IconComponent) return null;
    if (React.isValidElement(IconComponent)) {
      return IconComponent;
    }
    const Resolved = IconComponent as React.ElementType;
    return <Resolved className={`${iconSizeMap[size] || 'w-4 h-4'} shrink-0`} />;
  };

  return (
    <button
      type={type}
      disabled={isButtonDisabled}
      aria-busy={isButtonLoading}
      className={`
        ${baseClasses}
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${fullWidth ? 'w-full' : ''}
        ${isButtonDisabled && !isButtonLoading ? 'opacity-60' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Loading Spinner */}
      {isButtonLoading && (
        <Spinner
          size={size === 'lg' ? 'md' : 'sm'}
          color={getSpinnerColor()}
          inline
          className="mr-1.5"
        />
      )}

      {/* Left Icon (shown when not loading or alongside) */}
      {!isButtonLoading && PrefixIcon && renderIcon(PrefixIcon)}

      {/* Button Content / Loading Text */}
      <span className={isButtonLoading && !loadingText ? 'opacity-90' : ''}>
        {isButtonLoading && loadingText ? loadingText : children}
      </span>

      {/* Right Icon */}
      {!isButtonLoading && RightIcon && renderIcon(RightIcon)}
    </button>
  );
}
