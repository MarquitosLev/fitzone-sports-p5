import React, { useId } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

export interface DateTimeFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | { message?: string } | null;
  errorMessage?: string | null;
  required?: boolean;
  disabled?: boolean;
  type?: 'date' | 'time' | 'datetime-local';
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  min?: string | number;
  max?: string | number;
  fullWidth?: boolean;
  className?: string;
  inputClassName?: string;
}

export function DateTimeField({
  label,
  helperText,
  error,
  errorMessage,
  required = false,
  disabled = false,
  type = 'date',
  id,
  name,
  value,
  onChange,
  min,
  max,
  fullWidth = true,
  className = '',
  inputClassName = '',
  ...props
}: DateTimeFieldProps) {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const resolvedError = errorMessage || (typeof error === 'string' ? error : (error && error.message) ? error.message : null);
  const hasError = Boolean(error || errorMessage);

  const isTime = type === 'time';
  const Icon = isTime ? Clock : Calendar;

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} space-y-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#1B2A55] font-manrope tracking-tight"
        >
          {label}
          {required && <span className="text-[#E5484D] ml-1 font-black">*</span>}
        </label>
      )}

      {/* Input Container */}
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
        {/* Left Icon (Calendar or Clock) */}
        <div className="pl-3.5 pr-1 text-slate-400 shrink-0 pointer-events-none">
          <Icon className="w-4 h-4 text-[#1B2A55]/70" />
        </div>

        {/* HTML Input */}
        <input
          id={inputId}
          name={name}
          type={type}
          disabled={disabled}
          required={required}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`
            w-full h-11 px-3 text-xs sm:text-sm font-medium text-[#1B2A55] bg-transparent
            focus:outline-none disabled:cursor-not-allowed cursor-pointer
            ${inputClassName}
          `}
          {...props}
        />
      </div>

      {/* Helper Text or Error Message */}
      {hasError && resolvedError ? (
        <p
          id={`${inputId}-error`}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#E5484D] animate-fade-in"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{resolvedError}</span>
        </p>
      ) : helperText ? (
        <p
          id={`${inputId}-helper`}
          className="text-[11px] text-slate-500 font-medium pl-0.5 leading-normal"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
