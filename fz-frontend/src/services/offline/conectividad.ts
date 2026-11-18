/**
 * conectividad.ts — Circuit breaker del terminal de sede contra el servidor central (RNF-01).
 *
 * Solo una falla de transporte (el servidor no responde) pasa el terminal a modo sin conexión.
 * Un rechazo de negocio (409, 422) es una respuesta válida del servidor: si también activara
 * el modo offline, cualquier regla se podría saltear cortando la red.
 *
 * Después de una falla, el circuito queda abierto 30 s: las lecturas van directo a los datos
 * locales sin esperar otro timeout. Un ping exitoso, o cualquier respuesta del servidor, lo cierra.
 */
import { AppError, httpClient } from '../httpClient';

export const CIRCUITO_ABIERTO_MS = 30_000;
export const TIMEOUT_MS = 4_000;

let abiertoHasta = 0;
let sinConexion = false;
const oyentes = new Set<(sinConexion: boolean) => void>();

function notificar(): void {
  oyentes.forEach((oyente) => oyente(sinConexion));
}

/** true si el error indica que el servidor no respondió (y no un rechazo de negocio). */
export function esFallaDeTransporte(err: unknown): boolean {
  if (err instanceof TypeError) return true; // fetch sin respuesta: servidor caído o sin red
  if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) return true;
  return err instanceof AppError && [502, 503, 504].includes(err.status);
}

/** Señal de corte para que una petición no quede colgada si el servidor no contesta. */
export function senalConTimeout(): AbortSignal | undefined {
  return typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(TIMEOUT_MS) : undefined;
}

/** true mientras el circuito está abierto: conviene no intentar el servidor. */
export function circuitoAbierto(): boolean {
  return Date.now() < abiertoHasta;
}

export function estaSinConexion(): boolean {
  return sinConexion;
}

export function marcarSinConexion(): void {
  abiertoHasta = Date.now() + CIRCUITO_ABIERTO_MS;
  if (!sinConexion) {
    sinConexion = true;
    notificar();
  }
}

export function marcarConectado(): void {
  abiertoHasta = 0;
  if (sinConexion) {
    sinConexion = false;
    notificar();
  }
}

/** Avisa los cambios de estado (para el banner de la pantalla). Devuelve la función para desuscribirse. */
export function suscribirConectividad(oyente: (sinConexion: boolean) => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/** Prueba si el servidor volvió con GET /api/ping, que es público. */
export async function probarConexion(): Promise<boolean> {
  try {
    await httpClient.get('/ping', { silent: true, signal: senalConTimeout() });
    marcarConectado();
    return true;
  } catch (err: unknown) {
    if (esFallaDeTransporte(err)) {
      marcarSinConexion();
      return false;
    }
    // Respondió, aunque sea con error: el servidor está arriba
    marcarConectado();
    return true;
  }
}

/** Solo para pruebas. */
export function reiniciarConectividad(): void {
  abiertoHasta = 0;
  sinConexion = false;
  oyentes.clear();
}
