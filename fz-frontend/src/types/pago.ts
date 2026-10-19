import type { UsuarioDTO } from './usuario';
import type { SedeDTO } from './sede';
import type { CotizacionReservaDTO } from './cancha';

/**
 * Estados posibles de un pago.
 * Corresponde al enum EstadoPago del backend.
 */
export type EstadoPago = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'REEMBOLSADO';

/**
 * Tipo de origen de una transacción (qué generó el cobro).
 * Corresponde al campo `concepto` de la entidad Transaccion en el backend.
 * Incluye reservas de socio y externo, y renovación/alta de membresía de socio.
 */
export type TipoOrigenTransaccion = 'RESERVA_EXTERNO' | 'RESERVA_SOCIO' | 'MEMBRESIA_SOCIO';

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
  /** Detalle legible para visualización en UI */
  descripcion?: string;
  /** Motivo de rechazo provisto por la pasarela simulada en caso de fallo */
  motivoRechazo?: string | null;
}

/**
 * Tipo legal del comprobante emitido.
 */
export type TipoComprobante = 'FACTURA_A' | 'FACTURA_B' | 'TICKET';

/**
 * DTO de Comprobante (la "factura" asociada a una transacción pagada).
 */
export interface ComprobanteDTO {
  idComprobante: number;
  transaccion: TransaccionDTO;
  numeroFactura: string;
  tipoComprobante?: TipoComprobante;
  cae?: string;
  fechaVencimientoCae?: string;
  urlDescargaPdf?: string;
}

/**
 * Tipo de ítem adquirido en el checkout.
 */
export type TipoItemPago = 'CANCHA' | 'MEMBRESIA';

/**
 * Información descriptiva del ítem a pagar (cancha o membresía) para renderizar en el resumen.
 */
export interface DetalleItemPago {
  tipo: TipoItemPago;
  titulo: string;
  subtitulo?: string;
  // Datos para reserva de cancha:
  canchaNombre?: string;
  deporte?: string;
  fecha?: string;
  horario?: string;
  cotizacion?: CotizacionReservaDTO;
  // Datos para membresía:
  planNombre?: string;
  duracionMeses?: number;
  fechaInicio?: string;
  fechaVencimiento?: string;
}

/**
 * Payload para procesar un pago o checkout en la pasarela simulada (RNF-02).
 */
export interface ProcesarPagoPayload {
  idSede: number;
  idUsuario: number;
  concepto: TipoOrigenTransaccion;
  monto: number;
  /** Token simulado de pasarela (ej: 'tok_mock_aprobado' | 'tok_mock_rechazado') */
  tokenTransaccionPasarela: string;
  idReservaCancha?: number | null;
  idMembresia?: number | null;
  tipoComprobante?: TipoComprobante;
  cuitFacturaA?: string;
  detalleItem?: DetalleItemPago;
}

/**
 * Resultado devuelto al procesar o reintentar una transacción de pago.
 */
export interface ResultadoPagoDTO {
  transaccion: TransaccionDTO;
  comprobante?: ComprobanteDTO | null;
  aprobado: boolean;
  mensaje?: string;
}
