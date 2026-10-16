import { httpClient } from './httpClient';
import type { MembresiaDTO } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────
const MOCK_MEMBRESIAS: MembresiaDTO[] = [
  {
    idMembresia: 1,
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
    plan: { idPlan: 1, nombre: 'Mensual', precioBase: 15000 },
    fechaInicio: '2026-09-01',
    fechaVencimiento: '2026-10-01',
    fechaCancelacion: null,
    estado: 'VENCIDO',
  },
  {
    idMembresia: 2,
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
    plan: { idPlan: 2, nombre: 'Trimestral', precioBase: 40000 },
    fechaInicio: '2026-08-01',
    fechaVencimiento: '2026-11-01',
    fechaCancelacion: null,
    estado: 'ACTIVO',
  },
];

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista todas las membresías de usuarios de una sede específica.
 */
export async function listarMembresias(idSede: number): Promise<MembresiaDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_MEMBRESIAS.filter((m) => m.usuario.idSede === idSede);
  }

  return httpClient.get<MembresiaDTO[]>(`/v1/membresias?idSede=${idSede}`);
}
