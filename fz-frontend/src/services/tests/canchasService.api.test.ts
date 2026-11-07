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
  reservarComoInvitado,
  obtenerReservaInvitado,
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

  describe('checkout de invitado', () => {
    const reservaApi = {
      codigoReserva: 'abc',
      idReservaCancha: 5,
      idCancha: 1,
      cancha: 'Pádel 1',
      tipoCancha: 'PADEL',
      idSede: 1,
      sede: 'Palermo',
      fechaHoraInicio: '2026-12-10T19:00:00',
      fechaHoraFin: '2026-12-10T20:00:00',
      precioFinal: '12000.00',
      cotizacion: { precioBase: 10000, descuento: 0, recargo: 2000, precioFinal: 12000 },
      pagada: false,
    };

    it('reservarComoInvitado envía el turno y los datos a /v1/invitados/reservas', async () => {
      post.mockResolvedValue(reservaApi);
      const datos = { nombre: 'Ana', apellido: 'Pérez', dni: '30111222', email: 'ana@mail.com', telefono: '1155550000' };

      const r = await reservarComoInvitado({ idCancha: 1, fecha: '2026-12-10', horaInicio: '19:00', horaFin: '20:00' }, datos);

      expect(post).toHaveBeenCalledWith('/v1/invitados/reservas', {
        body: JSON.stringify({
          idCancha: 1,
          fechaHoraInicio: '2026-12-10T19:00:00',
          fechaHoraFin: '2026-12-10T20:00:00',
          ...datos,
        }),
      });
      expect(r.codigoReserva).toBe('abc');
      expect(r.precioFinal).toBe(12000);
      expect(r.cotizacion?.esPico).toBe(true);
      expect(r.cotizacion?.recargoPico).toBe(2000);
    });

    it('obtenerReservaInvitado deja la cotización en null si el backend no la manda', async () => {
      get.mockResolvedValue({ ...reservaApi, cotizacion: null, pagada: true });

      const r = await obtenerReservaInvitado('abc');

      expect(get).toHaveBeenCalledWith('/v1/invitados/reservas/abc');
      expect(r.cotizacion).toBeNull();
      expect(r.pagada).toBe(true);
    });
  });
});
