import type { UsuarioDTO } from './usuario';

/**
 * Credenciales para el inicio de sesión.
 */
export interface LoginCredentialsDTO {
  email: string;
  password: string;
}

/**
 * Datos personales y contraseña del alta de socio online. El alta siempre es de SOCIO:
 * el cliente sin cuenta reserva como invitado.
 */
export interface RegistroUsuarioDTO {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  password: string;
}

/** Body de POST /v1/auth/alta-socio: los datos, el plan elegido y la sede donde se registra el cobro. */
export interface AltaSocioDTO extends RegistroUsuarioDTO {
  idPlan: number;
  idSede: number;
  forzarRechazo?: boolean;
}

/**
 * Resultado del alta. `token` null: hay que iniciar sesión a mano, o la cuenta quedó pendiente
 * (`cuentaPendiente`) y se reintenta con `numeroFactura`. Los campos del alta son opcionales para
 * que `AuthResponseDTO` siga siendo asignable.
 */
export interface AltaSocioResultadoDTO {
  token: string | null;
  usuario: UsuarioDTO;
  cuentaPendiente?: boolean;
  mensaje?: string;
  idMembresia?: number | null;
  fechaVencimiento?: string | null;
  idComprobante?: number | null;
  numeroFactura?: string | null;
}

/** Body de POST /v1/auth/alta-socio/reintentar-cuenta. */
export interface ReintentoCuentaDTO {
  dni: string;
  email: string;
  password: string;
  numeroFactura: string;
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
