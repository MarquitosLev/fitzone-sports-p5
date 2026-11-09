import { describe, it, expect } from 'vitest';
import { calcularVencimientoTrasPago, sumarMeses } from '../utils/membresias';
import type { MembresiaDTO } from '../types';

const plan = { idPlan: 1, nombre: 'Plan Mensual', precioBase: 15000, duracionMeses: 1 };
const hoy = new Date(2026, 10, 6);

function membresia(estado: MembresiaDTO['estado'], fechaVencimiento: string, duracionMeses = 1) {
  return { estado, fechaVencimiento, plan: { ...plan, duracionMeses } };
}

describe('sumarMeses (como LocalDate.plusMonths)', () => {
  it('suma meses dentro del año y cruzando el año', () => {
    expect(sumarMeses('2026-11-06', 1)).toBe('2026-12-06');
    expect(sumarMeses('2026-11-06', 3)).toBe('2027-02-06');
  });

  it('si el día no existe en el mes destino, queda el último día', () => {
    expect(sumarMeses('2027-01-31', 1)).toBe('2027-02-28');
    expect(sumarMeses('2028-01-31', 1)).toBe('2028-02-29');
  });
});

describe('calcularVencimientoTrasPago (SCRUM-122)', () => {
  it('vencida: la vigencia nueva arranca hoy (22/10 → 06/12)', () => {
    expect(calcularVencimientoTrasPago(membresia('VENCIDO', '2026-10-22'), true, hoy)).toBe('2026-12-06');
  });

  it('suspendida: también arranca hoy', () => {
    expect(calcularVencimientoTrasPago(membresia('SUSPENDIDO', '2026-12-20', 3), false, hoy)).toBe('2027-02-06');
  });

  it('activa con pagos previos: suma la duración al vencimiento actual', () => {
    expect(calcularVencimientoTrasPago(membresia('ACTIVO', '2026-11-30', 3), true, hoy)).toBe('2027-02-28');
  });

  it('activa sin pagos previos: el primer pago no renueva y la fecha no cambia', () => {
    expect(calcularVencimientoTrasPago(membresia('ACTIVO', '2026-11-30'), false, hoy)).toBe('2026-11-30');
  });

  it('cancelada o plan sin duración: no se puede calcular', () => {
    expect(calcularVencimientoTrasPago(membresia('CANCELADO', '2026-10-22'), true, hoy)).toBeNull();
    expect(calcularVencimientoTrasPago(membresia('VENCIDO', '2026-10-22', 0), true, hoy)).toBeNull();
  });
});
