import { httpClient } from './httpClient';
import type { CanchaDTO } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────
const MOCK_CANCHAS: CanchaDTO[] = [
  {
    idCancha: 1,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombre: 'Cancha 1 — Pádel',
    precioBaseHora: 8000,
    enMantenimiento: false,
  },
  {
    idCancha: 2,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombre: 'Cancha 2 — Fútbol 5',
    precioBaseHora: 12000,
    enMantenimiento: true,
  },
  {
    idCancha: 3,
    sede: { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
    nombre: 'Cancha A — Tenis',
    precioBaseHora: 10000,
    enMantenimiento: false,
  },
];

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista las canchas de una sede (incluyendo las que están en mantenimiento).
 */
export async function listarCanchas(idSede: number): Promise<CanchaDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_CANCHAS.filter((c) => c.sede.idSede === idSede);
  }

  return httpClient.get<CanchaDTO[]>(`/v1/canchas?idSede=${idSede}`);
}
