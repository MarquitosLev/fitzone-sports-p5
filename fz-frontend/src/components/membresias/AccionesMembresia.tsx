import { useState } from 'react';
import { RefreshCw, PauseCircle, PlayCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button, ConfirmDialog } from '../ui';
import type { ConfirmDialogVariant } from '../ui/ConfirmDialog';
import type { EstadoMembresia } from '../../types';

export interface AccionesMembresiaProps {
  /** Estado actual de la membresía para determinar las transiciones válidas */
  estado: EstadoMembresia;
  /** Acción para renovar o re-dar de alta el plan */
  onRenovar?: () => void | Promise<void>;
  /** Acción para pausar temporalmente el acceso */
  onSuspender?: () => void | Promise<void>;
  /** Acción para rehabilitar una membresía suspendida */
  onReactivar?: () => void | Promise<void>;
  /** Acción para dar de baja definitiva la membresía */
  onCancelar?: () => void | Promise<void>;
  /** Deshabilita todos los botones */
  disabled?: boolean;
  /** Estado de carga externo */
  isLoading?: boolean;
  className?: string;
}

type TipoAccion = 'renovar' | 'suspender' | 'reactivar' | 'cancelar';

interface DialogConfig {
  title: string;
  description: string;
  confirmText: string;
  variant: ConfirmDialogVariant;
}

const DIALOG_CONFIGS: Record<TipoAccion, DialogConfig> = {
  renovar: {
    title: '¿Confirmar renovación de membresía?',
    description: 'Se extenderá la vigencia de la membresía del socio y se registrará el nuevo período de acceso.',
    confirmText: 'Renovar Membresía',
    variant: 'primary',
  },
  suspender: {
    title: '¿Suspender membresía temporalmente?',
    description: 'El socio quedará suspendido y no podrá ingresar a las instalaciones hasta que sea reactivado.',
    confirmText: 'Suspender Acceso',
    variant: 'warning',
  },
  reactivar: {
    title: '¿Reactivar membresía del socio?',
    description: 'Se restaurará el acceso activo del socio para que pueda reanudar sus entrenamientos y reservas.',
    confirmText: 'Reactivar Acceso',
    variant: 'primary',
  },
  cancelar: {
    title: '¿Dar de baja definitiva la membresía?',
    description: 'Esta acción cancelará la membresía del socio de manera inmediata. Se registrará la fecha de cancelación.',
    confirmText: 'Confirmar Cancelación',
    variant: 'danger',
  },
};

/**
 * AccionesMembresia — Barra de acciones contextuales para la membresía de un socio (RF-02).
 * Muestra únicamente las transiciones de estado permitidas y exige confirmación con ConfirmDialog.
 */
export function AccionesMembresia({
  estado,
  onRenovar,
  onSuspender,
  onReactivar,
  onCancelar,
  disabled = false,
  isLoading = false,
  className = '',
}: AccionesMembresiaProps) {
  const [activeDialog, setActiveDialog] = useState<TipoAccion | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Transiciones de estado válidas según RF-02
  const puedeRenovar = estado === 'ACTIVO' || estado === 'VENCIDO' || estado === 'CANCELADO';
  const puedeSuspender = estado === 'ACTIVO';
  const puedeReactivar = estado === 'SUSPENDIDO';
  const puedeCancelar = estado === 'ACTIVO' || estado === 'SUSPENDIDO' || estado === 'VENCIDO';

  const handleOpenDialog = (accion: TipoAccion) => {
    if (disabled || isLoading || isActionLoading) return;
    setActiveDialog(accion);
  };

  const handleConfirm = async () => {
    if (!activeDialog) return;
    setIsActionLoading(true);
    try {
      if (activeDialog === 'renovar' && onRenovar) {
        await onRenovar();
      } else if (activeDialog === 'suspender' && onSuspender) {
        await onSuspender();
      } else if (activeDialog === 'reactivar' && onReactivar) {
        await onReactivar();
      } else if (activeDialog === 'cancelar' && onCancelar) {
        await onCancelar();
      }
      setActiveDialog(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  const dialogConfig = activeDialog ? DIALOG_CONFIGS[activeDialog] : null;
  const isBusy = isLoading || isActionLoading;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {/* Botón Renovar (ACTIVO, VENCIDO, CANCELADO) */}
      {puedeRenovar && (
        <Button
          type="button"
          variant={estado === 'VENCIDO' || estado === 'CANCELADO' ? 'coral' : 'secondary'}
          size="sm"
          leftIcon={RefreshCw}
          onClick={() => handleOpenDialog('renovar')}
          disabled={disabled || isBusy}
          isLoading={isBusy && activeDialog === 'renovar'}
        >
          {estado === 'CANCELADO' ? 'Reactivar Nuevo Plan' : 'Renovar Membresía'}
        </Button>
      )}

      {/* Botón Suspender (ACTIVO) */}
      {puedeSuspender && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={PauseCircle}
          onClick={() => handleOpenDialog('suspender')}
          disabled={disabled || isBusy}
          isLoading={isBusy && activeDialog === 'suspender'}
        >
          Suspender
        </Button>
      )}

      {/* Botón Reactivar (SUSPENDIDO) */}
      {puedeReactivar && (
        <Button
          type="button"
          variant="coral"
          size="sm"
          leftIcon={PlayCircle}
          onClick={() => handleOpenDialog('reactivar')}
          disabled={disabled || isBusy}
          isLoading={isBusy && activeDialog === 'reactivar'}
        >
          Reactivar Membresía
        </Button>
      )}

      {/* Botón Cancelar (ACTIVO, SUSPENDIDO, VENCIDO) */}
      {puedeCancelar && (
        <Button
          type="button"
          variant="danger"
          size="sm"
          leftIcon={XCircle}
          onClick={() => handleOpenDialog('cancelar')}
          disabled={disabled || isBusy}
          isLoading={isBusy && activeDialog === 'cancelar'}
        >
          Cancelar Membresía
        </Button>
      )}

      {/* ConfirmDialog reutilizable de la librería base */}
      {dialogConfig && (
        <ConfirmDialog
          isOpen={Boolean(activeDialog)}
          onClose={() => !isBusy && setActiveDialog(null)}
          onConfirm={() => void handleConfirm()}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmText={dialogConfig.confirmText}
          cancelText="Volver"
          variant={dialogConfig.variant}
          isLoading={isBusy}
          icon={AlertTriangle}
        />
      )}
    </div>
  );
}
