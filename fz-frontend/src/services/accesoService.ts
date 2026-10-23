import { httpClient, AppError } from './httpClient';
import type {
  AccesoDTO,
  AforoSedeDTO,
  ValidacionIngresoRequestDTO,
  ResultadoValidacionDTO,
  MotivoRechazoAcceso,
  UsuarioDTO,
  SedeDTO,
  QrTokenDTO,
} from '../types';
import { toLocalISOString } from '../utils/formatters';
import { USE_MOCK } from '../config';


// ─── ENDPOINTS DEL BACKEND ──────────────────────────────────────────────────
export const ACCESO_ENDPOINTS = {
  AFORO: (idSede: number) => `/v1/sedes/${idSede}/aforo`,
  ACCESOS_ACTIVOS: (idSede: number) => `/v1/sedes/${idSede}/accesos/activos`,
  LISTAR: (idSede: number) => `/v1/accesos?idSede=${idSede}`,
  VALIDAR_INGRESO: '/v1/accesos/ingreso',
  REGISTRAR_EGRESO: (idAcceso: number) => `/v1/accesos/${idAcceso}/egreso`,
  QR_SOCIO: (idUsuario: number) => `/v1/usuarios/${idUsuario}/qr`,
} as const;

// ─── MOCK DATA Y ESTADO EN MEMORIA (BUG-09, RN-01, RN-04, RF-04, RF-05) ──────

const MOCK_SEDES: Record<number, SedeDTO> = {
  1: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
  2: { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
  3: { idSede: 3, nombre: 'FitZone Caballito', aforoMaximo: 50 },
  4: { idSede: 4, nombre: 'FitZone Recoleta', aforoMaximo: 70 },
};

const MOCK_USUARIOS: Record<number, UsuarioDTO> = {
  1: {
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
  2: {
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
  3: {
    idUsuario: 3,
    authId: 'uuid-socio-3',
    dni: '32987654',
    nombre: 'Martín',
    apellido: 'Gómez',
    email: 'mgomez@email.com',
    telefono: '11-3344-5566',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  4: {
    idUsuario: 4,
    authId: 'uuid-socio-4',
    dni: '35123987',
    nombre: 'Camila',
    apellido: 'Torres',
    email: 'ctorres@email.com',
    telefono: '11-9988-7766',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
};

function getMockInitialAccesos(): AccesoDTO[] {
  return [
    {
      idAcceso: 1,
      usuario: MOCK_USUARIOS[1],
      sede: MOCK_SEDES[1],
      reservaClase: null,
      reservaCancha: null,
      fechaHoraIngreso: '2026-10-18T08:30:00',
      fechaHoraEgreso: '2026-10-18T10:00:00',
    },
    {
      idAcceso: 2,
      usuario: MOCK_USUARIOS[2],
      sede: MOCK_SEDES[1],
      reservaClase: null,
      reservaCancha: null,
      fechaHoraIngreso: '2026-10-18T09:15:00',
      fechaHoraEgreso: null, // adentro de Palermo
    },
    {
      idAcceso: 3,
      usuario: MOCK_USUARIOS[3],
      sede: MOCK_SEDES[1],
      reservaClase: null,
      reservaCancha: null,
      fechaHoraIngreso: '2026-10-18T09:45:00',
      fechaHoraEgreso: null, // adentro de Palermo
    },
    {
      idAcceso: 4,
      usuario: MOCK_USUARIOS[4],
      sede: MOCK_SEDES[2],
      reservaClase: null,
      reservaCancha: null,
      fechaHoraIngreso: '2026-10-18T09:00:00',
      fechaHoraEgreso: null, // adentro de Belgrano
    },
  ];
}

let mockAccesos: AccesoDTO[] = getMockInitialAccesos();
let nextAccesoId = 100;

/**
 * Resetea el almacén mock a su estado original (útil para pruebas unitarias).
 */
export function resetMockAccesos(): void {
  mockAccesos = getMockInitialAccesos();
  nextAccesoId = 100;
}

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Consulta el aforo actual, capacidad máxima y porcentaje de ocupación en tiempo real.
 * Si se opera en modo mock, calcula dinámicamente los accesos activos (fechaHoraEgreso === null)
 * de la sede solicitada (solución BUG-09: soporta todas las sedes).
 */
export async function obtenerAforo(idSede: number): Promise<AforoSedeDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const sede = MOCK_SEDES[idSede] || { idSede, nombre: `Sede #${idSede}`, aforoMaximo: 50 };
    const aforoActual = mockAccesos.filter(
      (a) => a.sede.idSede === idSede && a.fechaHoraEgreso === null
    ).length;
    const aforoMaximo = sede.aforoMaximo;
    const porcentaje =
      aforoMaximo > 0
        ? Math.round(((aforoActual / aforoMaximo) * 100.0) * 100.0) / 100.0
        : 0;

    return {
      aforoActual,
      aforoMaximo,
      porcentaje,
    };
  }

  return httpClient.get<AforoSedeDTO>(ACCESO_ENDPOINTS.AFORO(idSede));
}

/**
 * Lista las personas que están actualmente dentro de la sede (accesos activos con fechaHoraEgreso === null).
 */
export async function listarAccesosActivos(idSede: number): Promise<AccesoDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return mockAccesos.filter(
      (a) => a.sede.idSede === idSede && a.fechaHoraEgreso === null
    );
  }

  return httpClient.get<AccesoDTO[]>(ACCESO_ENDPOINTS.ACCESOS_ACTIVOS(idSede));
}

/**
 * Lista el historial completo de accesos de una sede.
 */
export async function listarAccesos(idSede: number): Promise<AccesoDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return mockAccesos.filter((a) => a.sede.idSede === idSede);
  }

  return httpClient.get<AccesoDTO[]>(ACCESO_ENDPOINTS.LISTAR(idSede));
}

/**
 * Valida un token QR o código manual de ingreso.
 * Contempla los 4 motivos de rechazo (RF-04, RF-05, RN-01):
 * - AFORO_COMPLETO: Si la sede alcanzó su capacidad máxima.
 * - YA_INGRESADO: Si el socio ya tiene un acceso activo sin egreso (RN-01).
 * - QR_VENCIDO: Si el token está expirado.
 * - MEMBRESIA_INACTIVA: Si el socio no tiene membresía al día.
 */
export async function validarIngreso(
  request: ValidacionIngresoRequestDTO
): Promise<ResultadoValidacionDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const tokenUpper = request.token.trim().toUpperCase();

    // 1. Simulación explícita por token rápido de prueba
    if (tokenUpper.includes('VENCIDO') || tokenUpper === 'TEST-QR-VENCIDO') {
      return {
        aprobado: false,
        motivoRechazo: 'QR_VENCIDO',
        mensaje: 'El código QR ha expirado. Por favor, generá un nuevo código desde la app.',
        usuario: MOCK_USUARIOS[4],
      };
    }

    if (tokenUpper.includes('INACTIVA') || tokenUpper.includes('SUSPENDIDA') || tokenUpper === 'TEST-MEMBRESIA-INACTIVA') {
      return {
        aprobado: false,
        motivoRechazo: 'MEMBRESIA_INACTIVA',
        mensaje: 'Membresía inactiva, vencida o suspendida. Debe regularizar su estado en recepción.',
        usuario: MOCK_USUARIOS[4],
      };
    }

    if (tokenUpper.includes('YA_INGRESADO') || tokenUpper === 'TEST-YA-INGRESADO') {
      return {
        aprobado: false,
        motivoRechazo: 'YA_INGRESADO',
        mensaje: 'El socio ya posee un ingreso activo registrado en el club (RN-01).',
        usuario: MOCK_USUARIOS[2],
      };
    }

    if (tokenUpper.includes('AFORO_COMPLETO') || tokenUpper === 'TEST-AFORO-COMPLETO') {
      return {
        aprobado: false,
        motivoRechazo: 'AFORO_COMPLETO',
        mensaje: 'La sede ha alcanzado el aforo máximo permitido por normativa (RF-05).',
      };
    }

    // 2. Validación de Aforo Máximo en la sede solicitada
    const sede = MOCK_SEDES[request.idSede] || {
      idSede: request.idSede,
      nombre: `Sede #${request.idSede}`,
      aforoMaximo: 50,
    };
    const personasAdentro = mockAccesos.filter(
      (a) => a.sede.idSede === request.idSede && a.fechaHoraEgreso === null
    ).length;

    if (personasAdentro >= sede.aforoMaximo) {
      return {
        aprobado: false,
        motivoRechazo: 'AFORO_COMPLETO',
        mensaje: `La sede ${sede.nombre} se encuentra al máximo de capacidad (${personasAdentro}/${sede.aforoMaximo}).`,
      };
    }

    // 3. Resolución del usuario (por DNI o por defecto Socio 1)
    let usuarioTarget = MOCK_USUARIOS[1];
    if (tokenUpper.includes('30123456')) usuarioTarget = MOCK_USUARIOS[1];
    else if (tokenUpper.includes('28456789')) usuarioTarget = MOCK_USUARIOS[2];
    else if (tokenUpper.includes('32987654')) usuarioTarget = MOCK_USUARIOS[3];
    else if (tokenUpper.includes('35123987')) usuarioTarget = MOCK_USUARIOS[4];

    // 4. Verificación de RN-01: No puede haber más de un acceso activo para el mismo usuario
    const yaAdentro = mockAccesos.some(
      (a) => a.usuario.idUsuario === usuarioTarget.idUsuario && a.fechaHoraEgreso === null
    );

    if (yaAdentro) {
      return {
        aprobado: false,
        motivoRechazo: 'YA_INGRESADO',
        mensaje: `${usuarioTarget.nombre} ${usuarioTarget.apellido} ya registra un ingreso activo sin egreso (RN-01).`,
        usuario: usuarioTarget,
      };
    }

    // 5. Registro exitoso del acceso
    const nuevoAcceso: AccesoDTO = {
      idAcceso: nextAccesoId++,
      usuario: usuarioTarget,
      sede,
      reservaClase: null,
      reservaCancha: null,
      fechaHoraIngreso: toLocalISOString(new Date()),
      fechaHoraEgreso: null,
    };

    mockAccesos.unshift(nuevoAcceso);

    return {
      aprobado: true,
      mensaje: 'Acceso autorizado · Molinete 1 habilitado',
      usuario: usuarioTarget,
      acceso: nuevoAcceso,
    };
  }

  const MOTIVOS_RECHAZO: MotivoRechazoAcceso[] = [
    'QR_VENCIDO',
    'MEMBRESIA_INACTIVA',
    'YA_INGRESADO',
    'AFORO_COMPLETO',
  ];

  try {
    const acceso = await httpClient.post<AccesoDTO>(
      ACCESO_ENDPOINTS.VALIDAR_INGRESO,
      { body: JSON.stringify({ tokenQr: request.token, idSede: request.idSede }) }
    );
    return {
      aprobado: true,
      mensaje: 'Acceso autorizado · Molinete habilitado',
      usuario: acceso.usuario,
      acceso,
    };
  } catch (err: unknown) {
    if (
      err instanceof AppError &&
      typeof err.backendResponse?.codigo === 'string' &&
      MOTIVOS_RECHAZO.includes(err.backendResponse.codigo as MotivoRechazoAcceso)
    ) {
      return {
        aprobado: false,
        motivoRechazo: err.backendResponse.codigo as MotivoRechazoAcceso,
        mensaje: err.backendResponse.mensaje,
      };
    }
    throw err;
  }
}

/**
 * Registra el egreso de una persona de la sede, marcando la fecha y hora de egreso.
 * Esto descuenta inmediatamente la ocupación de la sede (solución BUG-09).
 */
export async function registrarEgreso(idAcceso: number): Promise<AccesoDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const acceso = mockAccesos.find((a) => a.idAcceso === idAcceso);
    if (!acceso) {
      throw new Error(`Acceso #${idAcceso} no encontrado`);
    }

    acceso.fechaHoraEgreso = toLocalISOString(new Date());
    return { ...acceso };
  }

  return httpClient.post<AccesoDTO>(ACCESO_ENDPOINTS.REGISTRAR_EGRESO(idAcceso));
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

  const resp = await httpClient.get<{ tokenQr: string; segundosRestantes: number }>(
    ACCESO_ENDPOINTS.QR_SOCIO(idUsuario)
  );
  return {
    token: resp.tokenQr,
    expiraEnSegundos: resp.segundosRestantes,
    generadoEn: new Date().toISOString(),
  };
}
