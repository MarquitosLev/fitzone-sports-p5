/**
 * PosicionEsperaBadge.tsx — Muestra la posición del socio en la lista de espera.
 * Componente 100% presentacional: no hace fetch ni importa servicios.
 * Reutiliza Badge del kit de UI siguiendo el sistema de diseño FitZone.
 */

import { Badge } from '../ui';

interface PosicionEsperaBadgeProps {
  /** Posición en la cola de espera (1 = siguiente a ser notificado). */
  ordenPosicion: number;
  /** Tamaño visual del badge. Por defecto 'sm'. */
  size?: 'xs' | 'sm';
  className?: string;
}

/**
 * Convierte un número ordinal a su representación en español.
 * Ej: 1 → "1°", 2 → "2°", 3 → "3°"
 */
function formatOrdinal(n: number): string {
  return `${n}°`;
}

export function PosicionEsperaBadge({ ordenPosicion, size = 'sm', className }: PosicionEsperaBadgeProps) {
  return (
    <Badge
      variant="gold-soft"
      size={size}
      className={className}
    >
      Estás {formatOrdinal(ordenPosicion)} en la lista
    </Badge>
  );
}
