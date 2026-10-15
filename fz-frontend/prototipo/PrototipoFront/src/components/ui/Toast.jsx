import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function Toast({
  type = 'info',
  title,
  message,
  onClose,
  icon: CustomIcon,
  className = '',
}) {
  const iconConfig = {
    success: <CheckCircle2 className="w-5 h-5 text-[#2E9E5B] shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-[#E5484D] shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F0B429] shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-[#1B2A55] shrink-0 mt-0.5" />,
  };

  const borderConfig = {
    success: 'border-l-4 border-l-[#2E9E5B]',
    error: 'border-l-4 border-l-[#E5484D]',
    warning: 'border-l-4 border-l-[#F0B429]',
    info: 'border-l-4 border-l-[#1B2A55]',
  };

  // Support structured backend error formats
  let resolvedMessage = message;
  let errorDetails = [];

  if (message && typeof message === 'object') {
    if (message.message) resolvedMessage = message.message;
    if (Array.isArray(message.errors)) errorDetails = message.errors;
    else if (Array.isArray(message.details)) errorDetails = message.details;
  }

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
        <div className="shrink-0 mt-0.5">{React.isValidElement(CustomIcon) ? CustomIcon : <CustomIcon className="w-5 h-5" />}</div>
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
                {typeof detail === 'object' ? detail.message || JSON.stringify(detail) : String(detail)}
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
