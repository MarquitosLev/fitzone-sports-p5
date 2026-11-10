/**
 * pagosService.api.test.ts — Contrato con la API real de pagos (SCRUM-104).
 * Fuerza USE_MOCK=false y verifica rutas, cuerpos y mapeos contra el backend de SCRUM-99.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TransaccionApi } from '../pagosService';

vi.mock('../../config', () => ({ USE_MOCK: false }));

const get = vi.fn();
const post = vi.fn();
vi.mock('../httpClient', async (importOriginal) => {
  const original = await importOriginal<typeof import('../httpClient')>();
  return {
    ...original,
    getAuthToken: () => 'token-de-prueba',
    httpClient: { get, post, put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  };
});

const {
  procesarPago,
  reintentarPago,
  listarMisPagos,
  obtenerComprobantePorTransaccion,
  descargarComprobantePdf,
  mapearTransaccion,
  pagarReservaInvitado,
  descargarComprobanteInvitado,
} = await import('../pagosService');

const usuario = {
  idUsuario: 3,
  authId: 'uuid',
  dni: '00000003',
  nombre: 'Socio',
  apellido: 'Activo',
  email: 'socio@fitzone.com',
  telefono: null,
  fotoUrl: null,
  tipoUsuario: 'SOCIO' as const,
  idSede: null,
};
const sede = { idSede: 1, nombre: 'Sede Central', aforoMaximo: 150 };

function transaccionApi(estadoPago: 'CONFIRMADO' | 'RECHAZADO', extra: Partial<TransaccionApi> = {}): TransaccionApi {
  return {
    idTransaccion: 10,
    usuario,
    sede,
    membresia: null,
    reservaCancha: { idReservaCancha: 5, fechaHoraInicio: '2026-12-01T19:00:00', cancha: { nombre: 'Fútbol 5' } },
    concepto: 'RESERVA_CANCHA',
    monto: 24000,
    estadoPago,
    tokenTransaccionPasarela: 'tok',
    fechaHoraCreacion: '2026-11-06T10:00:00',
    fechaHoraConfirmacion: null,
    ...extra,
  } as TransaccionApi;
}

describe('pagosService con la API real', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('paga con POST /v1/pagos sin enviar usuario ni monto', async () => {
    post.mockResolvedValue(transaccionApi('CONFIRMADO'));
    get.mockResolvedValue({ idComprobante: 7, numeroFactura: 'FAC-1', transaccion: transaccionApi('CONFIRMADO') });

    const res = await procesarPago({
      idSede: 1,
      idUsuario: 99,
      concepto: 'RESERVA_SOCIO',
      monto: 1,
      tokenTransaccionPasarela: 'tok_mock_aprobado',
      idReservaCancha: 5,
    });

    const [ruta, opciones] = post.mock.calls[0];
    expect(ruta).toBe('/v1/pagos');
    const body = JSON.parse(opciones.body);
    expect(body).toEqual({ concepto: 'RESERVA_CANCHA', idSede: 1, idReservaCancha: 5 });
    expect(body).not.toHaveProperty('idUsuario');
    expect(body).not.toHaveProperty('monto');
    expect(res.aprobado).toBe(true);
    expect(res.transaccion.monto).toBe(24000);
    expect(get).toHaveBeenCalledWith('/v1/pagos/10/comprobante');
    expect(res.comprobante?.idComprobante).toBe(7);
  });

  it('no pide el rechazo a la pasarela y, si el backend rechaza, no busca comprobante', async () => {
    post.mockResolvedValue(transaccionApi('RECHAZADO'));

    const res = await procesarPago({
      idSede: 1,
      idUsuario: 3,
      concepto: 'MEMBRESIA_SOCIO',
      monto: 15000,
      tokenTransaccionPasarela: 'tok_mock_aprobado',
      idMembresia: 2,
    });

    expect(JSON.parse(post.mock.calls[0][1].body)).toEqual({ concepto: 'MEMBRESIA', idSede: 1, idMembresia: 2 });
    expect(res.aprobado).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it('reintenta con un pago nuevo sobre la misma reserva del pago rechazado (ADR-004)', async () => {
    get.mockResolvedValueOnce(transaccionApi('RECHAZADO'));
    post.mockResolvedValue(transaccionApi('RECHAZADO', { idTransaccion: 11 }));

    await reintentarPago(10);

    expect(get).toHaveBeenCalledWith('/v1/pagos/10');
    expect(JSON.parse(post.mock.calls[0][1].body)).toEqual({
      concepto: 'RESERVA_CANCHA',
      idSede: 1,
      idReservaCancha: 5,
    });
  });

  it('no reintenta un pago ya confirmado', async () => {
    get.mockResolvedValueOnce(transaccionApi('CONFIRMADO'));

    await expect(reintentarPago(10)).rejects.toThrow('ya se encuentra confirmada');
    expect(post).not.toHaveBeenCalled();
  });

  it('lista el historial propio desde /usuarios/me/pagos con descripción legible', async () => {
    get.mockResolvedValue([transaccionApi('CONFIRMADO')]);

    const pagos = await listarMisPagos();

    expect(get).toHaveBeenCalledWith('/v1/usuarios/me/pagos');
    expect(pagos[0].reservaCanchaId).toBe(5);
    expect(pagos[0].descripcion).toBe('Fútbol 5 · 2026-12-01 19:00 hs');
  });

  it('describe una membresía con el nombre del plan', () => {
    const t = mapearTransaccion(
      transaccionApi('CONFIRMADO', {
        concepto: 'MEMBRESIA',
        reservaCancha: null,
        membresia: { idMembresia: 2, plan: { nombre: 'Plan Mensual' } },
      })
    );

    expect(t.membresiaId).toBe(2);
    expect(t.descripcion).toBe('Membresía · Plan Mensual');
  });

  it('si el comprobante no existe devuelve null', async () => {
    get.mockRejectedValue(new Error('404'));

    expect(await obtenerComprobantePorTransaccion(10)).toBeNull();
  });

  it('descarga el PDF con el token de la sesión y avisa el 403', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(descargarComprobantePdf(7)).rejects.toThrow('No tenés permisos');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/v1/comprobantes/7/pdf');
    expect(init.headers.Authorization).toBe('Bearer token-de-prueba');

    vi.unstubAllGlobals();
  });

  describe('checkout de invitado', () => {
    it('paga con el código, sin sesión, y arma el comprobante con los datos de la respuesta', async () => {
      post.mockResolvedValue({
        aprobado: true,
        transaccion: transaccionApi('CONFIRMADO'),
        idComprobante: 8,
        numeroFactura: '0001-00000008',
      });

      const res = await pagarReservaInvitado('abc');

      expect(post).toHaveBeenCalledWith('/v1/invitados/reservas/abc/pago', { body: '{}' });
      expect(res.aprobado).toBe(true);
      expect(res.comprobante).toMatchObject({ idComprobante: 8, numeroFactura: '0001-00000008' });
    });

    it('un pago rechazado no trae comprobante', async () => {
      post.mockResolvedValue({
        aprobado: false,
        transaccion: transaccionApi('RECHAZADO'),
        idComprobante: null,
        numeroFactura: null,
      });

      const res = await pagarReservaInvitado('abc');

      expect(res.aprobado).toBe(false);
      expect(res.comprobante).toBeNull();
    });

    it('descarga el PDF del invitado sin enviar token', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response('%PDF-', { status: 200 }));
      vi.stubGlobal('fetch', fetchMock);

      await descargarComprobanteInvitado('abc');

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/invitados/reservas/abc/comprobante/pdf');
      expect(init.headers.Authorization).toBeUndefined();

      vi.unstubAllGlobals();
    });
  });
});
