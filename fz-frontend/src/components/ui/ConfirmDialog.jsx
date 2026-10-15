import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  description,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
  icon: CustomIcon,
  size = 'md',
}) {
  const variantStyles = {
    danger: {
      icon: CustomIcon || AlertCircle,
      iconBg: 'bg-[#FDECEE]',
      iconColor: 'text-[#E5484D]',
      confirmButtonVariant: 'danger',
    },
    warning: {
      icon: CustomIcon || AlertTriangle,
      iconBg: 'bg-[#FEF7E6]',
      iconColor: 'text-[#F0B429]',
      confirmButtonVariant: 'coral',
    },
    primary: {
      icon: CustomIcon || HelpCircle,
      iconBg: 'bg-[#1B2A55]/10',
      iconColor: 'text-[#1B2A55]',
      confirmButtonVariant: 'primary',
    },
  };

  const style = variantStyles[variant] || variantStyles.danger;
  const DialogIcon = style.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onClose}
      size={size}
      closeOnBackdrop={!isLoading}
      closeOnEsc={!isLoading}
    >
      <div className="flex flex-col items-center text-center p-2">
        {/* Animated Warning / Danger Icon Badge */}
        <div
          className={`w-16 h-16 rounded-2xl ${style.iconBg} ${style.iconColor} flex items-center justify-center mb-4 shadow-sm animate-pulse-subtle`}
        >
          <DialogIcon className="w-8 h-8" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-[#1B2A55] font-outfit mb-2">
          {title}
        </h3>

        {/* Description / Content */}
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mb-4">
            {description}
          </p>
        )}

        {children && <div className="w-full mb-4">{children}</div>}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full mt-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>

          <Button
            variant={style.confirmButtonVariant}
            fullWidth
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
