import type { SedeDTO } from './sede';
import type { UsuarioDTO } from './usuario';

/**
 * Estados posibles de una reserva de clase grupal.
 * Corresponde al enum EstadoReservaClase del backend.
 */
export type EstadoReservaClase = 'CONFIRMADA' | 'CANCELADA' | 'ASISTIO' | 'NO_ASISTIO';

/**
 * DTO de Clase Grupal (una sesión programada de actividad física).
 * `cupoDisponible` lo calcula el backend (cupoMaximo - reservas activas).
 */
export interface ClaseGrupalDTO {
  idClase: number;
  sede: SedeDTO;
  nombreActividad: string;
  /** Fecha y hora de inicio como string ISO (LocalDateTime sin zona horaria de Java) */
  fechaHoraInicio: string;
  duracionMinutos: number;
  cupoMaximo: number;
  cupoDisponible: number;
}

/**
 * DTO de Reserva de Clase (el vínculo entre un socio y una ClaseGrupal).
 */
export interface ReservaClaseDTO {
  idReservaClase: number;
  clase: ClaseGrupalDTO;
  usuario: UsuarioDTO;
  estado: EstadoReservaClase;
}

/**
 * DTO de Lista de Espera (posición de un socio en la cola de espera de una clase).
 * Corresponde a la entidad `ListaEspera` del backend (`fz_cls_lista_espera`).
 */
export interface ListaEsperaDTO {
  idEspera: number;
  clase: ClaseGrupalDTO;
  usuario: UsuarioDTO;
  /** Posición en la cola (1 = primero en ser notificado cuando se libere un cupo). */
  ordenPosicion: number;
}
