/**
 * MantenimientoToggle.tsx — Switch accesible para alternar el estado de mantenimiento.
 *
 * Requisito RF-12: Switch con ConfirmDialog que aclara que las reservas ya tomadas se mantienen.
 */

import { useState } from 'react';
import { Wrench, CheckCircle2 } from 'lucide-react';
import { ConfirmDialog } from '../ui';

export interface MantenimientoToggleProps {
  idCancha: number;
  nombreCancha: string;
  enMantenimiento: boolean;
  onToggle: (nuevoEstado: boolean) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

export function MantenimientoToggle({
  nombreCancha,
  enMantenimiento,
  onToggle,
  disabled = false,
  className = '',
}: MantenimientoToggleProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // El estado al que pasaría si se confirma la acción
  const targetEstado = !enMantenimiento;

  const handleSwitchClick = () => {
    if (disabled || loading) return;
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onToggle(targetEstado);
      setDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          role="switch"
          aria-checked={enMantenimiento}
          aria-label={`Alternar mantenimiento para ${nombreCancha}`}
          disabled={disabled || loading}
          onClick={handleSwitchClick}
          className={`
            relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1B2A55] focus:ring-offset-2
            ${enMantenimiento ? 'bg-[#F0B429]' : 'bg-slate-200'}
            ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
          `}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md
              ring-0 transition duration-200 ease-in-out flex items-center justify-center
              ${enMantenimiento ? 'translate-x-5' : 'translate-x-0'}
            `}
          >
            {enMantenimiento ? (
              <Wrench className="w-3 h-3 text-[#B7791F]" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            )}
          </span>
        </button>

        <span className="text-xs font-semibold text-slate-600 select-none">
          {enMantenimiento ? 'Mantenimiento' : 'Habilitada'}
        </span>
      </div>

      <ConfirmDialog
        isOpen={dialogOpen}
        onClose={() => {
          if (!loading) setDialogOpen(false);
        }}
        onConfirm={handleConfirm}
        isLoading={loading}
        variant={targetEstado ? 'warning' : 'primary'}
        icon={targetEstado ? Wrench : CheckCircle2}
        title={
          targetEstado
            ? `¿Poner "${nombreCancha}" en mantenimiento?`
            : `¿Habilitar "${nombreCancha}"?`
        }
        description={
          targetEstado
            ? 'La cancha no podrá recibir nuevas reservas mientras esté en mantenimiento. IMPORTANTE: Las reservas ya tomadas se mantienen intactas.'
            : 'La cancha volverá a estar disponible para recibir nuevas reservas y alquileres.'
        }
        confirmText={targetEstado ? 'Confirmar mantenimiento' : 'Habilitar cancha'}
        cancelText="Volver"
      />
    </>
  );
}
