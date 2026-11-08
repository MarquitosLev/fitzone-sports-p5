import type { SedeDTO } from './sede';
import type { UsuarioDTO } from './usuario';

export type TipoCancha = 'PADEL' | 'PADDLE' | 'FUTBOL_5' | 'FUTBOL_7' | 'TENIS' | 'BASQUET' | 'OTRO';

/**
 * DTO de Cancha.
 * `enMantenimiento: true` significa que no puede recibir reservas.
 * `precioBaseHora` es el precio sin descuentos; el backend calcula `precioFinal`.
 */
export interface CanchaDTO {
  idCancha: number;
  sede: SedeDTO;
  nombre: string;
  tipo?: TipoCancha;
  precioBaseHora: number;
  enMantenimiento: boolean;
}

export interface CanchaFormData {
  nombre: string;
  tipo: TipoCancha;
  precioBaseHora: number;
  enMantenimiento?: boolean;
}

export type EstadoTurno = 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO' | 'RECIEN_TOMADO';

export interface FranjaHorariaDTO {
  id: string; // Ej: "18:00" o "18:00-19:00"
  horaInicio: string; // "18:00"
  horaFin: string; // "19:00"
  textoTurno: string; // "18:00 – 19:00"
  esPico: boolean; // Franja pico 19 a 21 hs
  estado: EstadoTurno;
  precioEstimado?: number;
}

export interface CotizacionReservaDTO {
  precioBase: number;
  esPico: boolean;
  recargoPico: number;
  porcentajeRecargoPico: number;
  descuentoSocio: number;
  porcentajeDescuentoSocio: number;
  esSocio: boolean;
  total: number;
}

export type EstadoReservaCancha = 'PENDIENTE_PAGO' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA';

/**
 * DTO de Reserva de Cancha.
 * `fechaHoraInicio` y `fechaHoraFin` son strings ISO (LocalDateTime sin zona horaria).
 * `precioFinal` lo calcula el backend (puede incluir el descuento de socio).
 */
export interface ReservaCanchaDTO {
  idReservaCancha: number;
  cancha: CanchaDTO;
  usuario: UsuarioDTO;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  precioFinal: number;
  estado?: EstadoReservaCancha;
  cotizacion?: CotizacionReservaDTO;
  fechaCreacion?: string;
  comprobanteUrl?: string;
}

export interface CrearReservaPayload {
  idCancha: number;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // "19:00"
  horaFin: string; // "20:00"
  idUsuario?: number;
  esSocio?: boolean;
  nombreInvitado?: string;
  emailInvitado?: string;
}
