import type { MembresiaDTO } from '../types';

function aFechaIso(fecha: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

/**
 * Suma meses a una fecha "YYYY-MM-DD" como LocalDate.plusMonths de Java: si el día no existe
 * en el mes destino, queda el último día de ese mes (2027-01-31 + 1 → 2027-02-28).
 */
export function sumarMeses(fechaIso: string, meses: number): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const destino = new Date(anio, mes - 1 + meses, 1);
  const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  destino.setDate(Math.min(dia, ultimoDia));
  return aFechaIso(destino);
}

/**
 * Hasta cuándo queda vigente la membresía si se paga ahora. Replica la regla de
 * PagoService.procesarPago y MembresiaService.renovar del backend:
 *  - ACTIVO sin pagos confirmados: el primer pago es el del alta y no renueva.
 *  - ACTIVO con pagos previos: suma la duración del plan al vencimiento actual.
 *  - VENCIDO o SUSPENDIDO: la vigencia nueva arranca hoy.
 *  - CANCELADO o plan sin duración: no se puede calcular.
 */
export function calcularVencimientoTrasPago(
  membresia: Pick<MembresiaDTO, 'estado' | 'fechaVencimiento' | 'plan'>,
  tienePagoConfirmado: boolean,
  hoy: Date = new Date()
): string | null {
  const meses = membresia.plan.duracionMeses;
  if (membresia.estado === 'CANCELADO' || !meses) return null;

  if (membresia.estado === 'ACTIVO') {
    return tienePagoConfirmado
      ? sumarMeses(membresia.fechaVencimiento, meses)
      : membresia.fechaVencimiento;
  }
  return sumarMeses(aFechaIso(hoy), meses);
}
