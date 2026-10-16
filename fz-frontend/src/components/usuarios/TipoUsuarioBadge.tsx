import React from 'react';
import { Badge } from '../ui/Badge';
import type { BadgeSize, BadgeVariant } from '../ui/Badge';
import type { TipoUsuario } from '../../types';

export interface TipoUsuarioBadgeProps {
  tipoUsuario?: TipoUsuario | string | null;
  size?: BadgeSize;
  showDot?: boolean;
  className?: string;
  label?: React.ReactNode;
}

// Configuración de colores institucionales y etiquetas según el rol (RF-01)
const TIPO_CONFIG: Record<TipoUsuario, { variant: BadgeVariant; label: string }> = {
  SOCIO: {
    variant: 'green-soft',
    label: 'Socio',
  },
  EXTERNO: {
    variant: 'gold-soft',
    label: 'Externo',
  },
  RECEPCIONISTA: {
    variant: 'navy-soft',
    label: 'Recepcionista',
  },
  GERENTE: {
    variant: 'navy',
    label: 'Gerente',
  },
};

/**
 * Componente que mapea semánticamente los roles del sistema a la paleta oficial de FitZone Sports.
 * Envuelve a Badge con estilos normalizados para SOCIO, EXTERNO, RECEPCIONISTA y GERENTE.
 */
export function TipoUsuarioBadge({
  tipoUsuario,
  size = 'sm',
  showDot = false,
  className = '',
  label,
}: TipoUsuarioBadgeProps) {
  const normalized = (tipoUsuario?.toUpperCase() as TipoUsuario) || 'EXTERNO';
  const config = TIPO_CONFIG[normalized] || {
    variant: 'default' as BadgeVariant,
    label: tipoUsuario ? String(tipoUsuario) : 'Desconocido',
  };

  return (
    <Badge
      variant={config.variant}
      size={size}
      showDot={showDot}
      className={className}
    >
      {label ?? config.label}
    </Badge>
  );
}
