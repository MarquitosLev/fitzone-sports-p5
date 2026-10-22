import { httpClient, AppError, setAuthToken } from './httpClient';
import { USE_MOCK } from '../config';
import type {
  LoginCredentialsDTO,
  RegistroUsuarioDTO,
  AuthResponseDTO,
  UsuarioDTO,
} from '../types';

/**
 * Endpoints REST del módulo de autenticación (SCRUM-89).
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/v1/auth/login',
  REGISTRO: '/v1/auth/registro',
  LOGOUT: '/v1/auth/logout',
  ME: '/v1/auth/me',
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
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setAuthToken(session.token);
  } catch {
    // Si localStorage no está disponible (ej. modo incógnito estricto), continúa
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthToken(null);
  } catch {
    // No-op
  }
}

/**
 * Obtiene la sesión activa almacenada (en localStorage) y sincroniza el token en httpClient.
 */
export function obtenerSesionActual(): AuthResponseDTO | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
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

/**
 * Registra un nuevo usuario en el sistema.
 * El formulario público asigna fijamente tipoUsuario = 'EXTERNO' e idSede = null.
 */
export async function registrarUsuario(
  datos: RegistroUsuarioDTO
): Promise<AuthResponseDTO> {
  if (USE_MOCK) {
    const normalizedEmail = datos.email.trim().toLowerCase();
    const normalizedDni = datos.dni.trim();

    // Validación de duplicados (409 Conflict)
    const emailExiste = _mockUsers.some(
      (item) => item.credentials.email.toLowerCase() === normalizedEmail
    );
    if (emailExiste) {
      throw new AppError(
        'El correo electrónico ya se encuentra registrado.',
        409
      );
    }

    const dniExiste = _mockUsers.some(
      (item) => item.usuario.dni === normalizedDni
    );
    if (dniExiste) {
      throw new AppError(
        'El DNI ingresado ya se encuentra registrado.',
        409
      );
    }

    const nuevoUsuario: UsuarioDTO = {
      idUsuario: Date.now(),
      authId: `mock-auth-${Date.now()}`,
      dni: normalizedDni,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: normalizedEmail,
      telefono: datos.telefono.trim(),
      fotoUrl: null,
      tipoUsuario: datos.tipoUsuario ?? 'EXTERNO',
      idSede: datos.idSede ?? 1,
    };

    _mockUsers.push({
      credentials: {
        email: normalizedEmail,
        password: datos.password,
      },
      usuario: nuevoUsuario,
    });

    const response: AuthResponseDTO = {
      token: `tok_mock_externo_${Date.now()}`,
      usuario: nuevoUsuario,
    };

    persistSession(response);
    return response;
  }

  const response = await httpClient.post<AuthResponseDTO>(
    AUTH_ENDPOINTS.REGISTRO,
    { body: JSON.stringify(datos) }
  );

  persistSession(response);
  return response;
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
