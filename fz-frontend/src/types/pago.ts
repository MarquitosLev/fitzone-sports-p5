import type { UsuarioDTO } from './usuario';
import type { SedeDTO } from './sede';

/**
 * Estados posibles de un pago.
 * Corresponde al enum EstadoPago del backend.
 */
export type EstadoPago = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'REEMBOLSADO';

/**
 * Tipo de origen de una transacción (qué generó el cobro).
 * Corresponde al campo `concepto` de la entidad Transaccion en el backend.
 */
export type TipoOrigenTransaccion = 'RESERVA_EXTERNO' | 'RESERVA_SOCIO';

/**
 * DTO de Transacción (un cobro registrado en el sistema).
 * `fechaHoraConfirmacion` puede ser null si el pago todavía está pendiente.
 */
export interface TransaccionDTO {
  idTransaccion: number;
  usuario: UsuarioDTO;
  sede: SedeDTO;
  membresiaId: number | null;
  reservaCanchaId: number | null;
  concepto: TipoOrigenTransaccion;
  monto: number;
  estadoPago: EstadoPago;
  tokenTransaccionPasarela: string | null;
  /** Fecha de creación como string ISO (LocalDateTime sin zona horaria) */
  fechaHoraCreacion: string;
  fechaHoraConfirmacion: string | null;
}

/**
 * DTO de Comprobante (la "factura" asociada a una transacción pagada).
 */
export interface ComprobanteDTO {
  idComprobante: number;
  transaccion: TransaccionDTO;
  numeroFactura: string;
}
