import React, { useEffect, useId, useRef } from 'react';
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
  id?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  id,
  initialFocusRef,
}: ModalProps) {
  const generatedId = useId();
  const modalId = id || generatedId;
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element before opening modal
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Focus on initialFocusRef if provided, or first focusable element, or modal container
    const focusTimer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalContentRef.current) {
        const focusableElements = modalContentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalContentRef.current.focus();
        }
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }

      // Focus Trap implementation
      if (e.key === 'Tab' && modalContentRef.current) {
        const focusableElements = Array.from(
          modalContentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');

        if (focusableElements.length === 0) {
          e.preventDefault();
          modalContentRef.current.focus();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalContentRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);

      // Guaranteed focus restoration
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEsc, initialFocusRef]);

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
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={subtitle ? descriptionId : undefined}
      id={modalId}
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
        ref={modalContentRef}
        tabIndex={-1}
        className={`
          relative bg-white w-full ${resolvedWidth} rounded-3xl shadow-modal border border-slate-100
          overflow-hidden z-10 animate-slide-up max-h-[90vh] flex flex-col focus:outline-none ${className}
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
                    id={titleId}
                    className="text-lg font-black text-[#1B2A55] font-outfit truncate tracking-tight"
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p
                    id={descriptionId}
                    className="text-xs text-slate-500 mt-0.5 truncate leading-normal"
                  >
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
