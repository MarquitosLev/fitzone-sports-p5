/**
 * colaIngresos.ts — Cola de ingresos aprobados sin conexión (patrón Outbox, RNF-01).
 *
 * Un ingreso aprobado offline es provisorio hasta que el servidor lo confirma. Se guarda en
 * localStorage para sobrevivir a una recarga y se manda en lotes de hasta 50 al reconectar.
 * Los confirmados se quitan; los rechazados quedan con su error para que el recepcionista los
 * vea y los descarte: ningún conflicto se resuelve solo.
 */
import { httpClient } from '../httpClient';
import type { IngresoEnCola, ResultadoSincronizacionDTO } from '../../types';

const CLAVE_COLA = 'fitzone.acceso.cola';
const MAX_LOTE = 50;

export const ENDPOINT_SINCRONIZACION = '/v1/accesos/sincronizacion';

export function cargarCola(): IngresoEnCola[] {
  try {
    const crudo = localStorage.getItem(CLAVE_COLA);
    const items: unknown = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(items) ? (items as IngresoEnCola[]) : [];
  } catch {
    return [];
  }
}

function guardarCola(items: IngresoEnCola[]): IngresoEnCola[] {
  try {
    localStorage.setItem(CLAVE_COLA, JSON.stringify(items));
  } catch {
    // Si no hay storage, la cola vive solo en memoria de esta llamada
  }
  return items;
}

export function pendientes(): IngresoEnCola[] {
  return cargarCola().filter((i) => i.estado === 'pendiente');
}

export function encolar(item: Omit<IngresoEnCola, 'estado' | 'codigo' | 'mensaje'>): IngresoEnCola[] {
  const sinRepetir = cargarCola().filter((i) => i.tokenQr !== item.tokenQr);
  return guardarCola([...sinRepetir, { ...item, estado: 'pendiente' }]);
}

/** Quita los confirmados (incluido DUPLICADO), marca los rechazados y deja el resto como estaba. */
export function aplicarResultados(resultados: ResultadoSincronizacionDTO[]): IngresoEnCola[] {
  const porToken = new Map(resultados.map((r) => [r.tokenQr, r]));
  const siguiente = cargarCola().flatMap((item): IngresoEnCola[] => {
    const r = porToken.get(item.tokenQr);
    if (!r) return [item];
    if (r.ok) return [];
    return [{ ...item, estado: 'error', codigo: r.codigo ?? 'ERROR', mensaje: r.mensaje ?? undefined }];
  });
  return guardarCola(siguiente);
}

export function descartar(tokenQr: string): IngresoEnCola[] {
  return guardarCola(cargarCola().filter((i) => i.tokenQr !== tokenQr));
}

export interface ResumenSincronizacion {
  confirmados: number;
  conError: number;
  restantes: number;
}

/**
 * Manda los pendientes al servidor (un lote de hasta 50) y aplica los resultados.
 * Si el servidor no responde, el error se propaga y la cola queda intacta.
 */
export async function sincronizarCola(): Promise<ResumenSincronizacion> {
  const lote = pendientes().slice(0, MAX_LOTE);
  if (lote.length === 0) {
    return { confirmados: 0, conError: 0, restantes: 0 };
  }

  const { resultados } = await httpClient.post<{ resultados: ResultadoSincronizacionDTO[] }>(
    ENDPOINT_SINCRONIZACION,
    {
      silent: true,
      body: JSON.stringify({
        eventos: lote.map(({ tokenQr, idSede, ocurrioEn }) => ({ tokenQr, idSede, ocurrioEn })),
      }),
    }
  );

  aplicarResultados(resultados);
  return {
    confirmados: resultados.filter((r) => r.ok).length,
    conError: resultados.filter((r) => !r.ok).length,
    restantes: pendientes().length,
  };
}
