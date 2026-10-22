import { describe, it, expect, beforeEach } from 'vitest';
import {
  iniciarSesion,
  registrarUsuario,
  cerrarSesion,
  obtenerSesionActual,
  AUTH_STORAGE_KEY,
  _resetMockUsersForTest,
} from '../authService';
import { getAuthToken } from '../httpClient';
import { AppError } from '../httpClient';

describe('SCRUM-89: authService (Modo Mock)', () => {
  beforeEach(() => {
    localStorage.clear();
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
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();
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

  it('registra un nuevo usuario asignando EXTERNO y persiste la sesión', async () => {
    const nuevoUsuario = {
      nombre: 'Julieta',
      apellido: 'Romero',
      dni: '40123999',
      email: 'julieta.romero@fitzone.com',
      telefono: '1122334455',
      password: 'passwordSeguro123',
      tipoUsuario: 'EXTERNO' as const,
      idSede: null,
    };

    const res = await registrarUsuario(nuevoUsuario);

    expect(res.token).toContain('tok_mock_externo');
    expect(res.usuario.dni).toBe('40123999');
    expect(res.usuario.tipoUsuario).toBe('EXTERNO');
    expect(obtenerSesionActual()?.usuario.email).toBe('julieta.romero@fitzone.com');
  });

  it('rechaza con error 409 si el email ya existe', async () => {
    await expect(
      registrarUsuario({
        nombre: 'Otro',
        apellido: 'Usuario',
        dni: '45999888',
        email: 'socio@fitzone.com', // Ya registrado
        telefono: '1199887766',
        password: 'password123',
        tipoUsuario: 'EXTERNO',
      })
    ).rejects.toThrowError(AppError);

    try {
      await registrarUsuario({
        nombre: 'Otro',
        apellido: 'Usuario',
        dni: '45999888',
        email: 'socio@fitzone.com',
        telefono: '1199887766',
        password: 'password123',
        tipoUsuario: 'EXTERNO',
      });
    } catch (err: unknown) {
      const appErr = err as AppError;
      expect(appErr.status).toBe(409);
      expect(appErr.message).toMatch(/correo electrónico ya se encuentra registrado/i);
    }
  });

  it('rechaza con error 409 si el DNI ya existe', async () => {
    try {
      await registrarUsuario({
        nombre: 'Otro',
        apellido: 'Usuario',
        dni: '35123456', // DNI de Martín (SOCIO)
        email: 'nuevo.email@fitzone.com',
        telefono: '1199887766',
        password: 'password123',
        tipoUsuario: 'EXTERNO',
      });
    } catch (err: unknown) {
      const appErr = err as AppError;
      expect(appErr.status).toBe(409);
      expect(appErr.message).toMatch(/dni ingresado ya se encuentra registrado/i);
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
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
