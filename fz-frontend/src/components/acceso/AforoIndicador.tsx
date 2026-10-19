import { useEffect } from 'react';
import { Users, AlertTriangle, RefreshCw } from 'lucide-react';
import type { AforoSedeDTO } from '../../types';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

export interface AforoIndicadorProps {
  aforo: AforoSedeDTO | null;
  loading?: boolean;
  onRefresh?: () => void;
  pollingIntervalMs?: number;
  nombreSede?: string;
  className?: string;
}

/**
 * Indicador visual de Aforo y Ocupación en tiempo real (RF-05).
 * Desacoplado: recibe los datos y callbacks por props.
 * El polling se gestiona automáticamente mediante un intervalo configurable (por defecto 10 s).
 */
export function AforoIndicador({
  aforo,
  loading = false,
  onRefresh,
  pollingIntervalMs = 10000,
  nombreSede,
  className = '',
}: AforoIndicadorProps) {
  // Polling automático cada pollingIntervalMs si se pasa onRefresh
  useEffect(() => {
    if (!onRefresh || pollingIntervalMs <= 0) return;

    const intervalId = setInterval(() => {
      onRefresh();
    }, pollingIntervalMs);

    return () => clearInterval(intervalId);
  }, [onRefresh, pollingIntervalMs]);

  const actual = aforo?.aforoActual ?? 0;
  const maximo = aforo?.aforoMaximo ?? 1;
  const porcentaje = aforo?.porcentaje ?? (maximo > 0 ? Math.round((actual / maximo) * 100) : 0);
  const lugaresDisponibles = Math.max(0, maximo - actual);

  // Umbrales de color: verde (<70%), ámbar/gold (70% - 84%), rojo/coral (>=85%)
  const isHighAlert = porcentaje >= 85;
  const isMediumAlert = porcentaje >= 70 && porcentaje < 85;

  let colorBarra = 'bg-fitzone-green';
  let colorBadgeVariant: 'green' | 'gold' | 'red' = 'green';
  let badgeText = 'OCUPACIÓN NORMAL';

  if (isHighAlert) {
    colorBarra = 'bg-fitzone-red';
    colorBadgeVariant = 'red';
    badgeText = 'ALERTA DE CAPACIDAD';
  } else if (isMediumAlert) {
    colorBarra = 'bg-fitzone-gold';
    colorBadgeVariant = 'gold';
    badgeText = 'OCUPACIÓN ELEVADA';
  }

  return (
    <div
      data-testid="aforo-indicador-card"
      className={`bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-5 transition-all ${className}`}
    >
      {/* Encabezado del indicador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-fitzone-navy/5 flex items-center justify-center text-fitzone-navy shrink-0">
            <Users className="w-5 h-5 text-fitzone-navy" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              AFORO EN TIEMPO REAL
            </span>
            <h3 className="text-base font-black text-fitzone-navy font-outfit">
              {nombreSede || 'Ocupación de la Sede'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <Spinner size="sm" />}
          <Badge variant={colorBadgeVariant}>{badgeText}</Badge>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Actualizar aforo manualmente"
              className="p-1.5 rounded-lg text-slate-400 hover:text-fitzone-navy hover:bg-slate-100 transition-colors"
              title="Actualizar ahora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Métricas numéricas */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 pt-1">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="aforo-indicador-porcentaje"
              className="text-4xl sm:text-5xl font-black text-fitzone-navy font-outfit"
            >
              {porcentaje}%
            </span>
            <span
              data-testid="aforo-indicador-conteo"
              className="text-sm sm:text-base font-extrabold text-slate-500"
            >
              {actual} <span className="text-xs text-slate-400 font-normal">/ {maximo} personas</span>
            </span>
          </div>
          <span className="text-xs text-slate-400">Capacidad autorizada en sede</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
            Disponibilidad
          </span>
          <span
            data-testid="aforo-indicador-disponibles"
            className={`text-2xl font-black font-outfit ${isHighAlert ? 'text-fitzone-red' : 'text-fitzone-green'}`}
          >
            {lugaresDisponibles} {lugaresDisponibles === 1 ? 'lugar' : 'lugares'}
          </span>
        </div>
      </div>

      {/* Barra de progreso visual con umbral dinámico */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            data-testid="aforo-indicador-barra"
            data-color={isHighAlert ? 'red' : isMediumAlert ? 'amber' : 'green'}
            className={`h-full rounded-full transition-all duration-500 ${colorBarra}`}
            style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-0.5">
          <span>0 (Libre)</span>
          <span>50%</span>
          <span>{maximo} (Máximo)</span>
        </div>
      </div>

      {/* Alerta si supera el 85% de aforo */}
      {isHighAlert && (
        <div
          data-testid="aforo-indicador-alerta"
          className="p-3.5 rounded-2xl bg-red-50 border border-fitzone-red/20 flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-fitzone-red shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-extrabold text-fitzone-red">Capacidad crítica de la sede</h4>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              Quedan únicamente {lugaresDisponibles} vacantes. Controlá el ingreso antes de autorizar nuevos accesos (RF-05).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
