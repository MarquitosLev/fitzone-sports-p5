import { describe, it, expect, beforeEach } from 'vitest';
import {
  iniciarSesion,
  cerrarSesion,
  obtenerSesionActual,
  AUTH_STORAGE_KEY,
  _resetMockUsersForTest,
} from '../authService';
import { getAuthToken } from '../httpClient';
import { AppError } from '../httpClient';

describe('SCRUM-89: authService (Modo Mock)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    _resetMockUsersForTest();
  });

  it('inicia sesión exitosamente para un rol SOCIO con credenciales válidas', async () => {
    const res = await iniciarSesion({
      email: 'socio@fitzone.com',
      password: 'password123',
    });

    expect(res.token).toContain('tok_mock_socio');
    expect(res.usuario.tipoUsuario).toBe('SOCIO');
    expect(res.usuario.nombre).toBe('Martín');
    expect(getAuthToken()).toBe(res.token);
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();
  });

  it('SCRUM-136: guarda la sesión solo en sessionStorage para que otra pestaña no la pise', async () => {
    localStorage.clear();
    await iniciarSesion({ email: 'socio@fitzone.com', password: 'password123' });

    // localStorage lo comparten todas las pestañas; sessionStorage es propio de cada una
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();
  });

  it('inicia sesión exitosamente para un rol GERENTE', async () => {
    const res = await iniciarSesion({
      email: 'gerente@fitzone.com',
      password: 'password123',
    });

    expect(res.token).toContain('tok_mock_gerente');
    expect(res.usuario.tipoUsuario).toBe('GERENTE');
  });

  it('rechaza con error 401 ante contraseña incorrecta', async () => {
    await expect(
      iniciarSesion({
        email: 'socio@fitzone.com',
        password: 'wrongPassword',
      })
    ).rejects.toThrowError(AppError);

    try {
      await iniciarSesion({
        email: 'socio@fitzone.com',
        password: 'wrongPassword',
      });
    } catch (err: unknown) {
      const appErr = err as AppError;
      expect(appErr.status).toBe(401);
      expect(appErr.message).toMatch(/credenciales inválidas/i);
    }
  });

  it('cierra sesión eliminando los datos de storage y httpClient', async () => {
    await iniciarSesion({
      email: 'socio@fitzone.com',
      password: 'password123',
    });

    expect(obtenerSesionActual()).not.toBeNull();
    expect(getAuthToken()).not.toBeNull();

    cerrarSesion();

    expect(obtenerSesionActual()).toBeNull();
    expect(getAuthToken()).toBeNull();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
