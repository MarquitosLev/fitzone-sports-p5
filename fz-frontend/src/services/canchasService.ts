import { httpClient, AppError } from './httpClient';
import type {
  CanchaDTO,
  CanchaFormData,
  TipoCancha,
  FranjaHorariaDTO,
  CotizacionReservaDTO,
  ReservaCanchaDTO,
  CrearReservaPayload,
  EstadoTurno,
} from '../types';

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

// ─── RESERVAS Y DISPONIBILIDAD (SCRUM-73, SCRUM-75) ──────────────────────────

export function esHorarioPico(horaInicio: string): boolean {
  const hora = parseInt(horaInicio.split(':')[0], 10);
  return hora >= 19 && hora < 21;
}

export function calcularCotizacion(
  precioBase: number,
  horaInicio: string,
  esSocio: boolean
): CotizacionReservaDTO {
  const pico = esHorarioPico(horaInicio);
  const recargoPico = pico ? Math.round(precioBase * 0.2) : 0;
  const subtotal = precioBase + recargoPico;
  const descuentoSocio = esSocio ? Math.round(subtotal * 0.15) : 0;
  const total = subtotal - descuentoSocio;

  return {
    precioBase,
    esPico: pico,
    recargoPico,
    porcentajeRecargoPico: 20,
    descuentoSocio,
    porcentajeDescuentoSocio: esSocio ? 15 : 0,
    esSocio,
    total,
  };
}

let MOCK_RESERVAS: ReservaCanchaDTO[] = [
  {
    idReservaCancha: 1029,
    cancha: MOCK_CANCHAS[0],
    usuario: {
      idUsuario: 1,
      authId: 'uuid-socio-1',
      dni: '32.845.761',
      nombre: 'Martín',
      apellido: 'García',
      email: 'martin.garcia@email.com',
      telefono: '+54 9 11 4455-8899',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    fechaHoraInicio: '2026-10-18T19:00:00',
    fechaHoraFin: '2026-10-18T20:00:00',
    precioFinal: 8160,
    estado: 'PENDIENTE_PAGO',
    cotizacion: {
      precioBase: 8000,
      esPico: true,
      recargoPico: 1600,
      porcentajeRecargoPico: 20,
      descuentoSocio: 1440,
      porcentajeDescuentoSocio: 15,
      esSocio: true,
      total: 8160,
    },
    fechaCreacion: '2026-10-17T21:00:00',
  },
  {
    idReservaCancha: 1048,
    cancha: MOCK_CANCHAS[0],
    usuario: {
      idUsuario: 1,
      authId: 'uuid-socio-1',
      dni: '32.845.761',
      nombre: 'Martín',
      apellido: 'García',
      email: 'martin.garcia@email.com',
      telefono: '+54 9 11 4455-8899',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    fechaHoraInicio: '2026-10-19T16:00:00',
    fechaHoraFin: '2026-10-19T17:00:00',
    precioFinal: 6800,
    estado: 'CONFIRMADA',
    cotizacion: {
      precioBase: 8000,
      esPico: false,
      recargoPico: 0,
      porcentajeRecargoPico: 20,
      descuentoSocio: 1200,
      porcentajeDescuentoSocio: 15,
      esSocio: true,
      total: 6800,
    },
    fechaCreacion: '2026-10-17T18:30:00',
  },
  {
    idReservaCancha: 1012,
    cancha: MOCK_CANCHAS[2],
    usuario: {
      idUsuario: 1,
      authId: 'uuid-socio-1',
      dni: '32.845.761',
      nombre: 'Martín',
      apellido: 'García',
      email: 'martin.garcia@email.com',
      telefono: '+54 9 11 4455-8899',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    fechaHoraInicio: '2026-10-16T17:00:00',
    fechaHoraFin: '2026-10-16T18:00:00',
    precioFinal: 8500,
    estado: 'CANCELADA',
    cotizacion: {
      precioBase: 10000,
      esPico: false,
      recargoPico: 0,
      porcentajeRecargoPico: 20,
      descuentoSocio: 1500,
      porcentajeDescuentoSocio: 15,
      esSocio: true,
      total: 8500,
    },
    fechaCreacion: '2026-10-15T10:00:00',
  },
];

/**
 * Cotiza el turno de una cancha (SCRUM-73).
 * Calcula tarifa base, recargo pico (19-21 hs) y descuento socio (15%).
 */
export async function cotizarTurno(
  idCancha: number,
  horaInicio: string,
  esSocio: boolean
): Promise<CotizacionReservaDTO> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const cancha = MOCK_CANCHAS.find((c) => c.idCancha === idCancha);
    const precioBase = cancha ? cancha.precioBaseHora : 10000;
    return calcularCotizacion(precioBase, horaInicio, esSocio);
  }

  return httpClient.get<CotizacionReservaDTO>(
    `/v1/canchas/${idCancha}/cotizacion?horaInicio=${encodeURIComponent(horaInicio)}&esSocio=${esSocio}`
  );
}

/**
 * Obtiene la grilla de disponibilidad de turnos para una cancha en una fecha dada (SCRUM-75).
 * Genera franjas horarias de 08:00 a 22:00 hs e identifica LIBRE, OCUPADO y MANTENIMIENTO.
 */
export async function obtenerDisponibilidad(
  idCancha: number,
  fechaIso: string // YYYY-MM-DD
): Promise<FranjaHorariaDTO[]> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const cancha = MOCK_CANCHAS.find((c) => c.idCancha === idCancha);
    const isMantenimiento = cancha?.enMantenimiento ?? false;

    // Horas de operación: 08:00 a 22:00
    const horas = [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
      '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
      '20:00', '21:00', '22:00',
    ];

    return horas.map((hInicio) => {
      const horaNum = parseInt(hInicio.split(':')[0], 10);
      const finNum = horaNum + 1;
      const hFin = `${String(finNum).padStart(2, '0')}:00`;
      const esPico = esHorarioPico(hInicio);

      // Si la cancha completa está en mantenimiento
      if (isMantenimiento) {
        return {
          id: `${hInicio}-${hFin}`,
          horaInicio: hInicio,
          horaFin: hFin,
          textoTurno: `${hInicio} – ${hFin}`,
          esPico,
          estado: 'MANTENIMIENTO' as EstadoTurno,
          precioEstimado: cancha?.precioBaseHora,
        };
      }

      // Comprobar si hay una reserva activa en este turno
      const inicioIsoStr = `${fechaIso}T${hInicio}:00`;
      const reservaExistente = MOCK_RESERVAS.find(
        (r) =>
          r.cancha.idCancha === idCancha &&
          r.estado !== 'CANCELADA' &&
          r.fechaHoraInicio.startsWith(inicioIsoStr)
      );

      let estado: EstadoTurno = 'LIBRE';
      if (reservaExistente) {
        estado = 'OCUPADO';
      } else {
        // Sembrado mock de turnos ocupados o mantenimiento específicos para realismo
        if (hInicio === '17:00' && idCancha === 1) {
          estado = 'OCUPADO';
        } else if (hInicio === '18:00' && idCancha === 1) {
          estado = 'MANTENIMIENTO';
        }
      }

      return {
        id: `${hInicio}-${hFin}`,
        horaInicio: hInicio,
        horaFin: hFin,
        textoTurno: `${hInicio} – ${hFin}`,
        esPico,
        estado,
        precioEstimado: cancha?.precioBaseHora,
      };
    });
  }

  return httpClient.get<FranjaHorariaDTO[]>(
    `/v1/canchas/${idCancha}/disponibilidad?fecha=${encodeURIComponent(fechaIso)}`
  );
}

/**
 * Crea una reserva de cancha (SCRUM-75).
 * Si el horario ya fue tomado por otro usuario, responde con conflicto (409)
 * para que el frontend informe el error y refresque la grilla.
 */
export async function crearReserva(
  payload: CrearReservaPayload,
  simularConflicto = false
): Promise<ReservaCanchaDTO> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Si se fuerza conflicto o si el turno ya fue ocupado
    const fechaHoraInicio = `${payload.fecha}T${payload.horaInicio}:00`;
    const fechaHoraFin = `${payload.fecha}T${payload.horaFin}:00`;

    // Rechazar turnos en el pasado (validación doble backend/mock)
    const ahora = new Date();
    const hoyIso = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    if (payload.fecha < hoyIso) {
      throw new AppError(
        'No se puede reservar un turno en el pasado',
        400,
        {
          codigo: 'TURNO_EN_PASADO',
          mensaje: 'La fecha seleccionada ya pasó. Por favor elegí una fecha futura.',
          timestamp: new Date().toISOString(),
        }
      );
    }
    if (payload.fecha === hoyIso) {
      const [h, m] = payload.horaInicio.split(':').map(Number);
      const turnoMinutos = h * 60 + (m || 0);
      const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
      if (turnoMinutos <= minutosActuales) {
        throw new AppError(
          'No se puede reservar un turno en el pasado',
          400,
          {
            codigo: 'TURNO_EN_PASADO',
            mensaje: 'El horario seleccionado ya pasó. Por favor elegí un turno futuro.',
            timestamp: new Date().toISOString(),
          }
        );
      }
    }

    const yaTomado =
      simularConflicto ||
      MOCK_RESERVAS.some(
        (r) =>
          r.cancha.idCancha === payload.idCancha &&
          r.estado !== 'CANCELADA' &&
          r.fechaHoraInicio === fechaHoraInicio
      );

    if (yaTomado) {
      throw new AppError(
        'El horario ya fue tomado por otro usuario',
        409,
        {
          codigo: 'CONFLICTO_TURNO_OCUPADO',
          mensaje: 'El horario seleccionado ya fue tomado o se encuentra ocupado. La disponibilidad fue actualizada.',
          timestamp: new Date().toISOString(),
        }
      );
    }

    const cancha = MOCK_CANCHAS.find((c) => c.idCancha === payload.idCancha) || MOCK_CANCHAS[0];
    const cotizacion = calcularCotizacion(
      cancha.precioBaseHora,
      payload.horaInicio,
      Boolean(payload.esSocio)
    );

    const maxId = MOCK_RESERVAS.reduce((max, r) => Math.max(max, r.idReservaCancha), 1000);
    const nuevaReserva: ReservaCanchaDTO = {
      idReservaCancha: maxId + 1,
      cancha,
      usuario: {
        idUsuario: payload.idUsuario ?? 1,
        authId: payload.esSocio ? 'uuid-socio-1' : 'uuid-invitado',
        dni: '32.845.761',
        nombre: payload.nombreInvitado || (payload.esSocio ? 'Martín' : 'Cliente'),
        apellido: payload.esSocio ? 'García' : 'Externo',
        email: payload.emailInvitado || 'usuario@email.com',
        telefono: '+54 9 11 4455-8899',
        fotoUrl: null,
        tipoUsuario: payload.esSocio ? 'SOCIO' : 'EXTERNO',
        idSede: cancha.sede.idSede,
      },
      fechaHoraInicio,
      fechaHoraFin,
      precioFinal: cotizacion.total,
      estado: 'PENDIENTE_PAGO',
      cotizacion,
      fechaCreacion: new Date().toISOString(),
    };

    MOCK_RESERVAS.unshift(nuevaReserva);
    return nuevaReserva;
  }

  return httpClient.post<ReservaCanchaDTO>('/v1/canchas/reservas', {
    body: JSON.stringify(payload),
  });
}

/**
 * Obtiene las reservas del usuario actual (o socio activo).
 */
export async function listarMisReservas(
  idUsuario = 1
): Promise<ReservaCanchaDTO[]> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [...MOCK_RESERVAS];
  }

  return httpClient.get<ReservaCanchaDTO[]>(`/v1/canchas/reservas/usuario/${idUsuario}`);
}

/**
 * Cancela una reserva de cancha.
 */
export async function cancelarReserva(
  idReservaCancha: number
): Promise<ReservaCanchaDTO> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const index = MOCK_RESERVAS.findIndex((r) => r.idReservaCancha === idReservaCancha);
    if (index === -1) {
      throw new AppError('Reserva no encontrada', 404, {
        codigo: 'RECURSO_NO_ENCONTRADO',
        mensaje: 'La reserva solicitada no existe',
        timestamp: new Date().toISOString(),
      });
    }

    const cancelada: ReservaCanchaDTO = {
      ...MOCK_RESERVAS[index],
      estado: 'CANCELADA',
    };
    MOCK_RESERVAS[index] = cancelada;
    return cancelada;
  }

  return httpClient.patch<ReservaCanchaDTO>(`/v1/canchas/reservas/${idReservaCancha}/cancelar`);
}

