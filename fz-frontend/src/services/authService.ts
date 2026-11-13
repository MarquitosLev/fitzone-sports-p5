import { httpClient, AppError, setAuthToken } from './httpClient';
import { USE_MOCK } from '../config';
import type {
  LoginCredentialsDTO,
  AltaSocioDTO,
  AltaSocioResultadoDTO,
  ReintentoCuentaDTO,
  AuthResponseDTO,
  UsuarioDTO,
} from '../types';

/**
 * Endpoints REST del módulo de autenticación (SCRUM-89).
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/v1/auth/login',
  ALTA_SOCIO: '/v1/auth/alta-socio',
  REINTENTAR_CUENTA: '/v1/auth/alta-socio/reintentar-cuenta',
  LOGOUT: '/v1/auth/logout',
  /** Perfil del usuario dueño del token (UsuarioController#obtenerMiPerfil). */
  ME: '/v1/usuarios/me',
} as const;

export const AUTH_STORAGE_KEY = 'fitzone_auth_session';

/**
 * Usuarios semilla simulados para pruebas y autocompletado rápido por rol (USE_MOCK=true).
 */
export const MOCK_AUTH_USERS: Array<{
  credentials: LoginCredentialsDTO;
  usuario: UsuarioDTO;
}> = [
  {
    credentials: {
      email: 'socio@fitzone.com',
      password: 'password123',
    },
    usuario: {
      idUsuario: 101,
      authId: 'mock-auth-socio-101',
      dni: '35123456',
      nombre: 'Martín',
      apellido: 'García',
      email: 'socio@fitzone.com',
      telefono: '1144556677',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
  },
  {
    credentials: {
      email: 'externo@fitzone.com',
      password: 'password123',
    },
    usuario: {
      idUsuario: 102,
      authId: null,
      dni: '38999888',
      nombre: 'Laura',
      apellido: 'Fernández',
      email: 'externo@fitzone.com',
      telefono: '1133221100',
      fotoUrl: null,
      tipoUsuario: 'EXTERNO',
      idSede: 1,
    },
  },
  {
    credentials: {
      email: 'recepcionista@fitzone.com',
      password: 'password123',
    },
    usuario: {
      idUsuario: 103,
      authId: 'mock-auth-recep-103',
      dni: '32444555',
      nombre: 'Lucía',
      apellido: 'Pérez',
      email: 'recepcionista@fitzone.com',
      telefono: '1155667788',
      fotoUrl: null,
      tipoUsuario: 'RECEPCIONISTA',
      idSede: 1,
    },
  },
  {
    credentials: {
      email: 'gerente@fitzone.com',
      password: 'password123',
    },
    usuario: {
      idUsuario: 104,
      authId: 'mock-auth-gerente-104',
      dni: '28111222',
      nombre: 'Carlos',
      apellido: 'Vidal',
      email: 'gerente@fitzone.com',
      telefono: '1188990011',
      fotoUrl: null,
      tipoUsuario: 'GERENTE',
      idSede: 1,
    },
  },
];

// Estado en memoria de usuarios registrados en modo mock
let _mockUsers = [...MOCK_AUTH_USERS];

function persistSession(session: AuthResponseDTO): void {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setAuthToken(session.token);
  } catch {
    // Si sessionStorage no está disponible (ej. modo incógnito estricto), continúa
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthToken(null);
  } catch {
    // No-op
  }
}

/**
 * Obtiene la sesión activa almacenada (en sessionStorage, propia de cada pestaña) y sincroniza el token en httpClient.
 */
export function obtenerSesionActual(): AuthResponseDTO | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthResponseDTO;
    if (session?.token) {
      setAuthToken(session.token);
      return session;
    }
  } catch {
    clearSession();
  }
  return null;
}

/**
 * Inicia sesión con credenciales de email y contraseña.
 * Soporta modo mock con 4 roles preconfigurados y modo API real vía httpClient.
 */
export async function iniciarSesion(
  credentials: LoginCredentialsDTO
): Promise<AuthResponseDTO> {
  if (USE_MOCK) {
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const found = _mockUsers.find(
      (item) => item.credentials.email.toLowerCase() === normalizedEmail
    );

    if (!found || found.credentials.password !== credentials.password) {
      throw new AppError(
        'Credenciales inválidas. Verifique su correo y contraseña.',
        401
      );
    }

    const response: AuthResponseDTO = {
      token: `tok_mock_${found.usuario.tipoUsuario.toLowerCase()}_${Date.now()}`,
      usuario: { ...found.usuario },
    };

    persistSession(response);
    return response;
  }

  const response = await httpClient.post<AuthResponseDTO>(
    AUTH_ENDPOINTS.LOGIN,
    { body: JSON.stringify(credentials) }
  );

  persistSession(response);
  return response;
}

function resultadoMockDeAlta(usuario: UsuarioDTO): AltaSocioResultadoDTO {
  const token = `tok_mock_${usuario.tipoUsuario.toLowerCase()}_${Date.now()}`;
  persistSession({ token, usuario });
  return {
    token,
    usuario,
    cuentaPendiente: false,
    mensaje: '¡Bienvenido a FitZone!',
    idMembresia: usuario.idUsuario,
    fechaVencimiento: null,
    idComprobante: usuario.idUsuario,
    numeroFactura: `0001-${String(usuario.idUsuario).padStart(8, '0')}`,
  };
}

function darAltaSocioMock(datos: AltaSocioDTO): AltaSocioResultadoDTO {
  const email = datos.email.trim().toLowerCase();
  const dni = datos.dni.trim();
  const conCuenta = _mockUsers.filter((item) => item.usuario.tipoUsuario !== 'EXTERNO');
  if (conCuenta.some((item) => item.usuario.dni === dni)) {
    throw new AppError('Ya existe una cuenta con ese DNI. Iniciá sesión para renovar tu membresía.', 409);
  }
  if (conCuenta.some((item) => item.credentials.email.toLowerCase() === email)) {
    throw new AppError('Ya existe una cuenta con ese email. Iniciá sesión.', 409);
  }
  if (datos.forzarRechazo) {
    throw new AppError('El pago fue rechazado. No se creó la cuenta: podés reintentar con otro medio de pago.', 422);
  }

  const usuario: UsuarioDTO = {
    idUsuario: 200 + _mockUsers.length,
    authId: `mock-auth-socio-${Date.now()}`,
    dni,
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    email,
    telefono: datos.telefono.trim(),
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: null,
  };
  _mockUsers = [
    ..._mockUsers.filter((item) => item.usuario.dni !== dni && item.credentials.email.toLowerCase() !== email),
    { credentials: { email, password: datos.password }, usuario },
  ];
  return resultadoMockDeAlta(usuario);
}

/**
 * Alta de socio online: paga la suscripción y, con el pago aprobado, el backend crea la cuenta.
 * Responde 422 si el pago se rechazó (no se crea nada) y 409 si el DNI o el email ya son de una cuenta.
 * Con token en la respuesta la sesión queda iniciada.
 */
export async function darAltaSocio(datos: AltaSocioDTO): Promise<AltaSocioResultadoDTO> {
  if (USE_MOCK) {
    return darAltaSocioMock(datos);
  }

  const response = await httpClient.post<AltaSocioResultadoDTO>(AUTH_ENDPOINTS.ALTA_SOCIO, {
    body: JSON.stringify(datos),
  });
  if (response.token) {
    persistSession({ token: response.token, usuario: response.usuario });
  }
  return response;
}

/**
 * Crea la cuenta de un socio que ya pagó y quedó con la cuenta pendiente; el código de reintento
 * (se entrega solo en esa respuesta) prueba que pagó. Con token en la respuesta la sesión queda iniciada.
 */
export async function reintentarCuentaSocio(datos: ReintentoCuentaDTO): Promise<AltaSocioResultadoDTO> {
  if (USE_MOCK) {
    const email = datos.email.trim().toLowerCase();
    const encontrado = _mockUsers.find(
      (item) => item.usuario.dni === datos.dni.trim() && item.credentials.email.toLowerCase() === email
    );
    if (!encontrado || encontrado.credentials.password !== datos.password) {
      throw new AppError('Los datos no coinciden con el alta', 403);
    }
    return resultadoMockDeAlta({ ...encontrado.usuario });
  }

  const response = await httpClient.post<AltaSocioResultadoDTO>(AUTH_ENDPOINTS.REINTENTAR_CUENTA, {
    body: JSON.stringify(datos),
  });
  if (response.token) {
    persistSession({ token: response.token, usuario: response.usuario });
  }
  return response;
}

export const ALTA_PENDIENTE_STORAGE_KEY = 'fitzone_alta_pendiente';

/** Alta con el pago registrado y la cuenta sin crear. Nunca incluye la contraseña. */
export interface AltaPendienteGuardada {
  dni: string;
  email: string;
  numeroFactura: string;
  codigoReintento: string;
  mensaje: string;
}

/** Guarda el alta pendiente para no perder el código de reintento si se recarga la página. */
export function guardarAltaPendiente(alta: AltaPendienteGuardada): void {
  try {
    sessionStorage.setItem(ALTA_PENDIENTE_STORAGE_KEY, JSON.stringify(alta));
  } catch {
    // Sin sessionStorage el código solo vive mientras la pantalla siga abierta
  }
}

export function obtenerAltaPendiente(): AltaPendienteGuardada | null {
  try {
    const raw = sessionStorage.getItem(ALTA_PENDIENTE_STORAGE_KEY);
    if (!raw) return null;
    const alta = JSON.parse(raw) as AltaPendienteGuardada;
    return alta?.codigoReintento && alta?.dni && alta?.email ? alta : null;
  } catch {
    return null;
  }
}

export function limpiarAltaPendiente(): void {
  try {
    sessionStorage.removeItem(ALTA_PENDIENTE_STORAGE_KEY);
  } catch {
    // No-op
  }
}

/**
 * Consulta el perfil del usuario logueado (`GET /v1/usuarios/me`) y actualiza
 * la sesión guardada con esos datos (rol, sede, nombre).
 *
 * Sirve para dos cosas al arrancar la app:
 *   - Validar que el token guardado sigue vigente: si venció, el backend
 *     responde 401 y el httpClient cierra la sesión y manda a /login.
 *   - Tomar los datos frescos del backend (por ejemplo, si cambió el rol).
 *
 * En modo mock devuelve el usuario de la sesión guardada, sin red.
 */
export async function obtenerUsuarioActual(): Promise<UsuarioDTO> {
  const sesion = obtenerSesionActual();

  if (USE_MOCK) {
    if (!sesion) {
      throw new AppError('No hay una sesión activa.', 401);
    }
    return { ...sesion.usuario };
  }

  const usuario = await httpClient.get<UsuarioDTO>(AUTH_ENDPOINTS.ME);
  if (sesion) {
    persistSession({ token: sesion.token, usuario });
  }
  return usuario;
}

/**
 * Cierra la sesión activa del usuario y limpia el token en httpClient y storage.
 */
export function cerrarSesion(): void {
  clearSession();
}

/**
 * Utilidad exclusiva para tests: restablece la lista de usuarios mock.
 */
export function _resetMockUsersForTest(): void {
  _mockUsers = [...MOCK_AUTH_USERS];
  clearSession();
}
