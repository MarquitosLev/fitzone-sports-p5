import { httpClient } from './httpClient';
import type { ClaseGrupalDTO } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────
const MOCK_CLASES: ClaseGrupalDTO[] = [
  {
    idClase: 1,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombreActividad: 'Spinning',
    fechaHoraInicio: '2026-10-16T08:00:00',
    duracionMinutos: 60,
    cupoMaximo: 20,
    cupoDisponible: 5,
  },
  {
    idClase: 2,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombreActividad: 'Yoga',
    fechaHoraInicio: '2026-10-16T10:00:00',
    duracionMinutos: 75,
    cupoMaximo: 15,
    cupoDisponible: 0,
  },
  {
    idClase: 3,
    sede: { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
    nombreActividad: 'CrossFit',
    fechaHoraInicio: '2026-10-16T07:00:00',
    duracionMinutos: 50,
    cupoMaximo: 12,
    cupoDisponible: 3,
  },
];

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista las clases grupales programadas para una sede.
 */
export async function listarClases(idSede: number): Promise<ClaseGrupalDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_CLASES.filter((c) => c.sede.idSede === idSede);
  }

  return httpClient.get<ClaseGrupalDTO[]>(`/v1/clases?idSede=${idSede}`);
}

// ─── CRUD FUNCTIONS ───────────────────────────────────────────────────────
export async function crearClase(nuevaClase: Omit<ClaseGrupalDTO, 'idClase'>): Promise<ClaseGrupalDTO> {
  if (USE_MOCK) {
    const newId = Math.max(...MOCK_CLASES.map(c => c.idClase)) + 1;
    const claseConId = { idClase: newId, ...nuevaClase } as ClaseGrupalDTO;
    MOCK_CLASES.push(claseConId);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return claseConId;
  }
  return httpClient.post<ClaseGrupalDTO>('/v1/clases', {
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
  return httpClient.put<ClaseGrupalDTO>(`/v1/clases/${claseActualizada.idClase}`, {
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
  await httpClient.delete<void>(`/v1/clases/${idClase}`);
}

