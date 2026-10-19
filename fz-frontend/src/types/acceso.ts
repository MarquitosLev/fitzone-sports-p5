import type { UsuarioDTO } from './usuario';
import type { SedeDTO } from './sede';
import type { ReservaClaseDTO } from './clase';
import type { ReservaCanchaDTO } from './cancha';

/**
 * DTO de Aforo en tiempo real de una sede.
 * Coincide exactamente con los campos serializados por AforoSede.java del backend.
 */
export interface AforoSedeDTO {
  aforoActual: number;
  aforoMaximo: number;
  porcentaje: number;
}

/**
 * Motivos posibles de rechazo de un acceso físico (RN-01, RN-04, RF-04, RF-05).
 * Modelado como unión de strings literales respetando erasableSyntaxOnly.
 */
export type MotivoRechazoAcceso =
  | 'QR_VENCIDO'
  | 'MEMBRESIA_INACTIVA'
  | 'YA_INGRESADO'
  | 'AFORO_COMPLETO';

/**
 * Payload para solicitar la validación de ingreso físico por molinete.
 */
export interface ValidacionIngresoRequestDTO {
  token: string;
  idSede: number;
}

/**
 * Resultado de la validación de un intento de ingreso.
 */
export interface ResultadoValidacionDTO {
  aprobado: boolean;
  motivoRechazo?: MotivoRechazoAcceso | null;
  mensaje?: string;
  usuario?: UsuarioDTO | null;
  acceso?: AccesoDTO | null;
}

/**
 * DTO de Acceso físico (registro de ingreso/egreso al club).
 * Coincide con Acceso.java y cumple RN-04 (a lo sumo una reserva asociada o ambas nulas para acceso libre).
 * `fechaHoraEgreso` es null si el usuario todavía está adentro de la sede.
 */
export interface AccesoDTO {
  idAcceso: number;
  usuario: UsuarioDTO;
  sede: SedeDTO;
  reservaClase?: ReservaClaseDTO | null;
  reservaCancha?: ReservaCanchaDTO | null;
  /** Fecha y hora de ingreso como string ISO local (LocalDateTime de Java) */
  fechaHoraIngreso: string;
  /** Fecha y hora de egreso, null si el socio aún está dentro del club */
  fechaHoraEgreso: string | null;
}

/**
 * DTO para token dinámico de código QR de acceso (SCRUM-85).
 */
export interface QrTokenDTO {
  /** Token firmado o generado para validar en el lector de ingreso */
  token: string;
  /** Duración en segundos antes de requerir rotación (habitualmente 60 segundos) */
  expiraEnSegundos: number;
  /** Timestamp ISO de generación del token */
  generadoEn: string;
}

