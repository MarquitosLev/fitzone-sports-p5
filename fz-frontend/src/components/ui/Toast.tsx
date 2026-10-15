import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastErrorObject {
  title?: string;
  message?: string;
  errors?: (string | { message?: string } | unknown)[];
  details?: string | (string | { message?: string } | unknown)[];
}

export interface ToastProps {
  type?: ToastType;
  title?: React.ReactNode;
  message?: React.ReactNode | ToastErrorObject;
  onClose?: () => void;
  icon?: React.ReactNode | React.ElementType;
  className?: string;
}

export function Toast({
  type = 'info',
  title,
  message,
  onClose,
  icon: CustomIcon,
  className = '',
}: ToastProps) {
  const iconConfig: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-[#2E9E5B] shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-[#E5484D] shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F0B429] shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-[#1B2A55] shrink-0 mt-0.5" />,
  };

  const borderConfig: Record<ToastType, string> = {
    success: 'border-l-4 border-l-[#2E9E5B]',
    error: 'border-l-4 border-l-[#E5484D]',
    warning: 'border-l-4 border-l-[#F0B429]',
    info: 'border-l-4 border-l-[#1B2A55]',
  };

  // Support structured backend error formats
  let resolvedMessage = message as React.ReactNode;
  let errorDetails: (string | { message?: string } | unknown)[] = [];

  if (message && typeof message === 'object' && !React.isValidElement(message)) {
    const errorObj = message as ToastErrorObject;
    if (errorObj.message) resolvedMessage = errorObj.message;
    if (Array.isArray(errorObj.errors)) errorDetails = errorObj.errors;
    else if (Array.isArray(errorObj.details)) errorDetails = errorObj.details;
  }

  const renderIcon = (IconInput: React.ReactNode | React.ElementType) => {
    if (!IconInput) return null;
    if (React.isValidElement(IconInput)) return IconInput;
    const Resolved = IconInput as React.ElementType;
    return <Resolved className="w-5 h-5" />;
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-100
        ${borderConfig[type] || borderConfig.info}
        flex items-start gap-3.5 animate-slide-up transition-all ${className}
      `}
    >
      {/* Icon */}
      {CustomIcon ? (
        <div className="shrink-0 mt-0.5">{renderIcon(CustomIcon)}</div>
      ) : (
        iconConfig[type] || iconConfig.info
      )}

      {/* Text details */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-sm font-extrabold text-[#1B2A55] font-outfit">
            {title}
          </h4>
        )}

        {resolvedMessage && typeof resolvedMessage === 'string' && (
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
            {resolvedMessage}
          </p>
        )}

        {/* Backend error list */}
        {errorDetails.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-[11px] text-slate-600 font-semibold">
            {errorDetails.map((detail, idx) => (
              <li key={idx}>
                {typeof detail === 'object' && detail !== null ? (detail as { message?: string }).message || JSON.stringify(detail) : String(detail)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dismiss button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
