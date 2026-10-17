import type { SedeDTO } from './sede';
import type { UsuarioDTO } from './usuario';

export type TipoCancha = 'PADEL' | 'FUTBOL_5' | 'FUTBOL_7' | 'TENIS' | 'BASQUET' | 'OTRO';

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

/**
 * DTO de Reserva de Cancha.
 * `fechaHoraInicio` y `fechaHoraFin` son strings ISO (LocalDateTime sin zona horaria).
 * `precioFinal` lo calcula el backend (puede incluir el descuento del 15% para socios).
 */
export interface ReservaCanchaDTO {
  idReservaCancha: number;
  cancha: CanchaDTO;
  usuario: UsuarioDTO;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  precioFinal: number;
}
