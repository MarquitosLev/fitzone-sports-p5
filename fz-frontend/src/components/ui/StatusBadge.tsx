import React from 'react';

export type StatusVariant = 'green' | 'red' | 'gold' | 'navy' | 'coral' | 'neutral';
export type StatusBadgeSize = 'xs' | 'sm' | 'md' | 'lg';

// Status resolution map for backend domain states
const STATUS_CONFIG_MAP: Record<string, { variant: StatusVariant; label: string }> = {
  // Success / Active states (FitZone Green)
  ACTIVO: { variant: 'green', label: 'Activo' },
  ACTIVA: { variant: 'green', label: 'Activa' },
  CONFIRMADA: { variant: 'green', label: 'Confirmada' },
  CONFIRMADO: { variant: 'green', label: 'Confirmado' },
  PAGADO: { variant: 'green', label: 'Pagado' },
  PAGADA: { variant: 'green', label: 'Pagada' },
  DISPONIBLE: { variant: 'green', label: 'Disponible' },
  PERMITIDO: { variant: 'green', label: 'Permitido' },
  ONLINE: { variant: 'green', label: 'Online' },
  PRESENTE: { variant: 'green', label: 'Presente' },
  APROBADO: { variant: 'green', label: 'Aprobado' },
  APROBADA: { variant: 'green', label: 'Aprobada' },
  REGULAR: { variant: 'green', label: 'Al Día' },

  // Danger / Expired / Cancelled states (FitZone Red)
  VENCIDO: { variant: 'red', label: 'Vencido' },
  VENCIDA: { variant: 'red', label: 'Vencida' },
  SUSPENDIDO: { variant: 'red', label: 'Suspendido' },
  SUSPENDIDA: { variant: 'red', label: 'Suspendida' },
  CANCELADO: { variant: 'red', label: 'Cancelado' },
  CANCELADA: { variant: 'red', label: 'Cancelada' },
  RECHAZADO: { variant: 'red', label: 'Rechazado' },
  RECHAZADA: { variant: 'red', label: 'Rechazada' },
  DENEGADO: { variant: 'red', label: 'Denegado' },
  INACTIVA: { variant: 'red', label: 'Inactiva' },
  INACTIVO: { variant: 'red', label: 'Inactivo' },
  AUSENTE: { variant: 'red', label: 'Ausente' },
  FALLIDO: { variant: 'red', label: 'Fallido' },
  ERROR: { variant: 'red', label: 'Error' },

  // Warning / Pending states (FitZone Gold)
  PENDIENTE: { variant: 'gold', label: 'Pendiente' },
  PENDIENTE_PAGO: { variant: 'gold', label: 'Pendiente de Pago' },
  EN_ESPERA: { variant: 'gold', label: 'En Espera' },
  LISTA_ESPERA: { variant: 'gold', label: 'Lista de Espera' },
  EN_MANTENIMIENTO: { variant: 'gold', label: 'En Mantenimiento' },
  DEMORADO: { variant: 'gold', label: 'Demorado' },
  ALERTA: { variant: 'gold', label: 'Alerta' },
  WARNING: { variant: 'gold', label: 'Advertencia' },

  // Info / Scheduled states (FitZone Navy)
  PROGRAMADA: { variant: 'navy', label: 'Programada' },
  PROGRAMADO: { variant: 'navy', label: 'Programado' },
  EN_CURSO: { variant: 'navy', label: 'En Curso' },
  REVISION: { variant: 'navy', label: 'En Revisión' },
  REGISTRADO: { variant: 'navy', label: 'Registrado' },
  INGRESADO: { variant: 'navy', label: 'Ingresado' },
  INFO: { variant: 'navy', label: 'Informativo' },

  // Neutral / Complete states (Slate)
  FINALIZADA: { variant: 'neutral', label: 'Finalizada' },
  FINALIZADO: { variant: 'neutral', label: 'Finalizado' },
  COMPLETA: { variant: 'neutral', label: 'Completa' },
  COMPLETO: { variant: 'neutral', label: 'Completo' },
  SIN_MEMBRESIA: { variant: 'neutral', label: 'Sin Membresía' },
  DESCONOCIDO: { variant: 'neutral', label: 'Desconocido' },
};

export interface StatusBadgeProps {
  status?: string | number | null;
  label?: React.ReactNode;
  variant?: StatusVariant;
  size?: StatusBadgeSize;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({
  status = '',
  label,
  variant,
  size = 'sm',
  showDot = false,
  className = '',
}: StatusBadgeProps) {
  const normalizedStatus = String(status || '').toUpperCase().trim();
  const matchedConfig = STATUS_CONFIG_MAP[normalizedStatus] || {
    variant: 'neutral' as StatusVariant,
    label: status ? String(status).replace(/_/g, ' ') : 'Desconocido',
  };

  const activeVariant = variant || matchedConfig.variant;
  const displayLabel = label !== undefined ? label : matchedConfig.label;

  // Visual variants using FitZone Tailwind tokens
  const variantStyles: Record<StatusVariant, { badge: string; dot: string }> = {
    green: {
      badge: 'bg-[#EAF7EE] text-[#2E9E5B] border border-[#2E9E5B]/30',
      dot: 'bg-[#2E9E5B]',
    },
    red: {
      badge: 'bg-[#FDECEE] text-[#E5484D] border border-[#E5484D]/30',
      dot: 'bg-[#E5484D]',
    },
    gold: {
      badge: 'bg-[#FEF7E6] text-[#B7791F] border border-[#F0B429]/40',
      dot: 'bg-[#F0B429]',
    },
    navy: {
      badge: 'bg-[#1B2A55]/10 text-[#1B2A55] border border-[#1B2A55]/20',
      dot: 'bg-[#1B2A55]',
    },
    coral: {
      badge: 'bg-[#FEEAEA] text-[#F26D6D] border border-[#F26D6D]/30',
      dot: 'bg-[#F26D6D]',
    },
    neutral: {
      badge: 'bg-slate-100 text-slate-600 border border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const sizeStyles: Record<StatusBadgeSize, string> = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1.5',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2',
  };

  const dotSizeStyles: Record<StatusBadgeSize, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const currentVariant = variantStyles[activeVariant] || variantStyles.neutral;

  return (
    <span
      className={`
        inline-flex items-center font-bold tracking-wide uppercase rounded-full select-none transition-colors
        ${sizeStyles[size] || sizeStyles.sm}
        ${currentVariant.badge}
        ${className}
      `}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${dotSizeStyles[size] || dotSizeStyles.sm} ${currentVariant.dot}`}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
