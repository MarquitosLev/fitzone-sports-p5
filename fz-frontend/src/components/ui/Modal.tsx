import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode | React.ElementType;
  size?: ModalSize;
  maxWidth?: string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  icon: Icon,
  size = 'md',
  maxWidth,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = '',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-[95vw]',
  };

  const resolvedWidth = maxWidth || sizeClasses[size] || sizeClasses.md;

  const renderIcon = (IconInput: React.ReactNode | React.ElementType) => {
    if (!IconInput) return null;
    if (React.isValidElement(IconInput)) return IconInput;
    const Resolved = IconInput as React.ElementType;
    return <Resolved className="w-5 h-5" />;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B2A55]/60 backdrop-blur-sm animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (closeOnBackdrop) onClose?.();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`
          relative bg-white w-full ${resolvedWidth} rounded-3xl shadow-modal border border-slate-100
          overflow-hidden z-10 animate-slide-up max-h-[90vh] flex flex-col ${className}
        `}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-3 min-w-0 pr-3">
              {Icon && (
                <div className="w-10 h-10 rounded-2xl bg-[#1B2A55]/10 text-[#1B2A55] flex items-center justify-center shrink-0">
                  {renderIcon(Icon)}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3
                    id="modal-title"
                    className="text-lg font-black text-[#1B2A55] font-outfit truncate tracking-tight"
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate leading-normal">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-[#1B2A55] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-sm">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
