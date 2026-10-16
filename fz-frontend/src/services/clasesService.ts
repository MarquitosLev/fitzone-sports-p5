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
