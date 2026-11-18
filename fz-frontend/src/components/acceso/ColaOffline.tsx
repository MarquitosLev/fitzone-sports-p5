import { CloudOff, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, Button, Card } from '../ui';
import type { IngresoEnCola } from '../../types';
import { formatearHora, toLocalISOString } from '../../utils/formatters';

export interface ColaOfflineProps {
  sinConexion: boolean;
  cola: IngresoEnCola[];
  sincronizando: boolean;
  onSincronizar: () => void;
  onDescartar: (tokenQr: string) => void;
}

/**
 * Estado del terminal sin conexión (RNF-01): aviso de modo offline y la cola de ingresos que
 * esperan confirmación del servidor, con el resultado de cada uno al sincronizar.
 */
export function ColaOffline({ sinConexion, cola, sincronizando, onSincronizar, onDescartar }: ColaOfflineProps) {
  const pendientes = cola.filter((i) => i.estado === 'pendiente').length;
  if (!sinConexion && cola.length === 0) return null;

  return (
    <div className="space-y-4" data-testid="cola-offline">
      {sinConexion && (
        <Alert
          type="warning"
          title="Sin conexión con el servidor central"
          message={`Los ingresos se validan con la lista local y se confirman al volver la conexión.${
            pendientes > 0 ? ` ${pendientes} pendiente${pendientes === 1 ? '' : 's'} de sincronizar.` : ''
          }`}
        />
      )}

      {cola.length > 0 && (
        <Card className="p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CloudOff className="w-4 h-4 text-fitzone-coral" />
              <h3 className="text-sm font-black text-fitzone-navy">Ingresos sin confirmar ({cola.length})</h3>
            </div>
            <Button
              variant="secondary"
              size="xs"
              leftIcon={RefreshCw}
              onClick={onSincronizar}
              loading={sincronizando}
              disabled={pendientes === 0}
            >
              Sincronizar
            </Button>
          </div>

          <ul className="divide-y divide-slate-100 text-xs">
            {cola.map((item) => (
              <li key={item.tokenQr} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="font-bold text-fitzone-navy truncate">{item.socio ?? 'Socio'}</p>
                  <p className="text-slate-500">
                    {formatearHora(toLocalISOString(new Date(item.ocurrioEn)))} ·{' '}
                    {item.estado === 'pendiente' ? (
                      <span className="text-amber-700 font-semibold">Pendiente</span>
                    ) : (
                      <span className="text-fitzone-red font-semibold">
                        Rechazado al sincronizar: {item.codigo}
                        {item.mensaje ? ` — ${item.mensaje}` : ''}
                      </span>
                    )}
                  </p>
                </div>
                {item.estado === 'error' && (
                  <Button
                    variant="ghost"
                    size="xs"
                    leftIcon={Trash2}
                    onClick={() => onDescartar(item.tokenQr)}
                    aria-label={`Descartar ingreso de ${item.socio ?? 'socio'}`}
                  >
                    Descartar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
