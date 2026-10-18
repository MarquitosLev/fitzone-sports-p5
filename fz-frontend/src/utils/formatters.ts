/**
 * formatters.ts — Utilidades de formateo centralizadas.
 *
 * Por qué centralizar: evitar que cada componente formatee fechas y montos
 * de forma distinta. Si mañana hay que cambiar el formato, se cambia acá solo.
 */

/**
 * Formatea una fecha ISO (string) a formato legible en español (Argentina).
 * Ejemplo: "2026-10-15T14:30:00" → "15/10/2026, 14:30"
 * @param isoString - Fecha como string ISO (viene del backend como LocalDateTime de Java)
 */
export function formatearFechaHora(isoString: string): string {
  if (!isoString) return '—';
  try {
    // Como el backend devuelve LocalDateTime sin zona horaria,
    // tratamos el string como hora local agregando la 'Z' al final
    // para evitar que el navegador lo interprete de forma incorrecta.
    const date = new Date(isoString.includes('Z') ? isoString : isoString + 'Z');
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formatea una fecha ISO sin hora (LocalDate de Java).
 * Ejemplo: "2026-10-15" → "15/10/2026"
 */
export function formatearFecha(isoString: string): string {
  if (!isoString) return '—';
  try {
    const [year, month, day] = isoString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Formatea un número como monto en pesos argentinos.
 * Ejemplo: 8000 → "$8.000"
 */
export function formatearMonto(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto);
}

/**
 * Extrae solo la hora de un string ISO (LocalDateTime del backend).
 * Ejemplo: "2026-10-17T18:00:00" → "18:00"
 */
export function formatearHora(isoString: string): string {
  if (!isoString) return '—';
  try {
    // Extraemos hora y minutos del string directamente para evitar
    // conversiones de zona horaria (el backend devuelve hora local sin 'Z')
    const timePart = isoString.split('T')[1];
    if (!timePart) return '—';
    const [hh, mm] = timePart.split(':');
    return `${hh}:${mm}`;
  } catch {
    return isoString;
  }
}
