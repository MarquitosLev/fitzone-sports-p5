import { Clock, Trash2, CalendarDays } from 'lucide-react';
import type { ClaseGrupalDTO } from '../../types';
import { CupoIndicator } from './CupoIndicator';
import { parseLocalDateTime } from '../../utils/formatters';

interface AgendaSemanalProps {
  clases: ClaseGrupalDTO[];
  onEdit?: (clase: ClaseGrupalDTO) => void;
  onDelete?: (clase: ClaseGrupalDTO) => void;
}

// Helper to get day name (Monday...Sunday) from ISO date string in local timezone
const getDayName = (iso: string) => {
  const date = parseLocalDateTime(iso);
  return date.toLocaleDateString('es-AR', { weekday: 'long' });
};

export function AgendaSemanal({ clases, onEdit, onDelete }: AgendaSemanalProps) {
  // Group classes by day of week
  const days: Record<string, ClaseGrupalDTO[]> = {};
  clases.forEach((c) => {
    const day = getDayName(c.fechaHoraInicio);
    if (!days[day]) days[day] = [];
    days[day].push(c);
  });

  const dayOrder = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  // Detect current day in lowercase to give it a subtle highlight
  const todayName = new Date().toLocaleDateString('es-AR', { weekday: 'long' });

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5"
      data-testid="agenda-semanal"
    >
      {dayOrder.map((day) => {
        const isToday = day.toLowerCase() === todayName.toLowerCase();
        const dayClases = days[day] || [];

        return (
          <div
            key={day}
            className={`
              flex flex-col rounded-2xl bg-white border transition-all duration-200
              ${isToday ? 'border-[#1B2A55] shadow-md ring-1 ring-[#1B2A55]/10' : 'border-slate-200/80 shadow-xs hover:border-slate-300'}
              min-h-[380px] overflow-hidden
            `}
            data-testid={`agenda-columna-${day}`}
          >
            {/* Column Header */}
            <div
              className={`
                px-3.5 py-3 border-b flex items-center justify-between
                ${isToday ? 'bg-[#1B2A55] text-white' : 'bg-slate-50/80 text-slate-700 border-slate-100'}
              `}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="font-bold text-xs uppercase tracking-wider truncate font-outfit"
                  data-testid={`agenda-titulo-${day}`}
                >
                  {day}
                </span>
              </div>
              <span
                className={`
                  text-[11px] font-semibold px-2 py-0.5 rounded-full
                  ${isToday ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'}
                `}
              >
                {dayClases.length}
              </span>
            </div>

            {/* Column Body / Classes */}
            <div className="p-2.5 flex-1 flex flex-col gap-2.5 overflow-y-auto">
              {dayClases.length > 0 ? (
                dayClases.map((c) => (
                  <div
                    key={c.idClase}
                    className="group relative bg-white border border-slate-200/90 hover:border-[#1B2A55] rounded-xl p-3 shadow-xs hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between"
                    onClick={() => onEdit?.(c)}
                    data-testid={`clase-card-${c.idClase}`}
                  >
                    <div>
                      {/* Class Title and Action */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <h4
                          className="font-bold text-sm text-[#1B2A55] font-outfit tracking-tight leading-snug group-hover:text-[#F26D6D] transition-colors"
                          data-testid={`clase-nombre-${c.idClase}`}
                        >
                          {c.nombreActividad}
                        </h4>
                        {onDelete && (
                          <button
                            type="button"
                            title="Eliminar clase"
                            className="text-slate-300 hover:text-[#E5484D] p-1 -mr-1 -mt-1 rounded-lg hover:bg-red-50 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(c);
                            }}
                            data-testid={`btn-eliminar-clase-${c.idClase}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Time and Duration Badge */}
                      <div
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5"
                        data-testid={`clase-horario-${c.idClase}`}
                      >
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(c.fechaHoraInicio).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{c.duracionMinutos} min</span>
                      </div>
                    </div>

                    {/* Occupancy Indicator */}
                    <CupoIndicator
                      cupoDisponible={c.cupoDisponible}
                      cupoMaximo={c.cupoMaximo}
                    />
                  </div>
                ))
              ) : (
                <div
                  className="flex-1 flex flex-col items-center justify-center p-4 text-center rounded-xl border border-dashed border-slate-200/60 text-slate-400"
                  data-testid={`sin-clases-${day}`}
                >
                  <CalendarDays className="w-5 h-5 mb-1.5 text-slate-300 stroke-[1.5]" />
                  <span className="text-xs font-medium text-slate-400">Sin clases</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
