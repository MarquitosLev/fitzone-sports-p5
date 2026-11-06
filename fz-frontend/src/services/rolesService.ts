import { PRESTACIONES } from '../types/rol';
import type { Prestacion, RolDTO, MetadataPrestacion } from '../types/rol';

export const CATALOGO_PRESTACIONES: MetadataPrestacion[] = [
  // Canchas
  { clave: PRESTACIONES.CANCHAS_VER, nombre: 'Ver Canchas', modulo: 'Canchas', descripcion: 'Visualizar canchas y turnos disponibles' },
  { clave: PRESTACIONES.CANCHAS_ADMIN, nombre: 'Administrar Canchas', modulo: 'Canchas', descripcion: 'Crear, editar canchas y modificar tarifas' },
  { clave: PRESTACIONES.CANCHAS_DESCUENTO_SOCIO, nombre: 'Descuento Socio', modulo: 'Canchas', descripcion: 'Descuento de socio en las reservas de cancha' },

  // Clases
  { clave: PRESTACIONES.CLASES_VER, nombre: 'Ver Clases', modulo: 'Clases', descripcion: 'Explorar cronograma de clases grupales' },
  { clave: PRESTACIONES.CLASES_RESERVAR, nombre: 'Reservar Clases', modulo: 'Clases', descripcion: 'Inscribirse y anotarse en lista de espera' },
  { clave: PRESTACIONES.CLASES_ADMIN, nombre: 'Administrar Clases', modulo: 'Clases', descripcion: 'Alta, cancelación de clases y toma de asistencia' },

  // Acceso
  { clave: PRESTACIONES.ACCESO_MI_QR, nombre: 'Pase Digital (Mi QR)', modulo: 'Control Acceso', descripcion: 'Generación de QR dinámico de 60s para ingreso' },
  { clave: PRESTACIONES.ACCESO_ESCANEAR, nombre: 'Escanear / Validar', modulo: 'Control Acceso', descripcion: 'Operar molinete y validar accesos físicos' },
  { clave: PRESTACIONES.ACCESO_AFORO_VIEW, nombre: 'Control de Aforo', modulo: 'Control Acceso', descripcion: 'Monitorear personas en sede y registrar egresos' },

  // Usuarios
  { clave: PRESTACIONES.USUARIOS_ALTA_SOCIO, nombre: 'Alta de Socios', modulo: 'Usuarios', descripcion: 'Registrar nuevos clientes en mostrador' },
  { clave: PRESTACIONES.USUARIOS_ADMIN, nombre: 'Gestión de Personal', modulo: 'Usuarios', descripcion: 'Editar usuarios y nómina de empleados' },
  { clave: PRESTACIONES.ROLES_GESTIONAR, nombre: 'Gestionar Roles', modulo: 'Usuarios', descripcion: 'Crear y configurar niveles de acceso dinámicos' },

  // Pagos
  { clave: PRESTACIONES.PAGOS_COBRAR_MOSTRADOR, nombre: 'Cobros Mostrador', modulo: 'Pagos', descripcion: 'Registrar cobros en efectivo/tarjeta presencial' },
  { clave: PRESTACIONES.PAGOS_VER_HISTORIAL, nombre: 'Ver Historial Pagos', modulo: 'Pagos', descripcion: 'Consultar transacciones y comprobantes emitidos' },
];

/**
 * Prestaciones que el backend reserva al socio (`@PreAuthorize("hasRole('SOCIO')")`):
 * pase QR propio (GET /v1/usuarios/me/qr), reservas/lista de espera de clases y el
 * descuento de socio. El gerente no las tiene para que el menú no le ofrezca
 * pantallas que el backend le rechazaría con 403 (SCRUM-92).
 */
export const PRESTACIONES_EXCLUSIVAS_SOCIO: Prestacion[] = [
  PRESTACIONES.ACCESO_MI_QR,
  PRESTACIONES.CLASES_RESERVAR,
  PRESTACIONES.CANCHAS_DESCUENTO_SOCIO,
];

export const ROLES_BASE_SISTEMA: RolDTO[] = [
  {
    codigo: 'GERENTE',
    nombre: 'Gerente General',
    descripcion: 'Control total de operaciones, sedes, personal y políticas de acceso.',
    esSistema: true,
    prestaciones: Object.values(PRESTACIONES).filter(
      (p) => !PRESTACIONES_EXCLUSIVAS_SOCIO.includes(p)
    ),
  },
  {
    codigo: 'RECEPCIONISTA',
    nombre: 'Recepcionista',
    descripcion: 'Operador de sede: cobros, molinete, registro de socios y turnos.',
    esSistema: true,
    // Sin CANCHAS_ADMIN: el ABM de canchas es solo del GERENTE (SCRUM-91)
    prestaciones: [
      PRESTACIONES.CANCHAS_VER,
      PRESTACIONES.CLASES_VER,
      PRESTACIONES.CLASES_ADMIN,
      PRESTACIONES.ACCESO_ESCANEAR,
      PRESTACIONES.ACCESO_AFORO_VIEW,
      PRESTACIONES.USUARIOS_ALTA_SOCIO,
      PRESTACIONES.USUARIOS_ADMIN,
      PRESTACIONES.PAGOS_COBRAR_MOSTRADOR,
      PRESTACIONES.PAGOS_VER_HISTORIAL,
    ],
  },
  {
    codigo: 'SOCIO',
    nombre: 'Socio Activo',
    descripcion: 'Cliente con membresía vigente: reservas, pase digital y descuentos.',
    esSistema: true,
    prestaciones: [
      PRESTACIONES.CANCHAS_VER,
      PRESTACIONES.CANCHAS_DESCUENTO_SOCIO,
      PRESTACIONES.CLASES_VER,
      PRESTACIONES.CLASES_RESERVAR,
      PRESTACIONES.ACCESO_MI_QR,
      PRESTACIONES.PAGOS_VER_HISTORIAL,
    ],
  },
  {
    codigo: 'EXTERNO',
    nombre: 'Cliente Externo / Invitado',
    descripcion: 'Usuario no socio: consulta pública y checkout de canchas.',
    esSistema: true,
    // Sin clases: la agenda de M3 no admite EXTERNO. Pagos y comprobantes sí (SCRUM-91)
    prestaciones: [
      PRESTACIONES.CANCHAS_VER,
      PRESTACIONES.PAGOS_VER_HISTORIAL,
    ],
  },
];

/**
 * Roles del sistema. La matriz es fija y sigue los @PreAuthorize del backend: no hay roles
 * personalizados porque el backend solo reconoce los cuatro tipos de usuario.
 */
export function listarRoles(): RolDTO[] {
  return ROLES_BASE_SISTEMA;
}

export function obtenerRolPorCodigo(codigo: string): RolDTO | undefined {
  const norm = codigo.toUpperCase();
  return listarRoles().find((r) => r.codigo === norm);
}

export function obtenerPrestacionesPorRol(codigo: string): Prestacion[] {
  const rol = obtenerRolPorCodigo(codigo);
  return rol ? rol.prestaciones : [];
}
