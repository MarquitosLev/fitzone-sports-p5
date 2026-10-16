import type { UsuarioDTO } from './usuario';
import type { SedeDTO } from './sede';

/**
 * DTO de Acceso físico (registro de ingreso/egreso al club).
 * `fechaHoraEgreso` es null si el usuario todavía está adentro.
 * `reservaClase` y `reservaCancha` son IDs opcionales del origen del acceso.
 */
export interface AccesoDTO {
  idAcceso: number;
  usuario: UsuarioDTO;
  sede: SedeDTO;
  reservaClaseId: number | null;
  reservaCanchaId: number | null;
  /** Fecha y hora de ingreso como string ISO (LocalDateTime sin zona horaria) */
  fechaHoraIngreso: string;
  /** Fecha y hora de egreso, null si el socio aún está en el club */
  fechaHoraEgreso: string | null;
}
