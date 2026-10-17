import { httpClient, AppError } from './httpClient';
import type { CanchaDTO, CanchaFormData, TipoCancha } from '../types';

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────
let MOCK_CANCHAS: CanchaDTO[] = [
  {
    idCancha: 1,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombre: 'Cancha 1 — Pádel',
    tipo: 'PADEL',
    precioBaseHora: 8000,
    enMantenimiento: false,
  },
  {
    idCancha: 2,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombre: 'Cancha 2 — Fútbol 5',
    tipo: 'FUTBOL_5',
    precioBaseHora: 12000,
    enMantenimiento: true,
  },
  {
    idCancha: 3,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombre: 'Cancha Central — Tenis',
    tipo: 'TENIS',
    precioBaseHora: 10000,
    enMantenimiento: false,
  },
  {
    idCancha: 4,
    sede: { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
    nombre: 'Cancha A — Tenis',
    tipo: 'TENIS',
    precioBaseHora: 10000,
    enMantenimiento: false,
  },
  {
    idCancha: 5,
    sede: { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
    nombre: 'Cancha Microestadio — Básquet',
    tipo: 'BASQUET',
    precioBaseHora: 14000,
    enMantenimiento: false,
  },
];

// Helper para detectar tipo si no estuviera explícito
export function inferirTipoCancha(nombre: string): TipoCancha {
  const norm = nombre.toLowerCase();
  if (norm.includes('pádel') || norm.includes('padel')) return 'PADEL';
  if (norm.includes('fútbol 5') || norm.includes('futbol 5')) return 'FUTBOL_5';
  if (norm.includes('fútbol 7') || norm.includes('futbol 7')) return 'FUTBOL_7';
  if (norm.includes('tenis')) return 'TENIS';
  if (norm.includes('básquet') || norm.includes('basquet') || norm.includes('basket')) return 'BASQUET';
  return 'OTRO';
}

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista las canchas de una sede (incluyendo las que están en mantenimiento).
 */
export async function listarCanchas(idSede: number): Promise<CanchaDTO[]> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_CANCHAS.filter((c) => c.sede.idSede === idSede).map((c) => ({
      ...c,
      tipo: c.tipo ?? inferirTipoCancha(c.nombre),
    }));
  }

  const data = await httpClient.get<CanchaDTO[]>(`/v1/canchas?idSede=${idSede}`);
  return data.map((c) => ({
    ...c,
    tipo: c.tipo ?? inferirTipoCancha(c.nombre),
  }));
}

/**
 * Crea una nueva cancha en la sede activa.
 */
export async function crearCancha(
  idSede: number,
  datos: CanchaFormData,
  nombreSede = 'Sede Activa'
): Promise<CanchaDTO> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Validación mock de conflicto de nombre en la misma sede
    const existe = MOCK_CANCHAS.some(
      (c) => c.sede.idSede === idSede && c.nombre.trim().toLowerCase() === datos.nombre.trim().toLowerCase()
    );
    if (existe) {
      throw new AppError('Ya existe una cancha con ese nombre en la sede seleccionada', 409, {
        codigo: 'CONFLICTO',
        mensaje: 'Ya existe una cancha con ese nombre en la sede seleccionada',
        timestamp: new Date().toISOString(),
      });
    }

    const maxId = MOCK_CANCHAS.reduce((max, c) => Math.max(max, c.idCancha), 0);
    const nuevaCancha: CanchaDTO = {
      idCancha: maxId + 1,
      sede: { idSede, nombre: nombreSede, aforoMaximo: 80 },
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      precioBaseHora: Number(datos.precioBaseHora),
      enMantenimiento: Boolean(datos.enMantenimiento),
    };

    MOCK_CANCHAS.push(nuevaCancha);
    return nuevaCancha;
  }

  return httpClient.post<CanchaDTO>('/v1/canchas', {
    body: JSON.stringify({
      idSede,
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      precioBaseHora: Number(datos.precioBaseHora),
      enMantenimiento: Boolean(datos.enMantenimiento),
    }),
  });
}

/**
 * Actualiza nombre, tipo o precio base de una cancha existente.
 */
export async function actualizarCancha(
  idCancha: number,
  datos: CanchaFormData
): Promise<CanchaDTO> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = MOCK_CANCHAS.findIndex((c) => c.idCancha === idCancha);
    if (index === -1) {
      throw new AppError('Cancha no encontrada', 404, {
        codigo: 'RECURSO_NO_ENCONTRADO',
        mensaje: 'Cancha no encontrada',
        timestamp: new Date().toISOString(),
      });
    }

    const actual = MOCK_CANCHAS[index];
    const conflicto = MOCK_CANCHAS.some(
      (c) =>
        c.sede.idSede === actual.sede.idSede &&
        c.idCancha !== idCancha &&
        c.nombre.trim().toLowerCase() === datos.nombre.trim().toLowerCase()
    );
    if (conflicto) {
      throw new AppError('Ya existe otra cancha con ese nombre en la sede', 409, {
        codigo: 'CONFLICTO',
        mensaje: 'Ya existe otra cancha con ese nombre en la sede',
        timestamp: new Date().toISOString(),
      });
    }

    const actualizada: CanchaDTO = {
      ...actual,
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      precioBaseHora: Number(datos.precioBaseHora),
      enMantenimiento:
        datos.enMantenimiento !== undefined ? datos.enMantenimiento : actual.enMantenimiento,
    };

    MOCK_CANCHAS[index] = actualizada;
    return actualizada;
  }

  return httpClient.put<CanchaDTO>(`/v1/canchas/${idCancha}`, {
    body: JSON.stringify({
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      precioBaseHora: Number(datos.precioBaseHora),
      enMantenimiento: datos.enMantenimiento,
    }),
  });
}

/**
 * Cambia el estado de mantenimiento de una cancha.
 * RF-12: Permite al gerente marcar en mantenimiento / disponible.
 */
export async function cambiarMantenimiento(
  idCancha: number,
  enMantenimiento: boolean
): Promise<CanchaDTO> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const index = MOCK_CANCHAS.findIndex((c) => c.idCancha === idCancha);
    if (index === -1) {
      throw new AppError('Cancha no encontrada', 404, {
        codigo: 'RECURSO_NO_ENCONTRADO',
        mensaje: 'Cancha no encontrada',
        timestamp: new Date().toISOString(),
      });
    }

    const actualizada: CanchaDTO = {
      ...MOCK_CANCHAS[index],
      enMantenimiento,
    };
    MOCK_CANCHAS[index] = actualizada;
    return actualizada;
  }

  return httpClient.patch<CanchaDTO>(`/v1/canchas/${idCancha}/mantenimiento`, {
    body: JSON.stringify({ enMantenimiento }),
  });
}
