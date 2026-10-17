import type { UsuarioDTO } from './usuario';

/**
 * Estados posibles de una membresía.
 * Corresponde al enum EstadoMembresia del backend.
 */
export type EstadoMembresia = 'ACTIVO' | 'VENCIDO' | 'CANCELADO' | 'SUSPENDIDO';

/**
 * DTO de Plan (la tarifa de la membresía: Mensual, Trimestral, Anual).
 */
export interface PlanDTO {
  idPlan: number;
  nombre: string;
  precioBase: number;
  duracionMeses?: number;
  duracionDias?: number;
  descripcion?: string;
  beneficios?: string[];
  destacado?: boolean;
}

/**
 * Payload para asociar o renovar una membresía de un socio.
 */
export interface MembresiaFormData {
  idUsuario: number;
  idPlan: number;
  fechaInicio?: string;
}

/**
 * DTO de Membresía.
 * Las fechas llegan como strings ISO (ej: "2024-03-15") sin zona horaria, como las devuelve LocalDate de Java.
 * `fechaCancelacion` puede ser null si la membresía nunca fue cancelada.
 */
export interface MembresiaDTO {
  idMembresia: number;
  usuario: UsuarioDTO;
  plan: PlanDTO;
  fechaInicio: string;
  fechaVencimiento: string;
  fechaCancelacion: string | null;
  estado: EstadoMembresia;
}

