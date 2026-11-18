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
  | 'AFORO_COMPLETO'
  /** Solo sin conexión: el terminal no tiene una lista de habilitados vigente para validar. */
  | 'SIN_DATOS_LOCALES';

/**
 * Payload para solicitar la validación de ingreso físico por molinete.
 * Cuando el recepcionista está autenticado en sesión (SCRUM-96), `idSede` es opcional
 * ya que el backend toma la sede asignada del operador logueado.
 */
export interface ValidacionIngresoRequestDTO {
  token: string;
  idSede?: number;
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
  /** true si lo resolvió el terminal sin conexión: el ingreso queda pendiente de confirmar en el servidor. */
  offline?: boolean;
}

/** Lista local que baja el terminal de sede (GET /v1/accesos/terminal/habilitados). */
export interface HabilitadosDTO {
  horaServidor: string;
  validaHasta: string;
  idSede: number;
  aforoMaximo: number;
  socios: Array<{
    idUsuario: number;
    nombre: string;
    apellido: string;
    dni: string;
    /** Fecha local AAAA-MM-DD */
    venceMembresia: string;
  }>;
  adentro: Array<{
    idAcceso: number | null;
    idUsuario: number;
    tokenQr: string | null;
    fechaHoraIngreso: string;
  }>;
}

/** Ingreso aprobado sin conexión, esperando confirmación del servidor. */
export interface IngresoEnCola {
  tokenQr: string;
  idSede?: number;
  /** Instante ISO con zona (Date.toISOString) */
  ocurrioEn: string;
  /** Para mostrar en la tabla de la cola */
  socio?: string;
  estado: 'pendiente' | 'error';
  codigo?: string;
  mensaje?: string;
}

/** Resultado por evento de POST /v1/accesos/sincronizacion. */
export interface ResultadoSincronizacionDTO {
  tokenQr: string;
  ok: boolean;
  codigo?: string | null;
  mensaje?: string | null;
  idAcceso?: number | null;
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
