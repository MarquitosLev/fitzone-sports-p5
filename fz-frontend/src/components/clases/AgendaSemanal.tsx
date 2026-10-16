import type { ClaseGrupalDTO } from '../../types';
import { Card } from '../ui/Card';
import { CupoIndicator } from './CupoIndicator';

interface AgendaSemanalProps {
  clases: ClaseGrupalDTO[];
  onEdit?: (clase: ClaseGrupalDTO) => void;
  onDelete?: (clase: ClaseGrupalDTO) => void;
}

// Helper to get day name (Monday...Sunday) from ISO date string
const getDayName = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString('es-ES', { weekday: 'long' });
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      {dayOrder.map((day) => (
        <Card key={day} className="bg-fitzone-navy text-fitzone-coral p-2">
          <h2 className="text-center font-bold capitalize mb-2" style={{ color: 'var(--fitzone-coral)' }}>{day}</h2>
          {days[day] && days[day].length > 0 ? (
            days[day].map((c) => (
              <div
                key={c.idClase}
                className="border border-fitzone-coral rounded p-2 mb-2 cursor-pointer hover:bg-fitzone-green/10"
                onClick={() => onEdit?.(c)}
              >
                <div className="font-medium" style={{ color: 'var(--fitzone-coral)' }}>{c.nombreActividad}</div>
                <div className="text-xs" style={{ color: 'var(--fitzone-coral)' }}>{new Date(c.fechaHoraInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {c.duracionMinutos} min</div>
                <CupoIndicator cupoDisponible={c.cupoDisponible} cupoMaximo={c.cupoMaximo} />
                {onDelete && (
                  <button
                    className="mt-1 text-xs text-fitzone-red hover:underline"
                    onClick={(e) => { e.stopPropagation(); onDelete(c); }}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs italic" style={{ color: 'var(--fitzone-coral)' }}>Sin clases</div>
          )}
        </Card>
      ))}
    </div>
  );
}
