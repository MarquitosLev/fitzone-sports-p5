import React, { useState, useId } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | { message?: string } | null;
  errorMessage?: string | null;
  required?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode | React.ElementType;
  rightIcon?: React.ReactNode | React.ElementType;
  fullWidth?: boolean;
  type?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
  inputClassName?: string;
  showPasswordToggle?: boolean;
}

export function TextField({
  label,
  helperText,
  error,
  errorMessage,
  required = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = true,
  type = 'text',
  id,
  name,
  placeholder,
  value,
  onChange,
  className = '',
  inputClassName = '',
  showPasswordToggle = true,
  ...props
}: TextFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id || name || generatedId;

  // Determine error text from error prop or errorMessage prop
  const resolvedError = errorMessage || (typeof error === 'string' ? error : (error && error.message) ? error.message : null);
  const hasError = Boolean(error || errorMessage);

  const isPasswordType = type === 'password';
  const computedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  const renderIcon = (IconInput: React.ReactNode | React.ElementType) => {
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
        {/* Left Icon */}
        {LeftIcon && (
          <div className="pl-3.5 pr-1 text-slate-400 shrink-0 pointer-events-none">
            {renderIcon(LeftIcon)}
          </div>
        )}

        {/* HTML Input */}
        <input
          id={inputId}
          name={name}
          type={computedType}
          disabled={disabled}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`
            w-full h-11 px-3.5 text-xs sm:text-sm font-medium text-[#1B2A55] placeholder:text-slate-400
            bg-transparent focus:outline-none disabled:cursor-not-allowed
            ${inputClassName}
          `}
          {...props}
        />

        {/* Right Icon or Password Visibility Toggle */}
        {isPasswordType && showPasswordToggle ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            tabIndex={-1}
            className="pr-3.5 pl-1 text-slate-400 hover:text-[#1B2A55] transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : RightIcon ? (
          <div className="pr-3.5 pl-1 text-slate-400 shrink-0 pointer-events-none">
            {renderIcon(RightIcon)}
          </div>
        ) : null}
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
