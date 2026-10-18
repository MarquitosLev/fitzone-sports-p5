/**
 * SelectorFecha.tsx — Selector y navegación por día (RF-10).
 *
 * Características:
 * - Navegación día anterior y siguiente con controles de fecha mínima.
 * - Accesos directos rápidos (Hoy, Mañana, Días de la semana).
 * - Selector de fecha nativo (input type="date") con restricción mínima.
 * - Formato legible del día seleccionado en español.
 * - Reutilizable en grillas de canchas, clases y agendas.
 */

import { useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui';

export interface SelectorFechaProps {
  /** Fecha seleccionada en formato ISO YYYY-MM-DD */
  fechaSeleccionada: string;
  /** Callback al cambiar de fecha */
  onFechaChange: (nuevaFecha: string) => void;
  /** Fecha mínima permitida en formato YYYY-MM-DD (por defecto, hoy) */
  fechaMinima?: string;
  /** Cantidad de accesos rápidos por día a mostrar (por defecto 5) */
  cantidadDiasRapidos?: number;
  className?: string;
}

export function SelectorFecha({
  fechaSeleccionada,
  onFechaChange,
  fechaMinima,
  cantidadDiasRapidos = 5,
  className = '',
}: SelectorFechaProps) {
  // Helper para obtener fecha ISO actual local
  const hoyIso = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const minDate = fechaMinima ?? hoyIso;

  const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNamesShort = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  const fullDayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const fullMonthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];

  // Genera lista de accesos directos rápidos a partir de hoy
  const quickDays = useMemo(() => {
    return Array.from({ length: cantidadDiasRapidos }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + idx);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label =
        idx === 0
          ? 'Hoy'
          : idx === 1
          ? 'Mañana'
          : `${dayNamesShort[d.getDay()]} ${d.getDate()} ${monthNamesShort[d.getMonth()]}`;
      return { iso, label };
    });
  }, [cantidadDiasRapidos]);

  // Formato completo en español del día seleccionado
  const textoFechaCompleta = useMemo(() => {
    try {
      const [year, month, day] = fechaSeleccionada.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return `${fullDayNames[d.getDay()]} ${day} de ${fullMonthNames[d.getMonth()]} de ${year}`;
    } catch {
      return fechaSeleccionada;
    }
  }, [fechaSeleccionada]);

  // Helper para sumar o restar días
  const cambiarDia = (offset: number) => {
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + offset);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (iso >= minDate) {
      onFechaChange(iso);
    }
  };

  const puedeRetroceder = fechaSeleccionada > minDate;

  return (
    <div
      className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      {/* Información del Día Seleccionado con Navegación de Flechas */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-fitzone-coral/10 text-fitzone-coral flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-fitzone-navy uppercase tracking-wider block">
              Día del turno
            </span>
          </div>
          <p className="text-sm font-extrabold text-[#1B2A55] font-outfit capitalize">
            {textoFechaCompleta}
          </p>
        </div>
      </div>

      {/* Controles de Navegación y Accesos Rápidos */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Botón día anterior */}
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={!puedeRetroceder}
          onClick={() => cambiarDia(-1)}
          aria-label="Día anterior"
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Quick Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {quickDays.map((d) => {
            const isSelected = fechaSeleccionada === d.iso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => onFechaChange(d.iso)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-fitzone-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Botón día siguiente */}
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => cambiarDia(1)}
          aria-label="Día siguiente"
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Selector de Fecha Nativo */}
        <input
          type="date"
          aria-label="Seleccionar fecha"
          min={minDate}
          value={fechaSeleccionada}
          onChange={(e) => {
            const val = e.target.value;
            if (val && val >= minDate) {
              onFechaChange(val);
            }
          }}
          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-fitzone-navy font-semibold focus:outline-none focus:ring-2 focus:ring-fitzone-navy/20 cursor-pointer"
        />
      </div>
    </div>
  );
}
