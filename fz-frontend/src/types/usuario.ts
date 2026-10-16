/**
 * Roles posibles de un usuario en el sistema.
 * Son los valores exactos del enum TipoUsuario en el backend.
 * En TS usamos una unión de strings literales (en vez de un enum) para compatibilidad
 * con el flag `erasableSyntaxOnly` del tsconfig.
 */
export type TipoUsuario = 'SOCIO' | 'EXTERNO' | 'RECEPCIONISTA' | 'GERENTE';

/**
 * DTO de Usuario.
 * Viene del backend sin los campos de auditoría.
 * `authId` es null para EXTERNO (usuarios invitados sin cuenta).
 */
export interface UsuarioDTO {
  idUsuario: number;
  authId: string | null;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fotoUrl: string | null;
  tipoUsuario: TipoUsuario;
  idSede: number;
}

/**
 * Datos para el formulario de creación o edición de un usuario.
 */
export interface UsuarioFormData {
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fotoUrl?: string | null;
  tipoUsuario: TipoUsuario;
  idSede: number;
}

