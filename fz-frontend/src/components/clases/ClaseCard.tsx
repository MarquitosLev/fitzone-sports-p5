/**
 * ClaseCard.tsx — Tarjeta de clase grupal para la vista del SOCIO.
 * Muestra info de la clase y un botón de acción dinámica según el estado
 * del socio respecto a esa clase y la ventana temporal de 48 horas.
 *
 * Reglas de negocio implementadas:
 * - Solo se puede reservar/anotarse si la clase inicia dentro de las próximas 48 hs (y en el futuro).
 * - BUG-02: No se puede reservar ni anotar en lista de espera sobre una clase cancelada o ya iniciada.
 * - Si el socio ya tiene una reserva o está en espera, el botón queda deshabilitado.
 *
 * Este componente NO hace fetch: toda la lógica de acción entra por props.
 */

import { Calendar, Clock, Users } from 'lucide-react';
import { Card, CardContent } from '../ui';
import { Badge } from '../ui';
import { Button } from '../ui';
import { CupoIndicator } from './CupoIndicator';
import { PosicionEsperaBadge } from './PosicionEsperaBadge';
import type { ClaseGrupalDTO } from '../../types';
import { formatearFechaHora, formatearHora } from '../../utils/formatters';

// ── Constante de ventana de reserva (48 hs en milisegundos) ─────────────────
const VENTANA_RESERVA_MS = 48 * 60 * 60 * 1000;

interface ClaseCardProps {
  clase: ClaseGrupalDTO;
  /** True si el socio ya tiene una reserva CONFIRMADA para esta clase */
  estaReservada: boolean;
  /** True si el socio está en la lista de espera para esta clase */
  estaEnEspera: boolean;
  /** Posición en la lista de espera (solo requerida si estaEnEspera = true) */
  ordenEnEspera?: number;
  /** Callback para reservar la clase. La mutación (fetch) la hace el padre. */
  onReservar: () => void;
  /** Callback para anotarse en lista de espera. La mutación la hace el padre. */
  onAnotarEnEspera: () => void;
  /** Estado de carga del padre (mientras procesa la acción) */
  isLoading?: boolean;
}

/**
 * Calcula si la clase está dentro de la ventana de reserva de 48 hs.
 * Devuelve true solo si la clase:
 * 1. No ha comenzado aún (fechaHoraInicio > ahora)
 * 2. Comienza dentro de las próximas 48 horas
 */
function estaEnVentana(fechaHoraInicio: string): boolean {
  const ahora = Date.now();
  const inicio = new Date(fechaHoraInicio).getTime();
  const diferencia = inicio - ahora;
  // La clase debe ser futura Y estar a menos de 48 hs
  return diferencia > 0 && diferencia <= VENTANA_RESERVA_MS;
}

export function ClaseCard({
  clase,
  estaReservada,
  estaEnEspera,
  ordenEnEspera,
  onReservar,
  onAnotarEnEspera,
  isLoading = false,
}: ClaseCardProps) {
  const enVentana = estaEnVentana(clase.fechaHoraInicio);
  const sinCupo = clase.cupoDisponible === 0;

  // ── Determinar el estado del botón ────────────────────────────────────────
  type AccionBtn = 'reservar' | 'espera' | 'ya-reservada' | 'fuera-de-ventana';

  let accion: AccionBtn;
  if (!enVentana) {
    accion = 'fuera-de-ventana';
  } else if (estaReservada || estaEnEspera) {
    accion = 'ya-reservada';
  } else if (sinCupo) {
    accion = 'espera';
  } else {
    accion = 'reservar';
  }

  const btnConfig: Record<AccionBtn, { label: string; variant: Parameters<typeof Button>[0]['variant']; disabled: boolean }> = {
    reservar: { label: 'Reservar', variant: 'success', disabled: false },
    espera: { label: 'Anotarme en espera', variant: 'secondary', disabled: false },
    'ya-reservada': { label: 'Ya reservada', variant: 'secondary', disabled: true },
    'fuera-de-ventana': { label: 'Fuera de ventana', variant: 'secondary', disabled: true },
  };

  const btn = btnConfig[accion];

  const handleClick = () => {
    if (accion === 'reservar') onReservar();
    if (accion === 'espera') onAnotarEnEspera();
  };

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex flex-col h-full space-y-4">

        {/* ── Cabecera: nombre + badges de estado ─────────────────────────── */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-fitzone-navy font-outfit leading-tight">
              {clase.nombreActividad}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{clase.sede.nombre}</p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {/* Badge de estado personal del socio */}
            {estaReservada && <Badge variant="green-soft" size="xs">RESERVADA</Badge>}
            {estaEnEspera && !estaReservada && <Badge variant="gold-soft" size="xs">EN ESPERA</Badge>}
            {!enVentana && !estaReservada && !estaEnEspera && (
              <Badge variant="default" size="xs">
                {new Date(clase.fechaHoraInicio) <= new Date() ? 'FINALIZADA' : '+48 HS'}
              </Badge>
            )}
          </div>
        </div>

        {/* ── Detalles: fecha, hora, duración ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-fitzone-coral shrink-0" />
            <span className="font-bold text-fitzone-navy">{formatearHora(clase.fechaHoraInicio)}</span>
            <span className="text-slate-400">· {clase.duracionMinutos} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500">{clase.cupoDisponible} / {clase.cupoMaximo} cupos</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 text-[11px]">
              {formatearFechaHora(clase.fechaHoraInicio)}
            </span>
          </div>
        </div>

        {/* ── Indicador de cupo ────────────────────────────────────────────── */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Users className="w-3.5 h-3.5" />
              Cupo disponible
            </span>
            <span className="font-extrabold text-fitzone-navy">
              {clase.cupoDisponible} / {clase.cupoMaximo}
            </span>
          </div>
          <CupoIndicator cupoDisponible={clase.cupoDisponible} cupoMaximo={clase.cupoMaximo} />
        </div>

        {/* ── Posición en lista de espera (si aplica) ──────────────────────── */}
        {estaEnEspera && ordenEnEspera !== undefined && (
          <PosicionEsperaBadge ordenPosicion={ordenEnEspera} />
        )}

        {/* ── Botón de acción (se empuja al fondo de la tarjeta) ───────────── */}
        <div className="mt-auto pt-2">
          <Button
            id={`btn-clase-${clase.idClase}-${accion}`}
            variant={btn.variant}
            size="sm"
            className="w-full"
            disabled={btn.disabled || isLoading}
            isLoading={isLoading && (accion === 'reservar' || accion === 'espera')}
            onClick={handleClick}
          >
            {btn.label}
          </Button>

          {/* Aviso contextual para "fuera de ventana" */}
          {accion === 'fuera-de-ventana' && new Date(clase.fechaHoraInicio) > new Date() && (
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              Reserva habilitada hasta 48 hs antes del inicio
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
