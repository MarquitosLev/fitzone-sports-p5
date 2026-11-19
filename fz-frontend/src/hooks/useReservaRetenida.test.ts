import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  retenerReserva,
  leerReservaRetenida,
  liberarReservaRetenida,
  useSegundosRestantes,
  DURACION_RETENCION_MS,
} from './useReservaRetenida';

const turno = { idCancha: 1, fecha: '2026-12-10', horaInicio: '19:00', horaFin: '20:00' };

describe('useReservaRetenida', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-12-01T10:00:00'));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retiene el turno 5 minutos en localStorage y lo recupera mientras está vigente', () => {
    const retenida = retenerReserva(turno);

    expect(retenida.venceEn).toBe(Date.now() + DURACION_RETENCION_MS);
    expect(leerReservaRetenida()).toEqual(retenida);
  });

  it('al vencer, leer la retención la borra', () => {
    retenerReserva(turno);
    vi.setSystemTime(new Date('2026-12-01T10:05:01'));

    expect(leerReservaRetenida()).toBeNull();
    expect(localStorage.getItem('fz_reserva_invitado')).toBeNull();
  });

  it('liberar borra la retención', () => {
    retenerReserva(turno);
    liberarReservaRetenida();

    expect(leerReservaRetenida()).toBeNull();
  });

  it('la cuenta regresiva llama a onVencer una sola vez al llegar a cero', () => {
    const { venceEn } = retenerReserva(turno);
    const onVencer = vi.fn();
    const { result } = renderHook(() => useSegundosRestantes(venceEn, onVencer));

    expect(result.current).toBe(300);
    act(() => {
      vi.advanceTimersByTime(DURACION_RETENCION_MS + 2000);
    });

    expect(result.current).toBe(0);
    expect(onVencer).toHaveBeenCalledTimes(1);
  });
});
