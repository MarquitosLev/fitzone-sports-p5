/**
 * usuariosService.ts — Servicio del módulo Usuarios.
 *
 * Patrón de arquitectura usado:
 *   Page → Hook → Service → httpClient (o mock)
 *
 * El flag VITE_USE_MOCK=true hace que se devuelvan datos hardcodeados
 * en vez de llamar al backend. Cambiando el flag a false en .env,
 * el mismo código llama a la API real sin modificar nada más.
 */

import { httpClient } from './httpClient';
import type { UsuarioDTO } from '../types';

// Leemos el flag de entorno. En Vite, import.meta.env.VITE_USE_MOCK es un string.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── DATOS MOCK ──────────────────────────────────────────────────────────────
// Estos datos simulan lo que devolvería el backend.
// Al integrarse con la API real, se eliminan estos arrays.
const MOCK_USUARIOS: UsuarioDTO[] = [
  {
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
  {
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
  {
    idUsuario: 3,
    authId: null,
    dni: '35789012',
    nombre: 'Martín',
    apellido: 'López',
    email: 'mlopez@email.com',
    telefono: '11-6789-0123',
    fotoUrl: null,
    tipoUsuario: 'EXTERNO',
    idSede: 2,
  },
  {
    idUsuario: 4,
    authId: 'uuid-recep-1',
    dni: '25678901',
    nombre: 'Sofía',
    apellido: 'Rodríguez',
    email: 'sofia.rod@fitzone.com',
    telefono: '11-3456-7890',
    fotoUrl: null,
    tipoUsuario: 'RECEPCIONISTA',
    idSede: 2,
  },
];

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista todos los usuarios de una sede específica.
 * @param idSede - ID de la sede activa (del SedeContext)
 */
export async function listarUsuarios(idSede: number): Promise<UsuarioDTO[]> {
  if (USE_MOCK) {
    // Simulamos un delay de red (200ms) para que el estado "loading" sea visible
    await new Promise((resolve) => setTimeout(resolve, 600));
    // Filtramos los mock por sede, igual que lo haría el backend
    return MOCK_USUARIOS.filter((u) => u.idSede === idSede);
  }

  // Llamada real al backend: GET /api/v1/usuarios?idSede={idSede}
  return httpClient.get<UsuarioDTO[]>(`/v1/usuarios?idSede=${idSede}`);
}
