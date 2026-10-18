/**
 * clasesService.ts — Capa de servicios HTTP del módulo Clases Grupales.
 *
 * Organización:
 * 1. CLASES_ENDPOINTS — rutas REST bajo /v1/clases (facilita ajuste cuando
 *    los PRs SCRUM-72 y SCRUM-74 del backend hagan merge).
 * 2. Datos mock en memoria con fechas dinámicas relativas a new Date().
 * 3. Funciones para la vista ADMIN (CRUD de clases ya existente).
 * 4. Funciones para la vista SOCIO (reservar, espera, cancelar) — SCRUM-83.
 */

import { httpClient } from './httpClient';
import type { ClaseGrupalDTO, ReservaClaseDTO, ListaEsperaDTO } from '../types';
import { toLocalISOString } from '../utils/formatters';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── 1. CONSTANTE DE ENDPOINTS (ajustar aquí cuando el backend haga merge) ──
export const CLASES_ENDPOINTS = {
  listarClases:    (idSede: number) => `/v1/clases?idSede=${idSede}`,
  crearClase:      () => '/v1/clases',
  actualizarClase: (id: number) => `/v1/clases/${id}`,
  eliminarClase:   (id: number) => `/v1/clases/${id}`,
  // Endpoints de SOCIO (SCRUM-72 / SCRUM-74 — pendientes de merge)
  reservas:        (idUsuario: number) => `/v1/clases/reservas?idUsuario=${idUsuario}`,
  reservar:        () => '/v1/clases/reservas',
  cancelarReserva: (idReservaClase: number) => `/v1/clases/reservas/${idReservaClase}/cancelar`,
  espera:          (idUsuario: number) => `/v1/clases/espera?idUsuario=${idUsuario}`,
  anotarseEnEspera: () => '/v1/clases/espera',
  salirDeEspera:   (idEspera: number) => `/v1/clases/espera/${idEspera}`,
} as const;

// ─── 2. DATOS MOCK ───────────────────────────────────────────────────────────
// Referencia de sedes y usuarios mock (alineados con membresiasService.ts)
const MOCK_SEDE_PALERMO = { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 };
const MOCK_SEDE_BELGRANO = { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 };

// Socio mock por defecto: Valentina García (idUsuario: 2, membresía ACTIVO)
// Alineado con la constante usada en ClasesPage y con membresiasService.ts
const MOCK_SOCIO = {
  idUsuario: 2,
  authId: 'uuid-socio-2',
  dni: '28456789',
  nombre: 'Valentina',
  apellido: 'García',
  email: 'vgarcia@email.com',
  telefono: '11-5432-1098',
  fotoUrl: null,
  tipoUsuario: 'SOCIO' as const,
  idSede: 1,
};

/**
 * Genera fechas dinámicas relativas a la hora actual para que los mocks
 * siempre tengan clases en los distintos escenarios de prueba.
 * Usa toLocalISOString para que el string generado represente la hora local real
 * y no se desfase por conversiones UTC.
 */
function addHours(date: Date, hours: number): string {
  const d = new Date(date.getTime() + hours * 60 * 60 * 1000);
  return toLocalISOString(d);
}

const ahora = new Date();

// Clases con fechas dinámicas para siempre tener datos útiles en la UI:
const MOCK_CLASES: ClaseGrupalDTO[] = [
  {
    idClase: 1,
    sede: MOCK_SEDE_PALERMO,
    nombreActividad: 'Spinning',
    // 20 hs en el futuro → dentro de la ventana de 48 hs
    fechaHoraInicio: addHours(ahora, 20),
    duracionMinutos: 60,
    cupoMaximo: 20,
    cupoDisponible: 5,
  },
  {
    idClase: 2,
    sede: MOCK_SEDE_PALERMO,
    nombreActividad: 'Yoga',
    // 36 hs en el futuro → dentro de 48 hs, pero SIN cupo (para testear lista de espera)
    fechaHoraInicio: addHours(ahora, 36),
    duracionMinutos: 75,
    cupoMaximo: 15,
    cupoDisponible: 0,
  },
  {
    idClase: 3,
    sede: MOCK_SEDE_PALERMO,
    nombreActividad: 'CrossFit',
    // 72 hs en el futuro → fuera de ventana de 48 hs
    fechaHoraInicio: addHours(ahora, 72),
    duracionMinutos: 50,
    cupoMaximo: 12,
    cupoDisponible: 3,
  },
  {
    idClase: 4,
    sede: MOCK_SEDE_PALERMO,
    nombreActividad: 'Pilates',
    // 10 hs en el futuro → dentro de 48 hs, cupo lleno (para testear espera)
    fechaHoraInicio: addHours(ahora, 10),
    duracionMinutos: 60,
    cupoMaximo: 10,
    cupoDisponible: 0,
  },
  {
    idClase: 5,
    sede: MOCK_SEDE_PALERMO,
    nombreActividad: 'Boxeo',
    // 40 hs en el futuro → dentro de 48 hs, con cupo
    fechaHoraInicio: addHours(ahora, 40),
    duracionMinutos: 60,
    cupoMaximo: 12,
    cupoDisponible: 7,
  },
  {
    idClase: 6,
    sede: MOCK_SEDE_BELGRANO,
    nombreActividad: 'Funcional',
    fechaHoraInicio: addHours(ahora, 25),
    duracionMinutos: 45,
    cupoMaximo: 15,
    cupoDisponible: 8,
  },
];

// Reservas del socio mock (estado inicial)
const MOCK_RESERVAS: ReservaClaseDTO[] = [
  {
    idReservaClase: 101,
    clase: MOCK_CLASES[0], // Spinning (20 hs en el futuro → cancelable)
    usuario: MOCK_SOCIO,
    estado: 'CONFIRMADA',
  },
  {
    idReservaClase: 102,
    // Clase dentro de 1.5 hs → dentro del corte de 2 hs (no cancelable)
    clase: {
      ...MOCK_CLASES[0],
      idClase: 99,
      nombreActividad: 'Funcional Avanzado',
      fechaHoraInicio: addHours(ahora, 1.5),
    },
    usuario: MOCK_SOCIO,
    estado: 'CONFIRMADA',
  },
  {
    idReservaClase: 103,
    clase: {
      ...MOCK_CLASES[0],
      idClase: 98,
      nombreActividad: 'Pilates (cancelada)',
      fechaHoraInicio: addHours(ahora, -2), // ya pasó
    },
    usuario: MOCK_SOCIO,
    estado: 'CANCELADA',
  },
];

// Lista de espera del socio mock
const MOCK_ESPERA: ListaEsperaDTO[] = [
  {
    idEspera: 201,
    clase: MOCK_CLASES[1], // Yoga sin cupo
    usuario: MOCK_SOCIO,
    ordenPosicion: 3,
  },
];

// ─── Contador para IDs de nuevas reservas/espera ────────────────────────────
let nextReservaId = 200;
let nextEsperaId = 300;

// ─── 3. FUNCIONES ADMIN (CRUD de clases — RF-06) ────────────────────────────

/**
 * Lista las clases grupales programadas para una sede.
 */
export async function listarClases(idSede: number): Promise<ClaseGrupalDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_CLASES.filter((c) => c.sede.idSede === idSede);
  }
  return httpClient.get<ClaseGrupalDTO[]>(CLASES_ENDPOINTS.listarClases(idSede));
}

export async function crearClase(nuevaClase: Omit<ClaseGrupalDTO, 'idClase'>): Promise<ClaseGrupalDTO> {
  if (USE_MOCK) {
    const newId = Math.max(...MOCK_CLASES.map(c => c.idClase)) + 1;
    const claseConId = { idClase: newId, ...nuevaClase } as ClaseGrupalDTO;
    MOCK_CLASES.push(claseConId);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return claseConId;
  }
  return httpClient.post<ClaseGrupalDTO>(CLASES_ENDPOINTS.crearClase(), {
    body: JSON.stringify(nuevaClase),
  });
}

export async function actualizarClase(claseActualizada: ClaseGrupalDTO): Promise<ClaseGrupalDTO> {
  if (USE_MOCK) {
    const index = MOCK_CLASES.findIndex(c => c.idClase === claseActualizada.idClase);
    if (index === -1) throw new Error('Clase no encontrada');
    const occupied = MOCK_CLASES[index].cupoMaximo - MOCK_CLASES[index].cupoDisponible;
    if (claseActualizada.cupoMaximo < occupied) {
      throw new Error('El cupo máximo no puede ser menor al número de reservas ya confirmadas');
    }
    MOCK_CLASES[index] = { ...MOCK_CLASES[index], ...claseActualizada };
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_CLASES[index];
  }
  return httpClient.put<ClaseGrupalDTO>(CLASES_ENDPOINTS.actualizarClase(claseActualizada.idClase), {
    body: JSON.stringify(claseActualizada),
  });
}

export async function eliminarClase(idClase: number): Promise<void> {
  if (USE_MOCK) {
    const index = MOCK_CLASES.findIndex(c => c.idClase === idClase);
    if (index === -1) throw new Error('Clase no encontrada');
    MOCK_CLASES.splice(index, 1);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return;
  }
  await httpClient.delete<void>(CLASES_ENDPOINTS.eliminarClase(idClase));
}

// ─── 4. FUNCIONES SOCIO (SCRUM-83) ──────────────────────────────────────────

/**
 * Lista las reservas de clases del socio.
 * En modo mock, devuelve las reservas del array en memoria.
 */
export async function listarReservasSocio(idUsuario: number): Promise<ReservaClaseDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_RESERVAS.filter((r) => r.usuario.idUsuario === idUsuario);
  }
  return httpClient.get<ReservaClaseDTO[]>(CLASES_ENDPOINTS.reservas(idUsuario));
}

/**
 * Lista las entradas en lista de espera del socio.
 */
export async function listarEsperaSocio(idUsuario: number): Promise<ListaEsperaDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_ESPERA.filter((e) => e.usuario.idUsuario === idUsuario);
  }
  return httpClient.get<ListaEsperaDTO[]>(CLASES_ENDPOINTS.espera(idUsuario));
}

/**
 * Reserva una clase para el socio.
 * En modo mock: descuenta cupoDisponible y agrega una ReservaClaseDTO con estado CONFIRMADA.
 */
export async function reservarClase(idClase: number, idUsuario: number): Promise<ReservaClaseDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const claseIdx = MOCK_CLASES.findIndex((c) => c.idClase === idClase);
    if (claseIdx === -1) throw new Error('Clase no encontrada');
    const clase = MOCK_CLASES[claseIdx];
    if (clase.cupoDisponible <= 0) {
      throw new Error('La clase ya no tiene cupos disponibles');
    }
    // Simulamos que el backend descuenta el cupo
    MOCK_CLASES[claseIdx] = { ...clase, cupoDisponible: clase.cupoDisponible - 1 };
    const nueva: ReservaClaseDTO = {
      idReservaClase: ++nextReservaId,
      clase: MOCK_CLASES[claseIdx],
      usuario: MOCK_SOCIO,
      estado: 'CONFIRMADA',
    };
    MOCK_RESERVAS.push(nueva);
    return nueva;
  }
  return httpClient.post<ReservaClaseDTO>(CLASES_ENDPOINTS.reservar(), {
    body: JSON.stringify({ idClase, idUsuario }),
  });
}

/**
 * Anota al socio en la lista de espera de una clase.
 * En modo mock: calcula el ordenPosicion y agrega una ListaEsperaDTO.
 */
export async function anotarseEnEspera(idClase: number, idUsuario: number): Promise<ListaEsperaDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const clase = MOCK_CLASES.find((c) => c.idClase === idClase);
    if (!clase) throw new Error('Clase no encontrada');
    // Calcula la próxima posición en la cola para esta clase
    const enEsperaParaEstaClase = MOCK_ESPERA.filter((e) => e.clase.idClase === idClase);
    const ordenPosicion = enEsperaParaEstaClase.length + 1;
    const nueva: ListaEsperaDTO = {
      idEspera: ++nextEsperaId,
      clase,
      usuario: MOCK_SOCIO,
      ordenPosicion,
    };
    MOCK_ESPERA.push(nueva);
    return nueva;
  }
  return httpClient.post<ListaEsperaDTO>(CLASES_ENDPOINTS.anotarseEnEspera(), {
    body: JSON.stringify({ idClase, idUsuario }),
  });
}

/**
 * Cancela la reserva de clase de un socio.
 * En modo mock: cambia el estado a CANCELADA y libera el cupo en la clase.
 */
export async function cancelarReservaClase(idReservaClase: number): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const reservaIdx = MOCK_RESERVAS.findIndex((r) => r.idReservaClase === idReservaClase);
    if (reservaIdx === -1) throw new Error('Reserva no encontrada');
    const reserva = MOCK_RESERVAS[reservaIdx];
    if (reserva.estado !== 'CONFIRMADA') {
      throw new Error('Solo se pueden cancelar reservas en estado CONFIRMADA');
    }
    // Simulamos que el backend cambia el estado y libera el cupo
    MOCK_RESERVAS[reservaIdx] = { ...reserva, estado: 'CANCELADA' };
    const claseIdx = MOCK_CLASES.findIndex((c) => c.idClase === reserva.clase.idClase);
    if (claseIdx !== -1) {
      MOCK_CLASES[claseIdx] = {
        ...MOCK_CLASES[claseIdx],
        cupoDisponible: MOCK_CLASES[claseIdx].cupoDisponible + 1,
      };
    }
    return;
  }
  await httpClient.put<void>(CLASES_ENDPOINTS.cancelarReserva(idReservaClase), {});
}
