export const PRESTACIONES = {
  // Módulo 2: Canchas
  CANCHAS_VER: 'CANCHAS_VER',
  CANCHAS_ADMIN: 'CANCHAS_ADMIN',
  CANCHAS_DESCUENTO_SOCIO: 'CANCHAS_DESCUENTO_SOCIO',

  // Módulo 3: Clases Grupales
  CLASES_VER: 'CLASES_VER',
  CLASES_RESERVAR: 'CLASES_RESERVAR',
  CLASES_ADMIN: 'CLASES_ADMIN',

  // Módulo 4: Control de Acceso y Gimnasio
  ACCESO_MI_QR: 'ACCESO_MI_QR',
  ACCESO_ESCANEAR: 'ACCESO_ESCANEAR',
  ACCESO_AFORO_VIEW: 'ACCESO_AFORO_VIEW',

  // Módulo 1: Usuarios y Personal
  USUARIOS_ALTA_SOCIO: 'USUARIOS_ALTA_SOCIO',
  USUARIOS_ADMIN: 'USUARIOS_ADMIN',
  ROLES_GESTIONAR: 'ROLES_GESTIONAR',

  // Módulo 5: Cobranzas y Pagos
  PAGOS_COBRAR_MOSTRADOR: 'PAGOS_COBRAR_MOSTRADOR',
  PAGOS_VER_HISTORIAL: 'PAGOS_VER_HISTORIAL',
} as const;

export type Prestacion = keyof typeof PRESTACIONES;

export type ModuloPrestacion = 'Canchas' | 'Clases' | 'Control Acceso' | 'Usuarios' | 'Pagos';

export interface MetadataPrestacion {
  clave: Prestacion;
  nombre: string;
  modulo: ModuloPrestacion;
  descripcion: string;
}

export interface RolDTO {
  codigo: string;
  nombre: string;
  descripcion: string;
  esSistema: boolean;
  prestaciones: Prestacion[];
}

export interface CrearRolDTO {
  codigo: string;
  nombre: string;
  descripcion: string;
  prestaciones: Prestacion[];
}
