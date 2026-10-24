import { httpClient, AppError } from './httpClient';
import type { MembresiaDTO, PlanDTO, EstadoMembresia, MembresiaFormData, UsuarioDTO } from '../types';
import { USE_MOCK } from '../config';

// ─── CATÁLOGO DE PLANES MOCK ──────────────────────────────────────────────────
export const MOCK_PLANES: PlanDTO[] = [
  {
    idPlan: 1,
    nombre: 'Plan Mensual',
    precioBase: 15000,
    duracionMeses: 1,
    descripcion: 'Acceso total a sala de musculación, cardio y vestuarios en tu sede activa.',
    beneficios: [
      'Musculación y peso libre',
      'Zona cardiovascular',
      'Vestuarios con duchas y lockers diarios',
      'App móvil FitZone y seguimiento de rutinas',
    ],
    destacado: false,
  },
  {
    idPlan: 2,
    nombre: 'Plan Trimestral',
    precioBase: 40000,
    duracionMeses: 3,
    descripcion: 'Pase multi-sede con ahorro del 11% y 2 clases grupales semanales.',
    beneficios: [
      'Acceso a todas las sedes de la red',
      'Musculación y cardio ilimitado',
      '2 clases grupales semanales (Spinning, Yoga, Pilates)',
      'Evaluación física trimestral con deportólogo',
    ],
    destacado: true,
  },
  {
    idPlan: 3,
    nombre: 'Plan Anual VIP',
    precioBase: 140000,
    duracionMeses: 12,
    descripcion: 'Pase libre total sin restricciones con cuota congelada y locker bonificado.',
    beneficios: [
      'Acceso libre 24/7 en todas las sedes',
      'Todas las clases grupales sin tope semanal',
      'Locker exclusivo bonificado durante el año',
      'Pase de invitado mensual para entrenar con amigos',
    ],
    destacado: false,
  },
];

// ─── USUARIOS MOCK DE REFERENCIA ──────────────────────────────────────────────
const MOCK_USUARIOS_MEMBRESIA: Record<number, UsuarioDTO> = {
  1: {
    idUsuario: 1,
    authId: 'uuid-socio-1',
    dni: '30123456',
    nombre: 'Lucas',
    apellido: 'Martínez',
    email: 'lucas.martinez@email.com',
    telefono: '11-4567-8901',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  2: {
    idUsuario: 2,
    authId: 'uuid-socio-2',
    dni: '28456789',
    nombre: 'Valentina',
    apellido: 'García',
    email: 'vgarcia@email.com',
    telefono: '11-5432-1098',
    fotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  6: {
    idUsuario: 6,
    authId: 'uuid-socio-3',
    dni: '32845761',
    nombre: 'Mateo',
    apellido: 'Fernández',
    email: 'mateo.f@email.com',
    telefono: '11-8765-4321',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  7: {
    idUsuario: 7,
    authId: null,
    dni: '39123890',
    nombre: 'Camila',
    apellido: 'Torres',
    email: 'camila.torres@email.com',
    telefono: '11-1234-5678',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
};

// ─── DATOS MOCK DE MEMBRESÍAS ────────────────────────────────────────────────
let MOCK_MEMBRESIAS: MembresiaDTO[] = [
  {
    idMembresia: 1,
    usuario: MOCK_USUARIOS_MEMBRESIA[1],
    plan: MOCK_PLANES[0], // Mensual
    fechaInicio: '2026-09-01',
    fechaVencimiento: '2026-10-01',
    fechaCancelacion: null,
    estado: 'VENCIDO',
  },
  {
    idMembresia: 2,
    usuario: MOCK_USUARIOS_MEMBRESIA[2],
    plan: MOCK_PLANES[1], // Trimestral
    fechaInicio: '2026-08-15',
    fechaVencimiento: '2026-11-15',
    fechaCancelacion: null,
    estado: 'ACTIVO',
  },
  {
    idMembresia: 3,
    usuario: MOCK_USUARIOS_MEMBRESIA[6],
    plan: MOCK_PLANES[0], // Mensual — Vence en 4 días (para testear alerta < 7 días)
    fechaInicio: '2026-09-21',
    fechaVencimiento: '2026-10-21',
    fechaCancelacion: null,
    estado: 'ACTIVO',
  },
  {
    idMembresia: 4,
    usuario: MOCK_USUARIOS_MEMBRESIA[7],
    plan: MOCK_PLANES[1],
    fechaInicio: '2026-07-01',
    fechaVencimiento: '2026-10-31',
    fechaCancelacion: null,
    estado: 'SUSPENDIDO',
  },
];

// Helper para sumar meses a una fecha ISO (YYYY-MM-DD)
function sumarMesesAFechaIso(fechaIso: string, meses: number): string {
  const [year, month, day] = fechaIso.split('-').map(Number);
  const date = new Date(year, month - 1 + meses, day);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Obtiene el catálogo de planes tarifarios disponibles.
 */
export async function listarPlanes(): Promise<PlanDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...MOCK_PLANES];
  }
  return httpClient.get<PlanDTO[]>('/v1/planes');
}

/**
 * Lista todas las membresías registradas.
 */
export async function listarMembresias(idSede?: number): Promise<MembresiaDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (idSede === undefined || idSede === null) {
      return [...MOCK_MEMBRESIAS];
    }
    return MOCK_MEMBRESIAS.filter((m) => m.usuario.idSede === idSede);
  }

  return httpClient.get<MembresiaDTO[]>('/v1/membresias');
}

/**
 * Obtiene una membresía por su ID.
 */
export async function obtenerMembresiaPorId(idMembresia: number): Promise<MembresiaDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const encontrada = MOCK_MEMBRESIAS.find((m) => m.idMembresia === idMembresia);
    if (!encontrada) {
      throw new AppError(`Membresía con ID ${idMembresia} no encontrada`, 404);
    }
    return { ...encontrada };
  }
  return httpClient.get<MembresiaDTO>(`/v1/membresias/${idMembresia}`);
}

/**
 * Obtiene la membresía activa o más reciente asociada a un usuario específico.
 */
export async function obtenerMembresiaPorUsuario(idUsuario: number): Promise<MembresiaDTO | null> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const membresiasUsuario = MOCK_MEMBRESIAS.filter((m) => m.usuario.idUsuario === idUsuario);
    if (membresiasUsuario.length === 0) return null;
    // Retornamos la más reciente según ID o fecha
    return { ...membresiasUsuario[membresiasUsuario.length - 1] };
  }
  try {
    return await httpClient.get<MembresiaDTO>(`/v1/usuarios/${idUsuario}/membresia`);
  } catch (err: unknown) {
    if (err instanceof AppError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Da de alta o asocia una membresía a un socio.
 */
export async function crearMembresia(datos: MembresiaFormData): Promise<MembresiaDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const plan = MOCK_PLANES.find((p) => p.idPlan === datos.idPlan) || MOCK_PLANES[0];
    const usuario = MOCK_USUARIOS_MEMBRESIA[datos.idUsuario] || {
      idUsuario: datos.idUsuario,
      authId: null,
      dni: '12345678',
      nombre: 'Socio',
      apellido: 'Registrado',
      email: 'socio@fitzone.com',
      telefono: '11-0000-0000',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    };

    const hoy = new Date().toISOString().split('T')[0];
    const fechaInicio = datos.fechaInicio || hoy;
    const duracion = plan.duracionMeses || 1;
    const fechaVencimiento = sumarMesesAFechaIso(fechaInicio, duracion);

    const nextId = Math.max(0, ...MOCK_MEMBRESIAS.map((m) => m.idMembresia)) + 1;
    const nueva: MembresiaDTO = {
      idMembresia: nextId,
      usuario,
      plan,
      fechaInicio,
      fechaVencimiento,
      fechaCancelacion: null,
      estado: 'ACTIVO',
    };

    // Si ya tenía membresía previa, actualizamos la lista
    MOCK_MEMBRESIAS = MOCK_MEMBRESIAS.filter((m) => m.usuario.idUsuario !== datos.idUsuario);
    MOCK_MEMBRESIAS.push(nueva);
    return { ...nueva };
  }

  return httpClient.post<MembresiaDTO>('/v1/membresias', {
    body: JSON.stringify(datos),
  });
}

/**
 * Renueva una membresía existente (RF-02).
 * Si estaba vencida, reinicia desde hoy; si estaba activa, extiende desde la fecha de vencimiento.
 */
export async function renovarMembresia(idMembresia: number, idPlan?: number): Promise<MembresiaDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const index = MOCK_MEMBRESIAS.findIndex((m) => m.idMembresia === idMembresia);
    if (index === -1) {
      throw new AppError(`Membresía con ID ${idMembresia} no encontrada`, 404);
    }

    const actual = MOCK_MEMBRESIAS[index];
    const plan = idPlan
      ? MOCK_PLANES.find((p) => p.idPlan === idPlan) || actual.plan
      : actual.plan;

    const hoy = new Date().toISOString().split('T')[0];
    const duracion = plan.duracionMeses || 1;

    // Si está activa y aún no venció, extendemos desde la fecha de vencimiento actual
    const fechaBase =
      actual.estado === 'ACTIVO' && actual.fechaVencimiento > hoy
        ? actual.fechaVencimiento
        : hoy;

    const fechaVencimiento = sumarMesesAFechaIso(fechaBase, duracion);

    const renovada: MembresiaDTO = {
      ...actual,
      plan,
      fechaInicio: actual.estado === 'ACTIVO' ? actual.fechaInicio : hoy,
      fechaVencimiento,
      fechaCancelacion: null,
      estado: 'ACTIVO',
    };

    MOCK_MEMBRESIAS[index] = renovada;
    return { ...renovada };
  }

  return httpClient.post<MembresiaDTO>(`/v1/membresias/${idMembresia}/renovar`, {
    body: JSON.stringify(idPlan ? { idPlan } : {}),
  });
}

/**
 * Cambia el estado de una membresía (ACTIVO, SUSPENDIDO, CANCELADO).
 */
export async function cambiarEstadoMembresia(
  idMembresia: number,
  nuevoEstado: EstadoMembresia
): Promise<MembresiaDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = MOCK_MEMBRESIAS.findIndex((m) => m.idMembresia === idMembresia);
    if (index === -1) {
      throw new AppError(`Membresía con ID ${idMembresia} no encontrada`, 404);
    }

    const actual = MOCK_MEMBRESIAS[index];
    const hoy = new Date().toISOString().split('T')[0];

    const actualizada: MembresiaDTO = {
      ...actual,
      estado: nuevoEstado,
      fechaCancelacion: nuevoEstado === 'CANCELADO' ? hoy : actual.fechaCancelacion,
    };

    MOCK_MEMBRESIAS[index] = actualizada;
    return { ...actualizada };
  }

  return httpClient.patch<MembresiaDTO>(`/v1/membresias/${idMembresia}/estado`, {
    body: JSON.stringify({ estado: nuevoEstado }),
  });
}

/**
 * Restablece los datos mock a su estado inicial (útil para pruebas).
 */
export function resetMockMembresias(): void {
  MOCK_MEMBRESIAS = [
    {
      idMembresia: 1,
      usuario: MOCK_USUARIOS_MEMBRESIA[1],
      plan: MOCK_PLANES[0],
      fechaInicio: '2026-09-01',
      fechaVencimiento: '2026-10-01',
      fechaCancelacion: null,
      estado: 'VENCIDO',
    },
    {
      idMembresia: 2,
      usuario: MOCK_USUARIOS_MEMBRESIA[2],
      plan: MOCK_PLANES[1],
      fechaInicio: '2026-08-15',
      fechaVencimiento: '2026-11-15',
      fechaCancelacion: null,
      estado: 'ACTIVO',
    },
    {
      idMembresia: 3,
      usuario: MOCK_USUARIOS_MEMBRESIA[6],
      plan: MOCK_PLANES[0],
      fechaInicio: '2026-09-21',
      fechaVencimiento: '2026-10-21',
      fechaCancelacion: null,
      estado: 'ACTIVO',
    },
    {
      idMembresia: 4,
      usuario: MOCK_USUARIOS_MEMBRESIA[7],
      plan: MOCK_PLANES[1],
      fechaInicio: '2026-07-01',
      fechaVencimiento: '2026-10-31',
      fechaCancelacion: null,
      estado: 'SUSPENDIDO',
    },
  ];
}
