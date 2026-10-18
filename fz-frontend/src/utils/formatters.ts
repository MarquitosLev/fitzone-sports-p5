/**
 * formatters.ts — Utilidades de formateo centralizadas.
 *
 * Por qué centralizar: evitar que cada componente formatee fechas y montos
 * de forma distinta. Si mañana hay que cambiar el formato, se cambia acá solo.
 */

/**
 * Parsea un string ISO de LocalDateTime (sin zona horaria, ej. "2026-10-17T18:00:00")
 * a un objeto Date interpretándolo en la zona horaria local del navegador.
 *
 * Por qué: El backend devuelve LocalDateTime de Java sin 'Z'. Si pasamos ese string
 * a new Date(), algunos navegadores lo toman como UTC y otros como local, desfasando
 * la hora y rompiendo reglas de negocio (ej. ventanas de 48 hs o cortes de 2 hs).
 */
export function parseLocalDateTime(isoString: string): Date {
  if (!isoString) return new Date(NaN);

  // Si incluye zona explícita ('Z' o offset +/-HH:mm), dejamos que el Date nativo lo resuelva
  if (/[Z+-]\d{2}(:?\d{2})?$/.test(isoString) || isoString.endsWith('Z')) {
    return new Date(isoString);
  }

  // Desglosamos formato ISO local: "YYYY-MM-DDTHH:mm[:ss[.SSS]]"
  const [datePart, timePart] = isoString.split('T');
  if (!datePart) return new Date(isoString);

  const [year, month, day] = datePart.split('-').map(Number);
  if (!timePart) {
    return new Date(year, (month || 1) - 1, day || 1);
  }

  const [timeWithoutMs, msPart] = timePart.split('.');
  const [hours = 0, minutes = 0, seconds = 0] = timeWithoutMs.split(':').map(Number);
  const milliseconds = msPart ? Number(msPart.slice(0, 3).padEnd(3, '0')) : 0;

  // new Date(año, mesIndex, día, hora, min, seg, ms) siempre crea en la zona local
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
}

/**
 * Formatea una fecha ISO (string) a formato legible en español (Argentina).
 * Ejemplo: "2026-10-15T14:30:00" → "15/10/2026, 14:30"
 * @param isoString - Fecha como string ISO (LocalDateTime de Java)
 */
export function formatearFechaHora(isoString: string): string {
  if (!isoString) return '—';
  try {
    const date = parseLocalDateTime(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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
