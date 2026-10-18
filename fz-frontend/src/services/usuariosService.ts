/**
 * usuariosService.ts — Servicio del módulo Usuarios.
 *
 * Patrón de arquitectura usado:
 *   Page → Hook → Service → httpClient (o mock)
 *
 * La constante centralizada USE_MOCK (src/config.ts) determina si se devuelven
 * datos simulados o se invoca la API real mediante httpClient.
 */

import { httpClient, AppError } from './httpClient';
import type { BackendErrorResponse } from './httpClient';
import type { UsuarioDTO, UsuarioFormData } from '../types';
import { USE_MOCK } from '../config';

// ─── DATOS MOCK ──────────────────────────────────────────────────────────────
// Estos datos simulan lo que devolvería el backend.
let MOCK_USUARIOS: UsuarioDTO[] = [
  {
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
  {
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
    idSede: 1,
  },
  {
    idUsuario: 4,
    authId: 'uuid-recep-1',
    dni: '25678901',
    nombre: 'Sofía',
    apellido: 'Rodríguez',
    email: 'sofia.rod@fitzone.com',
    telefono: '11-3456-7890',
    fotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    tipoUsuario: 'RECEPCIONISTA',
    idSede: 1,
  },
  {
    idUsuario: 5,
    authId: 'uuid-gerente-1',
    dni: '24119832',
    nombre: 'Alejandra',
    apellido: 'Vidal',
    email: 'alejandra.vidal@fitzone.com',
    telefono: '11-2345-6789',
    fotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    tipoUsuario: 'GERENTE',
    idSede: 1,
  },
  {
    idUsuario: 6,
    authId: 'uuid-socio-3',
    dni: '32845761',
    nombre: 'Mateo',
    apellido: 'Fernández',
    email: 'mateo.f@email.com',
    telefono: '11-8765-4321',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 2,
  },
  {
    idUsuario: 7,
    authId: null,
    dni: '39123890',
    nombre: 'Camila',
    apellido: 'Torres',
    email: 'camila.torres@email.com',
    telefono: '11-9876-5432',
    fotoUrl: null,
    tipoUsuario: 'EXTERNO',
    idSede: 2,
  },
  {
    idUsuario: 8,
    authId: 'uuid-recep-2',
    dni: '27890456',
    nombre: 'Gonzalo',
    apellido: 'Benítez',
    email: 'gonzalo.b@fitzone.com',
    telefono: '11-5678-1234',
    fotoUrl: null,
    tipoUsuario: 'RECEPCIONISTA',
    idSede: 2,
  },
];

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista todos los usuarios de una sede específica (o todos si no se especifica sede).
 * @param idSede - ID de la sede activa (del SedeContext)
 */
export async function listarUsuarios(idSede?: number | null): Promise<UsuarioDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (idSede === undefined || idSede === null) {
      return [...MOCK_USUARIOS];
    }
    return MOCK_USUARIOS.filter((u) => u.idSede === idSede);
  }

  const query = idSede ? `?idSede=${idSede}` : '';
  return httpClient.get<UsuarioDTO[]>(`/v1/usuarios${query}`);
}

/**
 * Obtiene un usuario específico por su ID numérico.
 */
export async function obtenerUsuarioPorId(idUsuario: number): Promise<UsuarioDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const usuario = MOCK_USUARIOS.find((u) => u.idUsuario === idUsuario);
    if (!usuario) {
      const errResponse: BackendErrorResponse = {
        codigo: 404,
        mensaje: `Usuario con ID ${idUsuario} no encontrado`,
        timestamp: new Date().toISOString(),
      };
      throw new AppError(`Usuario con ID ${idUsuario} no encontrado`, 404, errResponse);
    }
    return { ...usuario };
  }

  return httpClient.get<UsuarioDTO>(`/v1/usuarios/${idUsuario}`);
}

/**
 * Da de alta un nuevo usuario en el sistema (RF-01).
 * Valida unicidad de DNI y Email tanto en frontend como simulado en mock/backend.
 */
export async function crearUsuario(datos: UsuarioFormData): Promise<UsuarioDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validación de negocio 1: DNI ya registrado
    const dniExistente = MOCK_USUARIOS.find(
      (u) => u.dni.trim().toLowerCase() === datos.dni.trim().toLowerCase()
    );
    if (dniExistente) {
      const errorResp: BackendErrorResponse = {
        codigo: 400,
        mensaje: 'El DNI ya se encuentra registrado en el sistema',
        detalles: { dni: 'El DNI ya se encuentra registrado en el sistema' },
        timestamp: new Date().toISOString(),
      };
      throw new AppError('El DNI ya se encuentra registrado en el sistema', 400, errorResp);
    }

    // Validación de negocio 2: Email ya registrado
    const emailExistente = MOCK_USUARIOS.find(
      (u) => u.email.trim().toLowerCase() === datos.email.trim().toLowerCase()
    );
    if (emailExistente) {
      const errorResp: BackendErrorResponse = {
        codigo: 400,
        mensaje: 'El correo electrónico ya se encuentra registrado',
        detalles: { email: 'El correo electrónico ya se encuentra registrado' },
        timestamp: new Date().toISOString(),
      };
      throw new AppError('El correo electrónico ya se encuentra registrado', 400, errorResp);
    }

    const nextId = Math.max(0, ...MOCK_USUARIOS.map((u) => u.idUsuario)) + 1;
    const nuevoUsuario: UsuarioDTO = {
      idUsuario: nextId,
      authId: datos.tipoUsuario === 'EXTERNO' ? null : `uuid-${datos.tipoUsuario.toLowerCase()}-${nextId}`,
      dni: datos.dni.trim(),
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim().toLowerCase(),
      telefono: datos.telefono.trim(),
      fotoUrl: datos.fotoUrl?.trim() || null,
      tipoUsuario: datos.tipoUsuario,
      idSede: datos.idSede,
    };

    MOCK_USUARIOS.push(nuevoUsuario);
    return { ...nuevoUsuario };
  }

  return httpClient.post<UsuarioDTO>('/v1/usuarios', {
    body: JSON.stringify(datos),
  });
}

/**
 * Actualiza los datos de un usuario existente (RF-01).
 */
export async function actualizarUsuario(
  idUsuario: number,
  datos: Partial<UsuarioFormData>
): Promise<UsuarioDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const index = MOCK_USUARIOS.findIndex((u) => u.idUsuario === idUsuario);
    if (index === -1) {
      const errorResp: BackendErrorResponse = {
        codigo: 404,
        mensaje: `Usuario con ID ${idUsuario} no encontrado`,
        timestamp: new Date().toISOString(),
      };
      throw new AppError(`Usuario con ID ${idUsuario} no encontrado`, 404, errorResp);
    }

    // Validación de negocio: DNI único si se modificó
    if (datos.dni) {
      const dniExistente = MOCK_USUARIOS.find(
        (u) => u.idUsuario !== idUsuario && u.dni.trim().toLowerCase() === datos.dni?.trim().toLowerCase()
      );
      if (dniExistente) {
        const errorResp: BackendErrorResponse = {
          codigo: 400,
          mensaje: 'El DNI ya se encuentra registrado por otro usuario',
          detalles: { dni: 'El DNI ya pertenece a otro usuario registrado' },
          timestamp: new Date().toISOString(),
        };
        throw new AppError('El DNI ya se encuentra registrado por otro usuario', 400, errorResp);
      }
    }

    // Validación de negocio: Email único si se modificó
    if (datos.email) {
      const emailExistente = MOCK_USUARIOS.find(
        (u) => u.idUsuario !== idUsuario && u.email.trim().toLowerCase() === datos.email?.trim().toLowerCase()
      );
      if (emailExistente) {
        const errorResp: BackendErrorResponse = {
          codigo: 400,
          mensaje: 'El correo electrónico ya se encuentra registrado por otro usuario',
          detalles: { email: 'El correo ya pertenece a otro usuario registrado' },
          timestamp: new Date().toISOString(),
        };
        throw new AppError('El correo electrónico ya se encuentra registrado por otro usuario', 400, errorResp);
      }
    }

    const usuarioActual = MOCK_USUARIOS[index];
    const usuarioActualizado: UsuarioDTO = {
      ...usuarioActual,
      dni: datos.dni !== undefined ? datos.dni.trim() : usuarioActual.dni,
      nombre: datos.nombre !== undefined ? datos.nombre.trim() : usuarioActual.nombre,
      apellido: datos.apellido !== undefined ? datos.apellido.trim() : usuarioActual.apellido,
      email: datos.email !== undefined ? datos.email.trim().toLowerCase() : usuarioActual.email,
      telefono: datos.telefono !== undefined ? datos.telefono.trim() : usuarioActual.telefono,
      fotoUrl: datos.fotoUrl !== undefined ? (datos.fotoUrl?.trim() || null) : usuarioActual.fotoUrl,
      tipoUsuario: datos.tipoUsuario ?? usuarioActual.tipoUsuario,
      idSede: datos.idSede ?? usuarioActual.idSede,
      authId:
        datos.tipoUsuario === 'EXTERNO'
          ? null
          : usuarioActual.authId ?? `uuid-${(datos.tipoUsuario ?? usuarioActual.tipoUsuario).toLowerCase()}-${usuarioActual.idUsuario}`,
    };

    MOCK_USUARIOS[index] = usuarioActualizado;
    return { ...usuarioActualizado };
  }

  return httpClient.put<UsuarioDTO>(`/v1/usuarios/${idUsuario}`, {
    body: JSON.stringify(datos),
  });
}

/**
 * Busca usuarios filtrando por DNI en el listado de una sede.
 */
export async function buscarUsuariosPorDni(
  dni: string,
  idSede?: number | null
): Promise<UsuarioDTO[]> {
  const todos = await listarUsuarios(idSede);
  const termino = dni.trim().toLowerCase();
  if (!termino) return todos;
  return todos.filter((u) => u.dni.toLowerCase().includes(termino));
}

