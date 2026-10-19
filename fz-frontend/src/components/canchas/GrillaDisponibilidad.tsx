/**
 * GrillaDisponibilidad.tsx — Grilla interactiva de turnos y disponibilidad de canchas (RF-10, SCRUM-75).
 *
 * Características:
 * - Franjas horarias con estados: LIBRE, OCUPADO, MANTENIMIENTO, RECIEN_TOMADO.
 * - Destaca visualmente la franja pico (19 a 21 hs).
 * - Selección interactiva de turno.
 * - Precios calculados con descuento tachado para socios activos.
 * - Detección de turnos en horarios pasados para el día actual.
 * - Leyenda explicativa y estados de carga.
 */

import { Clock, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import type { CanchaDTO, FranjaHorariaDTO } from '../../types';
import { Spinner } from '../ui';
import { formatearMonto } from '../../utils/formatters';

export interface GrillaDisponibilidadProps {
  /** Lista de franjas horarias */
  franjas: FranjaHorariaDTO[];
  /** Turno actualmente seleccionado */
  turnoSeleccionado?: FranjaHorariaDTO | null;
  /** Callback al seleccionar una franja horaria */
  onSeleccionarTurno?: (turno: FranjaHorariaDTO) => void;
  /** Información de la cancha (para tarifa base y cálculo) */
  cancha?: CanchaDTO;
  /** Fecha en formato YYYY-MM-DD para validar turnos pasados de hoy */
  fecha?: string;
  /** Si el usuario actual es socio (para mostrar precios con descuento) */
  esSocio?: boolean;
  /** Estado de carga de la disponibilidad */
  loading?: boolean;
  /** Deshabilitar selección de turnos */
  disabled?: boolean;
  className?: string;
}

export function GrillaDisponibilidad({
  franjas,
  turnoSeleccionado,
  onSeleccionarTurno,
  cancha,
  fecha,
  esSocio = false,
  loading = false,
  disabled = false,
  className = '',
}: GrillaDisponibilidadProps) {
  // Fecha de hoy para comparar si el turno ya transcurrió
  const ahora = new Date();
  const hoyIso = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  const esHoy = fecha ? fecha === hoyIso : false;
  const fechaEsPasada = fecha ? fecha < hoyIso : false;

  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

  const esTurnoPasado = (horaInicio: string) => {
    if (fechaEsPasada) return true;
    if (!esHoy) return false;
    const [h, m] = horaInicio.split(':').map(Number);
    const turnoMinutos = h * 60 + (m || 0);
    return turnoMinutos <= minutosActuales;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
        <Spinner size="lg" />
        <p className="text-xs font-semibold text-slate-500 mt-3">
          Consultando disponibilidad de turnos...
        </p>
      </div>
    );
  }

  if (franjas.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 p-6">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-fitzone-navy">Sin franjas horarias</h4>
        <p className="text-xs text-slate-500 mt-1">
          No hay turnos disponibles para la fecha y cancha seleccionadas.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Banner de Cancha en Mantenimiento completo */}
      {cancha?.enMantenimiento && (
        <div className="p-4 bg-[#FEF7E6] rounded-2xl border border-[#F0B429]/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B7791F] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-[#1B2A55] uppercase tracking-wider">
              Cancha temporalmente fuera de servicio
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Esta cancha se encuentra en mantenimiento programado. No es posible reservar turnos hasta nuevo aviso.
            </p>
          </div>
        </div>
      )}

      {/* Grid de Franjas Horarias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {franjas.map((slot) => {
          const isSelected = turnoSeleccionado?.id === slot.id;
          const isPast = esTurnoPasado(slot.horaInicio);
          const isOccupied = slot.estado === 'OCUPADO';
          const isMaintenance = slot.estado === 'MANTENIMIENTO' || cancha?.enMantenimiento;
          const isJustTaken = slot.estado === 'RECIEN_TOMADO';
          const isAvailable = !isPast && !isOccupied && !isMaintenance && !isJustTaken;

          // Cálculo de precios estimados para mostrar en la tarjeta
          const basePrice = slot.precioEstimado ?? cancha?.precioBaseHora ?? 8000;
          const peakSurge = slot.esPico ? Math.round(basePrice * 0.2) : 0;
          const subtotal = basePrice + peakSurge;
          const discount = esSocio ? Math.round(subtotal * 0.15) : 0;
          const finalPrice = subtotal - discount;

          // Estilos visuales según estado
          let cardStyle =
            'bg-white border-slate-200/80 hover:border-fitzone-navy hover:shadow-xs cursor-pointer text-slate-700';
          let badgeText = 'Disponible';
          let badgeVariant: 'green-soft' | 'red-soft' | 'amber-soft' | 'default' = 'green-soft';

          if (isPast) {
            cardStyle = 'bg-slate-100/70 border-slate-200/60 opacity-50 cursor-not-allowed text-slate-400';
            badgeText = 'Horario pasado';
            badgeVariant = 'default';
          } else if (isSelected) {
            cardStyle =
              'bg-fitzone-navy text-white border-fitzone-navy shadow-md ring-2 ring-fitzone-coral scale-[1.02] cursor-pointer';
            badgeText = 'Seleccionado';
            badgeVariant = 'green-soft';
          } else if (isOccupied) {
            cardStyle = 'bg-slate-100/70 border-slate-200/80 opacity-65 cursor-not-allowed text-slate-500';
            badgeText = 'Ocupado';
            badgeVariant = 'default';
          } else if (isMaintenance) {
            cardStyle = 'bg-[#FEF7E6]/70 border-[#F0B429]/30 opacity-75 cursor-not-allowed text-slate-600';
            badgeText = 'Mantenimiento';
            badgeVariant = 'amber-soft';
          } else if (isJustTaken) {
            cardStyle = 'bg-rose-50 border-rose-200 text-rose-800 opacity-80 cursor-not-allowed';
            badgeText = 'Recién tomado';
            badgeVariant = 'red-soft';
          }

          const handleClick = () => {
            if (!disabled && isAvailable && onSeleccionarTurno) {
              onSeleccionarTurno(slot);
            }
          };

          return (
            <button
              type="button"
              key={slot.id}
              disabled={disabled || !isAvailable}
              onClick={handleClick}
              className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between min-h-[135px] ${cardStyle}`}
            >
              {/* Header de la Franja: Indicador Pico / Estándar */}
              <div className="flex items-start justify-between gap-1 w-full">
                {slot.esPico ? (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-fitzone-coral text-white'
                        : 'bg-fitzone-coral/15 text-fitzone-coral'
                    }`}
                  >
                    <Flame className="w-3 h-3 shrink-0" />
                    Pico +20%
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isSelected ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    Estándar
                  </span>
                )}

                {isSelected && (
                  <CheckCircle className="w-4 h-4 text-fitzone-coral shrink-0" />
                )}
              </div>

              {/* Horario del Turno */}
              <div className="my-2">
                <span
                  className={`text-base font-black font-outfit block tracking-tight ${
                    isSelected ? 'text-white' : 'text-[#1B2A55]'
                  }`}
                >
                  {slot.textoTurno}
                </span>
                <span
                  className={`text-[11px] font-medium block -mt-0.5 ${
                    isSelected ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  Duración: 1 hora
                </span>
              </div>

              {/* Precios y Estado */}
              <div className="pt-2 border-t border-current/10 flex items-center justify-between gap-2 w-full flex-wrap">
                {isAvailable || isSelected ? (
                  <div className="min-w-0">
                    {esSocio && discount > 0 ? (
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span
                          className={`text-[11px] line-through font-semibold ${
                            isSelected ? 'text-white/60' : 'text-slate-400'
                          }`}
                        >
                          {formatearMonto(subtotal)}
                        </span>
                        <span
                          className={`text-sm font-black font-outfit ${
                            isSelected ? 'text-fitzone-coral' : 'text-[#1B2A55]'
                          }`}
                        >
                          {formatearMonto(finalPrice)}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`text-sm font-black font-outfit ${
                          isSelected ? 'text-fitzone-coral' : 'text-[#1B2A55]'
                        }`}
                      >
                        {formatearMonto(finalPrice)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-400">
                    —
                  </span>
                )}

                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : badgeVariant === 'green-soft'
                      ? 'text-[#2E9E5B] bg-[#EAF7EE]'
                      : badgeVariant === 'amber-soft'
                      ? 'text-[#B7791F] bg-[#FEF7E6]'
                      : badgeVariant === 'red-soft'
                      ? 'text-[#E5484D] bg-[#FDECEE]'
                      : 'text-slate-400 bg-slate-100'
                  }`}
                >
                  {badgeText}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Leyenda Explicativa */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E9E5B]" />
            <span>Libre / Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-fitzone-coral" />
            <span className="font-semibold text-fitzone-navy">
              Franja pico: 19 a 21 hs (+20%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F0B429]" />
            <span>Mantenimiento</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          Turnos calculados en base a sesiones estándar de 60 minutos.
        </div>
      </div>
    </div>
  );
}
