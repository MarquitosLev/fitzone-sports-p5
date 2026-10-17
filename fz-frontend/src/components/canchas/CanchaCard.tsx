/**
 * CanchaCard.tsx — Tarjeta de cancha individual (RF-09, RF-12).
 *
 * Muestra nombre, tipo, precio por hora y estado (Disponible / En mantenimiento).
 * Incluye MantenimientoToggle y acciones de edición.
 * Diseñado para ser reutilizable también en la vista de reserva de turnos.
 */

import { Layers, Edit2, Activity, Clock } from 'lucide-react';
import { Card, StatusBadge, Button } from '../ui';
import { MantenimientoToggle } from './MantenimientoToggle';
import type { CanchaDTO } from '../../types';
import { formatearMonto } from '../../utils/formatters';

export interface CanchaCardProps {
  cancha: CanchaDTO;
  /** Callback opcional para editar la cancha */
  onEditar?: (cancha: CanchaDTO) => void;
  /** Callback para alternar el mantenimiento */
  onToggleMantenimiento?: (idCancha: number, nuevoEstado: boolean) => Promise<void> | void;
  /** Mostrar controles administrativos (switch y botón editar) */
  showAdminControls?: boolean;
  /** Callback cuando se hace clic en la tarjeta (por ej. en reserva de turnos) */
  onSelect?: (cancha: CanchaDTO) => void;
  selected?: boolean;
  className?: string;
}

const TIPO_LABELS: Record<string, string> = {
  PADEL: 'Pádel',
  FUTBOL_5: 'Fútbol 5',
  FUTBOL_7: 'Fútbol 7',
  TENIS: 'Tenis',
  BASQUET: 'Básquet',
  OTRO: 'Deporte',
};

export function CanchaCard({
  cancha,
  onEditar,
  onToggleMantenimiento,
  showAdminControls = true,
  onSelect,
  selected = false,
  className = '',
}: CanchaCardProps) {
  const isMantenimiento = cancha.enMantenimiento;
  const tipoLabel = (cancha.tipo && TIPO_LABELS[cancha.tipo]) || 'Cancha';

  return (
    <Card
      variant={isMantenimiento ? 'flat' : 'default'}
      className={`
        transition-all duration-200 overflow-hidden border
        ${selected ? 'ring-2 ring-fitzone-coral border-fitzone-coral' : ''}
        ${isMantenimiento ? 'bg-slate-50/70 border-amber-200/60' : 'hover:border-slate-300'}
        ${className}
      `}
    >
      <div className="p-5 flex flex-col justify-between h-full space-y-4">
        {/* Cabecera con Nombre y Estado */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`
                w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors
                ${isMantenimiento ? 'bg-[#FEF7E6] text-[#B7791F]' : 'bg-[#1B2A55]/5 text-[#1B2A55]'}
              `}
            >
              <Layers className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-black text-[#1B2A55] font-outfit truncate tracking-tight">
                {cancha.nombre}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Activity className="w-3 h-3 text-slate-400" />
                  {tipoLabel}
                </span>
                <span className="text-xs text-slate-400 font-medium truncate">
                  {cancha.sede?.nombre}
                </span>
              </div>
            </div>
          </div>

          <StatusBadge
            status={isMantenimiento ? 'EN_MANTENIMIENTO' : 'DISPONIBLE'}
            showDot
            size="sm"
          />
        </div>

        {/* Sección de Precio y métricas */}
        <div className="bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Tarifa por hora:</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-[#1B2A55] font-outfit tracking-tight">
              {formatearMonto(cancha.precioBaseHora)}
            </span>
            <span className="text-[10px] text-slate-400 block font-semibold -mt-1">/ hora</span>
          </div>
        </div>

        {/* Controles de Administración o Acción de Selección */}
        {showAdminControls ? (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            {onToggleMantenimiento ? (
              <MantenimientoToggle
                idCancha={cancha.idCancha}
                nombreCancha={cancha.nombre}
                enMantenimiento={isMantenimiento}
                onToggle={(nuevo) => onToggleMantenimiento(cancha.idCancha, nuevo)}
              />
            ) : (
              <div />
            )}

            {onEditar && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEditar(cancha)}
                leftIcon={Edit2}
                className="text-slate-600 hover:text-[#1B2A55]"
              >
                Editar
              </Button>
            )}
          </div>
        ) : onSelect ? (
          <Button
            type="button"
            variant={selected ? 'coral' : 'secondary'}
            fullWidth
            size="sm"
            disabled={isMantenimiento}
            onClick={() => onSelect(cancha)}
          >
            {isMantenimiento ? 'No disponible' : selected ? 'Seleccionada' : 'Seleccionar cancha'}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
