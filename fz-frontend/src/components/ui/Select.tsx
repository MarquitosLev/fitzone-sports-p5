import React, { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | { message?: string } | null;
  errorMessage?: string | null;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode | React.ElementType;
  fullWidth?: boolean;
  options?: (SelectOption | string | number)[];
  placeholder?: string;
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  children?: React.ReactNode;
  className?: string;
  selectClassName?: string;
}

export function Select({
  label,
  helperText,
  error,
  errorMessage,
  required = false,
  disabled = false,
  leftIcon: LeftIcon,
  fullWidth = true,
  options = [],
  placeholder = 'Seleccionar...',
  id,
  name,
  value,
  onChange,
  children,
  className = '',
  selectClassName = '',
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || name || generatedId;
  const resolvedError = errorMessage || (typeof error === 'string' ? error : (error && error.message) ? error.message : null);
  const hasError = Boolean(error || errorMessage);

  const renderLeftIcon = (IconInput: React.ReactNode | React.ElementType) => {
    if (!IconInput) return null;
    if (React.isValidElement(IconInput)) return IconInput;
    const Resolved = IconInput as React.ElementType;
    return <Resolved className="w-4 h-4" />;
  };

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} space-y-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-[#1B2A55] font-manrope tracking-tight"
        >
          {label}
          {required && <span className="text-[#E5484D] ml-1 font-black">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div
        className={`
          relative flex items-center w-full rounded-xl transition-all duration-150
          border bg-white overflow-hidden
          ${
            hasError
              ? 'border-[#E5484D] ring-2 ring-[#E5484D]/15'
              : 'border-slate-200 hover:border-slate-300 focus-within:border-[#1B2A55] focus-within:ring-2 focus-within:ring-[#1B2A55]/15'
          }
          ${disabled ? 'bg-slate-100/80 cursor-not-allowed opacity-75' : ''}
        `}
      >
        {/* Left Icon */}
        {LeftIcon && (
          <div className="pl-3.5 pr-1 text-slate-400 shrink-0 pointer-events-none">
            {renderLeftIcon(LeftIcon)}
          </div>
        )}

        {/* HTML Select */}
        <select
          id={selectId}
          name={name}
          disabled={disabled}
          required={required}
          value={value}
          onChange={onChange}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={`
            w-full h-11 pl-3.5 pr-10 text-xs sm:text-sm font-medium text-[#1B2A55] bg-transparent
            appearance-none cursor-pointer focus:outline-none disabled:cursor-not-allowed
            ${selectClassName}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400">
              {placeholder}
            </option>
          )}

          {/* If custom children <option> are provided, render them */}
          {children
            ? children
            : options.map((opt, idx) => {
                const optValue = typeof opt === 'object' && opt !== null ? (opt as SelectOption).value : opt;
                const optLabel = typeof opt === 'object' && opt !== null ? (opt as SelectOption).label : opt;
                const optDisabled = typeof opt === 'object' && opt !== null ? (opt as SelectOption).disabled : false;

                return (
                  <option
                    key={`${optValue}-${idx}`}
                    value={optValue}
                    disabled={optDisabled}
                    className="text-[#1B2A55]"
                  >
                    {optLabel}
                  </option>
                );
              })}
        </select>

        {/* Custom Chevron Indicator */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Helper Text or Error Message */}
      {hasError && resolvedError ? (
        <p
          id={`${selectId}-error`}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E5484D] animate-fade-in"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{resolvedError}</span>
        </p>
      ) : helperText ? (
        <p
          id={`${selectId}-helper`}
          className="text-[11px] text-slate-500 font-medium pl-0.5 leading-normal"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
