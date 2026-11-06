import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  httpClient,
  AppError,
  MENSAJE_SIN_PERMISO,
  registerHttpErrorHandler,
  setAuthToken,
  getAuthToken,
} from '../httpClient';

function respuestaJson(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SCRUM-92: httpClient — sesión y permisos', () => {
  const handler = vi.fn();

  beforeEach(() => {
    handler.mockReset();
    registerHttpErrorHandler(handler);
    localStorage.clear();
    setAuthToken(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setAuthToken(null);
  });

  it('agrega el header Authorization: Bearer cuando hay token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuestaJson(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    setAuthToken('token-123');

    await httpClient.get('/v1/usuarios/me');

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-123');
  });

  it('ante un 403 avisa "sin permiso", lanza AppError 403 y no cierra la sesión', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respuestaJson(403, { codigo: 'ACCESO_DENEGADO', mensaje: 'Forbidden', timestamp: '' }))
    );
    setAuthToken('token-socio');
    localStorage.setItem('fitzone_auth_session', '{"token":"token-socio"}');

    const error = await httpClient.post('/v1/canchas', { body: '{}' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(403);
    expect((error as AppError).message).toBe(MENSAJE_SIN_PERMISO);
    expect(handler).toHaveBeenCalledWith(MENSAJE_SIN_PERMISO, 403);
    expect(getAuthToken()).toBe('token-socio');
    expect(localStorage.getItem('fitzone_auth_session')).not.toBeNull();
  });

  it('ante un 401 con sesión borra el token y la sesión guardada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respuestaJson(401, { codigo: 401, mensaje: 'Token vencido', timestamp: '' }))
    );
    setAuthToken('token-vencido');
    localStorage.setItem('fitzone_auth_session', '{"token":"token-vencido"}');

    await expect(httpClient.get('/v1/usuarios/me')).rejects.toBeInstanceOf(AppError);

    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem('fitzone_auth_session')).toBeNull();
    expect(handler).toHaveBeenCalledWith('Token vencido', 401);
  });

  it('para otros errores pasa el mensaje del backend y el status al handler', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respuestaJson(409, { codigo: 'CONFLICTO', mensaje: 'Turno ocupado', timestamp: '' }))
    );

    await expect(httpClient.post('/v1/reservas', { body: '{}' })).rejects.toBeInstanceOf(AppError);
    expect(handler).toHaveBeenCalledWith('Turno ocupado', 409);
  });
});
