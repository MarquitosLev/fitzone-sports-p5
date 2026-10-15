import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function Alert({
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  title,
  message,
  error,
  onClose,
  action,
  children,
  className = '',
}) {
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      container: 'bg-[#EAF7EE] border-[#2E9E5B]/30 text-slate-800',
      iconColor: 'text-[#2E9E5B]',
      titleColor: 'text-[#2E9E5B]',
    },
    error: {
      icon: AlertCircle,
      container: 'bg-[#FDECEE] border-[#E5484D]/30 text-slate-800',
      iconColor: 'text-[#E5484D]',
      titleColor: 'text-[#E5484D]',
    },
    warning: {
      icon: AlertTriangle,
      container: 'bg-[#FEF7E6] border-[#F0B429]/40 text-slate-800',
      iconColor: 'text-[#F0B429]',
      titleColor: 'text-[#B7791F]',
    },
    info: {
      icon: Info,
      container: 'bg-[#1B2A55]/5 border-[#1B2A55]/20 text-slate-800',
      iconColor: 'text-[#1B2A55]',
      titleColor: 'text-[#1B2A55]',
    },
  };

  const currentType = typeConfig[type] || typeConfig.info;
  const Icon = currentType.icon;

  // Parse backend error structure if provided
  const targetError = error || (type === 'error' && typeof message === 'object' ? message : null);
  let resolvedTitle = title;
  let resolvedMessage = message;
  let errorList = [];

  if (targetError && typeof targetError === 'object') {
    if (targetError.title) resolvedTitle = resolvedTitle || targetError.title;
    if (targetError.message) resolvedMessage = targetError.message;
    if (Array.isArray(targetError.errors)) {
      errorList = targetError.errors;
    } else if (typeof targetError.details === 'string') {
      errorList = [targetError.details];
    } else if (Array.isArray(targetError.details)) {
      errorList = targetError.details;
    }
  } else if (Array.isArray(message)) {
    errorList = message;
    resolvedMessage = null;
  }

  return (
    <div
      role="alert"
      className={`
        relative rounded-2xl border p-4 transition-all duration-200
        ${currentType.container}
        ${className}
      `}
    >
      <div className="flex items-start gap-3.5">
        {/* Type Icon */}
        <div className={`shrink-0 mt-0.5 ${currentType.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 pr-2">
          {resolvedTitle && (
            <h4 className={`text-sm font-extrabold font-outfit mb-1 ${currentType.titleColor}`}>
              {resolvedTitle}
            </h4>
          )}

          {resolvedMessage && typeof resolvedMessage === 'string' ? (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {resolvedMessage}
            </p>
          ) : (
            resolvedMessage
          )}

          {/* Render backend structured error list if present */}
          {errorList.length > 0 && (
            <ul className="mt-2 space-y-1 list-disc list-inside text-xs font-semibold text-slate-700">
              {errorList.map((errItem, idx) => (
                <li key={idx} className="leading-relaxed">
                  {typeof errItem === 'object' ? errItem.message || JSON.stringify(errItem) : String(errItem)}
                </li>
              ))}
            </ul>
          )}

          {children && <div className="mt-2 text-xs sm:text-sm">{children}</div>}

          {/* Action element */}
          {action && <div className="mt-3 flex items-center gap-2">{action}</div>}
        </div>

        {/* Dismiss Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
