/**
 * canchasService.api.test.ts — Contrato con la API real de canchas (SCRUM-103).
 * Fuerza USE_MOCK=false y verifica rutas, cuerpos y mapeos contra el backend de SCRUM-98.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => ({ USE_MOCK: false }));

const get = vi.fn();
const post = vi.fn();
vi.mock('../httpClient', async (importOriginal) => {
  const original = await importOriginal<typeof import('../httpClient')>();
  return { ...original, httpClient: { get, post, put: vi.fn(), patch: vi.fn(), delete: vi.fn() } };
});

const {
  cotizarTurno,
  obtenerDisponibilidad,
  crearReserva,
  listarMisReservas,
  cancelarReserva,
  mapearCotizacion,
  CANCELACION_DISPONIBLE,
} = await import('../canchasService');

describe('canchasService con la API real', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('cotiza por rango de fechas sin enviar identidad ni esSocio', async () => {
    get.mockResolvedValue({ precioBase: 20000, descuento: 3000, recargo: 0, precioFinal: 17000 });

    const coti = await cotizarTurno(1, '10:00', false, '2026-12-01', '11:00');

    expect(get).toHaveBeenCalledWith(
      '/v1/canchas/1/cotizacion?inicio=2026-12-01T10%3A00%3A00&fin=2026-12-01T11%3A00%3A00'
    );
    expect(get.mock.calls[0][0]).not.toContain('esSocio');
    expect(get.mock.calls[0][0]).not.toContain('idUsuario');
    // El descuento lo decide el servidor: se refleja aunque el front no sepa que es socio
    expect(coti.total).toBe(17000);
    expect(coti.esSocio).toBe(true);
    expect(coti.descuentoSocio).toBe(3000);
  });

  it('sin fecha u hora de fin no llama a la API', async () => {
    await expect(cotizarTurno(1, '10:00', false)).rejects.toThrow();
    expect(get).not.toHaveBeenCalled();
  });

  it('mapea el recargo pico del backend con su porcentaje', () => {
    const coti = mapearCotizacion({ precioBase: 20000, descuento: 0, recargo: 4000, precioFinal: 24000 }, false);

    expect(coti.esPico).toBe(true);
    expect(coti.porcentajeRecargoPico).toBe(20);
    expect(coti.esSocio).toBe(false);
    expect(coti.total).toBe(24000);
  });

  it('calcula el porcentaje de descuento de socio sobre la tarifa base aunque haya recargo pico', () => {
    const coti = mapearCotizacion({ precioBase: 20000, descuento: 3000, recargo: 4000, precioFinal: 21000 }, true);

    expect(coti.porcentajeDescuentoSocio).toBe(15);
    expect(coti.descuentoSocio).toBe(3000);
    expect(coti.total).toBe(21000);
  });

  it('convierte la grilla del backend (LocalDateTime) en franjas de la pantalla', async () => {
    get.mockResolvedValue([
      { horaInicio: '2026-12-01T19:00:00', horaFin: '2026-12-01T20:00:00', estado: 'OCUPADO' },
      { horaInicio: '2026-12-01T08:00:00', horaFin: '2026-12-01T09:00:00', estado: 'LIBRE' },
    ]);

    const franjas = await obtenerDisponibilidad(3, '2026-12-01');

    expect(get).toHaveBeenCalledWith('/v1/canchas/3/disponibilidad?fecha=2026-12-01');
    expect(franjas[0]).toMatchObject({
      id: '19:00-20:00',
      horaInicio: '19:00',
      horaFin: '20:00',
      esPico: true,
      estado: 'OCUPADO',
    });
    expect(franjas[1].esPico).toBe(false);
  });

  it('reserva con POST /v1/canchas/{id}/reservas enviando solo el horario', async () => {
    post.mockResolvedValue({ idReservaCancha: 7 });

    await crearReserva({
      idCancha: 2,
      fecha: '2026-12-01',
      horaInicio: '10:00',
      horaFin: '11:00',
      idUsuario: 99,
      esSocio: true,
    });

    expect(post).toHaveBeenCalledTimes(1);
    const [ruta, opciones] = post.mock.calls[0];
    expect(ruta).toBe('/v1/canchas/2/reservas');
    expect(JSON.parse(opciones.body)).toEqual({
      fechaHoraInicio: '2026-12-01T10:00:00',
      fechaHoraFin: '2026-12-01T11:00:00',
    });
  });

  it('lista las reservas propias desde /usuarios/me', async () => {
    get.mockResolvedValue([]);

    await listarMisReservas();

    expect(get).toHaveBeenCalledWith('/v1/usuarios/me/reservas-cancha');
  });

  it('no ofrece la cancelación porque el backend no la expone', async () => {
    expect(CANCELACION_DISPONIBLE).toBe(false);
    await expect(cancelarReserva(1)).rejects.toThrow('no está disponible');
  });
});
