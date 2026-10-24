/**
 * Barrel file: re-exporta todos los tipos del dominio desde un único punto.
 * Así podés importar así: import type { UsuarioDTO, TipoUsuario } from '../types';
 */
export type { SedeDTO } from './sede';
export type { TipoUsuario, UsuarioDTO, UsuarioFormData } from './usuario';
export type { EstadoMembresia, PlanDTO, MembresiaDTO, MembresiaFormData } from './membresia';
export type { Prestacion, ModuloPrestacion, MetadataPrestacion, RolDTO, CrearRolDTO } from './rol';
export { PRESTACIONES } from './rol';
export type {
  AccesoDTO,
  AforoSedeDTO,
  MotivoRechazoAcceso,
  ValidacionIngresoRequestDTO,
  ResultadoValidacionDTO,
  QrTokenDTO,
} from './acceso';
export type { EstadoReservaClase, ClaseGrupalDTO, ReservaClaseDTO, ListaEsperaDTO } from './clase';
export type {
  CanchaDTO,
  ReservaCanchaDTO,
  TipoCancha,
  CanchaFormData,
  EstadoTurno,
  FranjaHorariaDTO,
  CotizacionReservaDTO,
  EstadoReservaCancha,
  CrearReservaPayload,
} from './cancha';
export type {
  EstadoPago,
  TipoOrigenTransaccion,
  TransaccionDTO,
  ComprobanteDTO,
  TipoComprobante,
  TipoItemPago,
  DetalleItemPago,
  ProcesarPagoPayload,
  ResultadoPagoDTO,
} from './pago';
export type {
  LoginCredentialsDTO,
  RegistroUsuarioDTO,
  AuthResponseDTO,
  AuthState,
} from './auth';

