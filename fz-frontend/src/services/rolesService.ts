import { PRESTACIONES } from '../types/rol';
import type { Prestacion, RolDTO, CrearRolDTO, MetadataPrestacion } from '../types/rol';

export const CATALOGO_PRESTACIONES: MetadataPrestacion[] = [
  // Canchas
  { clave: PRESTACIONES.CANCHAS_VER, nombre: 'Ver Canchas', modulo: 'Canchas', descripcion: 'Visualizar canchas y turnos disponibles' },
  { clave: PRESTACIONES.CANCHAS_ADMIN, nombre: 'Administrar Canchas', modulo: 'Canchas', descripcion: 'Crear, editar canchas y modificar tarifas' },
  { clave: PRESTACIONES.CANCHAS_DESCUENTO_SOCIO, nombre: 'Descuento Socio', modulo: 'Canchas', descripcion: 'Aplicación automática del 15% de descuento en reservas' },

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

export const ROLES_BASE_SISTEMA: RolDTO[] = [
  {
    codigo: 'GERENTE',
    nombre: 'Gerente General',
    descripcion: 'Control total de operaciones, sedes, personal y políticas de acceso.',
    esSistema: true,
    prestaciones: Object.values(PRESTACIONES),
  },
  {
    codigo: 'RECEPCIONISTA',
    nombre: 'Recepcionista',
    descripcion: 'Operador de sede: cobros, molinete, registro de socios y turnos.',
    esSistema: true,
    prestaciones: [
      PRESTACIONES.CANCHAS_VER,
      PRESTACIONES.CANCHAS_ADMIN,
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
    prestaciones: [
      PRESTACIONES.CANCHAS_VER,
      PRESTACIONES.CLASES_VER,
    ],
  },
];

const STORAGE_KEY_ROLES = 'fitzone_custom_roles';

function cargarRolesPersonalizados(): RolDTO[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROLES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarRolesPersonalizados(roles: RolDTO[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
  } catch {
    // Si falla el almacenamiento, continúa en memoria
  }
}

export function listarRoles(): RolDTO[] {
  return [...ROLES_BASE_SISTEMA, ...cargarRolesPersonalizados()];
}

export function obtenerRolPorCodigo(codigo: string): RolDTO | undefined {
  const norm = codigo.toUpperCase();
  return listarRoles().find((r) => r.codigo === norm);
}

export function obtenerPrestacionesPorRol(codigo: string): Prestacion[] {
  const rol = obtenerRolPorCodigo(codigo);
  return rol ? rol.prestaciones : [];
}

export function crearRolPersonalizado(datos: CrearRolDTO): RolDTO {
  const codigo = datos.codigo.trim().toUpperCase().replace(/\s+/g, '_');
  const existentes = listarRoles();
  if (existentes.some((r) => r.codigo === codigo)) {
    throw new Error(`Ya existe un rol con el código "${codigo}".`);
  }

  const nuevoRol: RolDTO = {
    codigo,
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    esSistema: false,
    prestaciones: datos.prestaciones,
  };

  const personalizados = cargarRolesPersonalizados();
  personalizados.push(nuevoRol);
  guardarRolesPersonalizados(personalizados);
  return nuevoRol;
}

export function eliminarRolPersonalizado(codigo: string): void {
  const norm = codigo.toUpperCase();
  const personalizados = cargarRolesPersonalizados().filter((r) => r.codigo !== norm);
  guardarRolesPersonalizados(personalizados);
}
