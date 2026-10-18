import { httpClient } from './httpClient';
import type { AccesoDTO, QrTokenDTO } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────
const MOCK_ACCESOS: AccesoDTO[] = [
  {
    idAcceso: 1,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-socio-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas.martinez@email.com',
      telefono: '11-4567-8901',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    reservaClaseId: 5,
    reservaCanchaId: null,
    fechaHoraIngreso: '2026-10-15T09:30:00',
    fechaHoraEgreso: '2026-10-15T11:00:00',
  },
  {
    idAcceso: 2,
    usuario: {
      idUsuario: 2,
      authId: 'uuid-socio-2',
      dni: '28456789',
      nombre: 'Valentina',
      apellido: 'García',
      email: 'vgarcia@email.com',
      telefono: '11-5432-1098',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    reservaClaseId: null,
    reservaCanchaId: 3,
    fechaHoraIngreso: '2026-10-15T14:00:00',
    fechaHoraEgreso: null,
  },
];

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista los registros de acceso físico de una sede.
 */
export async function listarAccesos(idSede: number): Promise<AccesoDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_ACCESOS.filter((a) => a.sede.idSede === idSede);
  }

  return httpClient.get<AccesoDTO[]>(`/v1/accesos?idSede=${idSede}`);
}

/**
 * Genera o consulta el token dinámico de acceso QR para el socio (SCRUM-85).
 * Simula la emisión de un token con rotación automática cada 60 segundos.
 */
export async function obtenerQrSocio(idUsuario: number): Promise<QrTokenDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const ahora = Date.now();
    const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      token: `FZ-QR-${idUsuario}-${ahora}-${hash}`,
      expiraEnSegundos: 60,
      generadoEn: new Date(ahora).toISOString(),
    };
  }

  return httpClient.get<QrTokenDTO>(`/v1/accesos/qr/${idUsuario}`);
}

