import type { TipoUsuario, UsuarioDTO } from './usuario';

/**
 * Credenciales para el inicio de sesión.
 */
export interface LoginCredentialsDTO {
  email: string;
  password: string;
}

/**
 * Datos requeridos para el registro público de un nuevo usuario.
 * Por defecto en el frontend se asigna tipoUsuario = 'EXTERNO' e idSede = null.
 */
export interface RegistroUsuarioDTO {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  password: string;
  tipoUsuario: TipoUsuario;
  idSede?: number | null;
}

/**
 * Respuesta que entrega el backend tras una autenticación o registro exitoso.
 */
export interface AuthResponseDTO {
  token: string;
  usuario: UsuarioDTO;
}

/**
 * Estado global de autenticación en la aplicación.
 */
export interface AuthState {
  usuario: UsuarioDTO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
