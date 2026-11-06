import { RefreshCw, Clock } from 'lucide-react';

export interface CuentaRegresivaProps {
  /** Cantidad de segundos restantes antes de la expiración */
  segundosRestantes: number;
  /** Duración total del ciclo en segundos (por defecto 60) */
  totalSegundos?: number;
  /** Mostrar u ocultar la barra de progreso */
  mostrarBarra?: boolean;
  /** Mostrar u ocultar el contador textual */
  mostrarTexto?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * CuentaRegresiva — Componente que visualiza el tiempo restante
 * antes del refresco del código QR de acceso (SCRUM-85).
 * Incluye barra de progreso animada y contador numérico por segundo.
 */
export function CuentaRegresiva({
  segundosRestantes,
  totalSegundos = 60,
  mostrarBarra = true,
  mostrarTexto = true,
  className = '',
}: CuentaRegresivaProps) {
  // Asegurar límites entre 0 y totalSegundos
  const segundosValidos = Math.max(0, Math.min(segundosRestantes, totalSegundos));
  const porcentaje = totalSegundos > 0 ? (segundosValidos / totalSegundos) * 100 : 0;

  // Semáforo de urgencia visual
  const esUrgente = segundosValidos < 10;
  const esAlerta = segundosValidos >= 10 && segundosValidos <= 20;

  const colorBarra = esUrgente
    ? 'bg-fitzone-coral'
    : esAlerta
    ? 'bg-amber-400'
    : 'bg-emerald-500';

  const colorTexto = esUrgente
    ? 'text-fitzone-coral font-black'
    : esAlerta
    ? 'text-amber-600 font-black'
    : 'text-fitzone-navy font-bold';

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`Tiempo restante: ${segundosValidos} segundos`}
      data-testid="cuenta-regresiva"
      className={`space-y-2 ${className}`}
    >
      {/* Indicador textual y de estado */}
      {mostrarTexto && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <RefreshCw
              className={`w-3.5 h-3.5 text-fitzone-coral ${segundosValidos > 0 ? 'animate-spin' : ''}`}
              style={{ animationDuration: '6s' }}
            />
            <span className="font-medium text-slate-600">Se actualiza en</span>
          </div>

          <div className="flex items-center gap-1">
            <span
              data-testid="segundos-restantes"
              className={`font-mono text-sm ${colorTexto} transition-colors duration-200`}
            >
              {segundosValidos}s
            </span>
            <span className="text-[11px] text-slate-400 font-medium">/ {totalSegundos}s</span>
          </div>
        </div>
      )}

      {/* Barra de progreso visual */}
      {mostrarBarra && (
        <div
          data-testid="contenedor-barra-progreso"
          className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70"
        >
          <div
            data-testid="barra-progreso"
            className={`h-full rounded-full transition-all duration-300 ease-linear ${colorBarra}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      )}

      {/* Leyenda de ciclo dinámico */}
      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
        <Clock className="w-3 h-3 text-slate-400" />
        <span>Ciclo de renovación de {totalSegundos} segundos</span>
      </div>
    </div>
  );
}
