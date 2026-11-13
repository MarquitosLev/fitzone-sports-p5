import { describe, it, expect, beforeEach } from 'vitest';
import {
  iniciarSesion,
  darAltaSocio,
  reintentarCuentaSocio,
  guardarAltaPendiente,
  obtenerAltaPendiente,
  limpiarAltaPendiente,
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

describe('SCRUM-135: alta de socio (Modo Mock)', () => {
  const datos = {
    nombre: 'Sofía',
    apellido: 'Nueva',
    dni: '40111999',
    email: 'Sofia@Mail.com',
    telefono: '1166660000',
    password: 'secreta1',
    idPlan: 1,
    idSede: 1,
  };

  beforeEach(() => {
    sessionStorage.clear();
    _resetMockUsersForTest();
  });

  it('con el pago aprobado crea un SOCIO, inicia sesión y devuelve el comprobante', async () => {
    const res = await darAltaSocio(datos);

    expect(res.cuentaPendiente).toBe(false);
    expect(res.token).toBeTruthy();
    expect(res.usuario.tipoUsuario).toBe('SOCIO');
    expect(res.usuario.email).toBe('sofia@mail.com');
    expect(res.numeroFactura).toBeTruthy();
    expect(obtenerSesionActual()?.token).toBe(res.token);
  });

  it('la cuenta creada puede iniciar sesión con su contraseña', async () => {
    await darAltaSocio(datos);
    cerrarSesion();

    const sesion = await iniciarSesion({ email: 'sofia@mail.com', password: 'secreta1' });

    expect(sesion.usuario.dni).toBe('40111999');
  });

  it('con el pago rechazado responde 422 y no crea la cuenta ni la sesión', async () => {
    await expect(darAltaSocio({ ...datos, forzarRechazo: true })).rejects.toMatchObject({ status: 422 });

    expect(obtenerSesionActual()).toBeNull();
    await expect(iniciarSesion({ email: 'sofia@mail.com', password: 'secreta1' })).rejects.toMatchObject({ status: 401 });
  });

  it('un DNI de una cuenta responde 409', async () => {
    await expect(darAltaSocio({ ...datos, dni: '35123456' })).rejects.toMatchObject({ status: 409 });
  });

  it('un email de una cuenta responde 409', async () => {
    await expect(darAltaSocio({ ...datos, email: 'socio@fitzone.com' })).rejects.toMatchObject({ status: 409 });
  });

  it('un cliente externo previo con ese DNI y email se convierte en socio', async () => {
    const res = await darAltaSocio({ ...datos, dni: '38999888', email: 'externo@fitzone.com' });

    expect(res.usuario.tipoUsuario).toBe('SOCIO');
  });

  it('el reintento con los datos del alta inicia sesión y con otros responde 403', async () => {
    await darAltaSocio(datos);
    cerrarSesion();

    const ok = await reintentarCuentaSocio({ dni: '40111999', email: 'sofia@mail.com', password: 'secreta1', codigoReintento: 'x' });
    expect(ok.token).toBeTruthy();

    await expect(
      reintentarCuentaSocio({ dni: '40111999', email: 'sofia@mail.com', password: 'otra-clave', codigoReintento: 'x' })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('el alta pendiente se guarda, se recupera y se limpia', () => {
    const alta = { dni: '40111999', email: 'sofia@mail.com', numeroFactura: '0001-00000003', codigoReintento: 'c0d1-g0', mensaje: 'm' };
    expect(obtenerAltaPendiente()).toBeNull();

    guardarAltaPendiente(alta);
    expect(obtenerAltaPendiente()).toEqual(alta);

    limpiarAltaPendiente();
    expect(obtenerAltaPendiente()).toBeNull();
  });

  it('un alta pendiente guardada con datos incompletos se ignora', () => {
    sessionStorage.setItem('fitzone_alta_pendiente', JSON.stringify({ dni: '1' }));
    expect(obtenerAltaPendiente()).toBeNull();

    sessionStorage.setItem('fitzone_alta_pendiente', 'no-es-json');
    expect(obtenerAltaPendiente()).toBeNull();
  });
});
