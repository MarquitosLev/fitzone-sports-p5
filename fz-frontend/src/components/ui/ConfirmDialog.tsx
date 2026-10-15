import { isValidElement } from 'react';
import type { ReactNode, ElementType } from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import type { ModalSize } from './Modal';
import { Button } from './Button';
import type { ButtonVariant } from './Button';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  icon?: React.ReactNode | React.ElementType;
  size?: ModalSize;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  description,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  icon: CustomIcon,
  size = 'md',
}: ConfirmDialogProps) {
  const variantStyles: Record<
    ConfirmDialogVariant,
    {
      icon: React.ReactNode | React.ElementType;
      iconBg: string;
      iconColor: string;
      confirmButtonVariant: ButtonVariant;
    }
  > = {
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

  const renderIcon = (IconInput: ReactNode | ElementType) => {
    if (!IconInput) return null;
    if (isValidElement(IconInput)) return IconInput;
    const Resolved = IconInput as ElementType;
    return <Resolved className="w-8 h-8" />;
  };

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
          {renderIcon(DialogIcon)}
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
