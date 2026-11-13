/**
 * authService.api.test.ts — Contrato con la API real del alta de socio con pago.
 * Fuerza USE_MOCK=false y verifica rutas, cuerpos y la persistencia de la sesión.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => ({ USE_MOCK: false }));

const post = vi.fn();
vi.mock('../httpClient', async (importOriginal) => {
  const original = await importOriginal<typeof import('../httpClient')>();
  return { ...original, httpClient: { get: vi.fn(), post, put: vi.fn(), patch: vi.fn(), delete: vi.fn() } };
});

const { darAltaSocio, reintentarCuentaSocio, obtenerSesionActual, AUTH_STORAGE_KEY } = await import('../authService');

const usuario = {
  idUsuario: 50,
  authId: 'uuid',
  dni: '40111999',
  nombre: 'Sofía',
  apellido: 'Nueva',
  email: 'sofia@mail.com',
  telefono: '1166660000',
  fotoUrl: null,
  tipoUsuario: 'SOCIO' as const,
  idSede: null,
};

const datos = {
  nombre: 'Sofía',
  apellido: 'Nueva',
  dni: '40111999',
  email: 'sofia@mail.com',
  telefono: '1166660000',
  password: 'secreta1',
  idPlan: 1,
  idSede: 1,
};

describe('authService: alta de socio con la API real', () => {
  beforeEach(() => {
    post.mockReset();
    localStorage.clear();
  });

  it('envía los datos, el plan y la sede a /v1/auth/alta-socio', async () => {
    post.mockResolvedValue({ token: 'jwt', usuario, cuentaPendiente: false });

    await darAltaSocio(datos);

    expect(post).toHaveBeenCalledWith('/v1/auth/alta-socio', { body: JSON.stringify(datos) });
  });

  it('con token en la respuesta deja la sesión iniciada', async () => {
    post.mockResolvedValue({ token: 'jwt', usuario, cuentaPendiente: false });

    await darAltaSocio(datos);

    expect(obtenerSesionActual()?.token).toBe('jwt');
    expect(obtenerSesionActual()?.usuario.tipoUsuario).toBe('SOCIO');
  });

  it('sin token (cuenta pendiente o sin sesión) no guarda ninguna sesión', async () => {
    post.mockResolvedValue({ token: null, usuario, cuentaPendiente: true, numeroFactura: '0001-00000003', codigoReintento: 'c0d1-g0' });

    const res = await darAltaSocio(datos);

    expect(res.cuentaPendiente).toBe(true);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('propaga el error del backend si el pago se rechaza, sin guardar sesión', async () => {
    post.mockRejectedValue(new Error('El pago fue rechazado'));

    await expect(darAltaSocio(datos)).rejects.toThrow('El pago fue rechazado');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('el reintento envía el código de reintento a /v1/auth/alta-socio/reintentar-cuenta', async () => {
    post.mockResolvedValue({ token: 'jwt', usuario, cuentaPendiente: false });
    const reintento = { dni: '40111999', email: 'sofia@mail.com', password: 'secreta1', codigoReintento: 'c0d1-g0' };

    await reintentarCuentaSocio(reintento);

    expect(post).toHaveBeenCalledWith('/v1/auth/alta-socio/reintentar-cuenta', { body: JSON.stringify(reintento) });
  });

  it('el reintento con token en la respuesta deja la sesión iniciada', async () => {
    post.mockResolvedValue({ token: 'jwt', usuario, cuentaPendiente: false });

    await reintentarCuentaSocio({ dni: '40111999', email: 'sofia@mail.com', password: 'secreta1', codigoReintento: 'c0d1-g0' });

    expect(obtenerSesionActual()?.token).toBe('jwt');
  });
});
