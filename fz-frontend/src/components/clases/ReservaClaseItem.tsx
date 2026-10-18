/**
 * ReservaClaseItem.tsx — Item de lista para una reserva de clase grupal del socio.
 *
 * Reglas de negocio implementadas (prevención BUG-02):
 * - Solo las reservas con estado 'CONFIRMADA' pueden cancelarse.
 * - Si faltan ≤ 2 hs para el inicio de la clase, el botón "Cancelar" se deshabilita
 *   con un aviso claro ("Cancelación disponible hasta 2 hs antes").
 * - Si la reserva está en estado 'CANCELADA', 'ASISTIO' o 'NO_ASISTIO', no se
 *   ofrece ninguna acción de cancelación.
 * - La acción destructiva pasa siempre por ConfirmDialog antes de invocar onCancelar.
 *
 * Este componente NO hace fetch: la mutación la ejecuta el padre vía `onCancelar`.
 */

import { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { StatusBadge, ConfirmDialog } from '../ui';
import { PosicionEsperaBadge } from './PosicionEsperaBadge';
import type { ReservaClaseDTO, ListaEsperaDTO } from '../../types';
import { formatearFechaHora, formatearHora } from '../../utils/formatters';

// ── Constante de corte de cancelación (2 hs en milisegundos) ────────────────
const CORTE_CANCELACION_MS = 2 * 60 * 60 * 1000;

interface ReservaClaseItemProps {
  reserva: ReservaClaseDTO;
  /** Entrada en lista de espera del socio para la misma clase, si existe */
  listaEspera?: ListaEsperaDTO;
  /** Callback ejecutado después de confirmar la cancelación */
  onCancelar: (idReservaClase: number) => void;
  /** Estado de carga del padre mientras procesa la cancelación */
  isLoading?: boolean;
}

/**
 * Calcula si quedan ≤ 2 hs para el inicio de la clase.
 * Retorna true si el botón de cancelar debe estar deshabilitado por tiempo.
 */
function estaDentroDelCorteDeCancelacion(fechaHoraInicio: string): boolean {
  const ahora = Date.now();
  const inicio = new Date(fechaHoraInicio).getTime();
  const diferencia = inicio - ahora;
  // Si la diferencia es positiva (clase futura) y menor a 2 hs, no se puede cancelar
  return diferencia > 0 && diferencia <= CORTE_CANCELACION_MS;
}

export function ReservaClaseItem({ reserva, listaEspera, onCancelar, isLoading = false }: ReservaClaseItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const { estado, clase } = reserva;
  const esCancelable = estado === 'CONFIRMADA';
  const dentroDelCorte = estaDentroDelCorteDeCancelacion(clase.fechaHoraInicio);

  // El botón "Cancelar" está disponible SOLO si la reserva está confirmada
  // Y todavía faltan más de 2 hs para el inicio
  const puedeCancel = esCancelable && !dentroDelCorte;

  return (
    <>
      {/* ── Tarjeta del item ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 flex flex-col sm:flex-row sm:items-center gap-4">

        {/* ── Columna izquierda: info de la clase ──────────────────────── */}
        <div className="flex-1 space-y-2 min-w-0">

          {/* Nombre de la actividad */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-black text-fitzone-navy font-outfit truncate">
              {clase.nombreActividad}
            </h4>
            <StatusBadge status={estado} size="xs" />
            {/* Si el socio también está en lista de espera para otra clase, lo mostramos */}
            {listaEspera && (
              <PosicionEsperaBadge ordenPosicion={listaEspera.ordenPosicion} size="xs" />
            )}
          </div>

          {/* Detalles: sede, fecha/hora */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {clase.sede.nombre}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatearFechaHora(clase.fechaHoraInicio)}
            </span>
            <span className="flex items-center gap-1 font-bold text-fitzone-navy">
              <Clock className="w-3 h-3 text-fitzone-coral" />
              {formatearHora(clase.fechaHoraInicio)}
              <span className="font-normal text-slate-400">· {clase.duracionMinutos} min</span>
            </span>
          </div>
        </div>

        {/* ── Columna derecha: botón de acción ─────────────────────────── */}
        <div className="shrink-0">
          {/* Solo mostramos botón si la reserva es CONFIRMADA */}
          {esCancelable && (
            <div className="flex flex-col items-end gap-1">
              <button
                id={`btn-cancelar-reserva-${reserva.idReservaClase}`}
                onClick={() => setShowConfirm(true)}
                disabled={!puedeCancel || isLoading}
                className={`
                  px-4 py-2 rounded-xl text-xs font-bold transition-all
                  ${puedeCancel && !isLoading
                    ? 'bg-red-50 hover:bg-red-100 text-fitzone-red border border-red-200 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  }
                `}
              >
                {isLoading ? 'Cancelando...' : 'Cancelar'}
              </button>

              {/* Aviso cuando está dentro del corte de 2 hs */}
              {dentroDelCorte && (
                <p className="text-[10px] text-slate-400 text-right max-w-[160px] leading-tight">
                  Cancelación disponible hasta 2 hs antes
                </p>
              )}
            </div>
          )}

          {/* Para estados terminales, texto informativo */}
          {!esCancelable && (
            <span className="text-xs text-slate-400 font-medium">Sin acciones</span>
          )}
        </div>
      </div>

      {/* ── ConfirmDialog: evitar cancelaciones involuntarias ─────────────── */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          onCancelar(reserva.idReservaClase);
        }}
        title="Cancelar reserva de clase"
        description={`¿Estás seguro de que querés cancelar tu reserva de "${clase.nombreActividad}"? Tu lugar se liberará para el próximo socio en lista de espera.`}
        confirmText="Sí, cancelar reserva"
        cancelText="Volver"
        variant="danger"
      />
    </>
  );
}
