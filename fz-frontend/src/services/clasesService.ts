/**
 * clasesService.ts — Capa de servicios HTTP del módulo Clases Grupales (M3).
 *
 * Organización:
 * 1. CLASES_ENDPOINTS — rutas REST reales del backend (SCRUM-97):
 *    `ClaseGrupalController`, `ReservaClaseController`, `ListaEsperaController`
 *    y las rutas `/me` de `UsuarioController`. El socio siempre se toma del token:
 *    ningún endpoint recibe `idUsuario`.
 * 2. Datos mock en memoria con fechas dinámicas relativas a new Date().
 *    Replican las reglas y los mensajes del backend para que la UI se comporte igual.
 * 3. Agenda y CRUD de clases (GERENTE) + inscriptos y lista de espera (GERENTE / RECEPCIONISTA).
 * 4. Acciones del SOCIO: reservar, cancelar, anotarse y salir de la lista de espera.
 */

import { httpClient } from './httpClient';
import type {
  ClaseGrupalDTO,
  ClaseGrupalRequest,
  ReservaClaseDTO,
  ListaEsperaDTO,
  InscriptoClaseDTO,
  SedeDTO,
  UsuarioDTO,
} from '../types';
import { toLocalISOString, parseLocalDateTime } from '../utils/formatters';
import { USE_MOCK } from '../config';

// ─── 1. ENDPOINTS REALES ─────────────────────────────────────────────────────
export const CLASES_ENDPOINTS = {
  // Agenda y CRUD (ClaseGrupalController)
  listarClases:      (idSede: number) => `/v1/clases?idSede=${idSede}`,
  crearClase:        () => '/v1/clases',
  actualizarClase:   (idClase: number) => `/v1/clases/${idClase}`,
  eliminarClase:     (idClase: number) => `/v1/clases/${idClase}`,
  // Socio: reservar y anotarse en espera sobre una clase
  reservar:          (idClase: number) => `/v1/clases/${idClase}/reservas`,
  anotarseEnEspera:  (idClase: number) => `/v1/clases/${idClase}/lista-espera`,
  // Gerente / recepcionista: inscriptos y cola de espera de una clase
  inscriptosClase:   (idClase: number) => `/v1/clases/${idClase}/reservas`,
  listaEsperaClase:  (idClase: number) => `/v1/clases/${idClase}/lista-espera`,
  // Socio: cancelar reserva (ReservaClaseController) y salir de espera (ListaEsperaController)
  cancelarReserva:   (idReservaClase: number) => `/v1/reservas-clase/${idReservaClase}/cancelar`,
  salirDeEspera:     (idEspera: number) => `/v1/lista-espera/${idEspera}`,
  // Socio logueado (UsuarioController)
  misReservas:       () => '/v1/usuarios/me/reservas-clase',
  miListaEspera:     () => '/v1/usuarios/me/lista-espera',
} as const;

// ─── Reglas de negocio (mismos valores que valida el backend) ────────────────
export const VENTANA_RESERVA_HORAS = 48;
export const CORTE_CANCELACION_HORAS = 2;
// Solo para el modo mock: imita los mensajes de ReservaClaseService y ListaEsperaService del backend.
const MENSAJES_CLASES = {
  ventanaReserva: 'La reserva solo puede realizarse con hasta 48 horas de anticipación',
  corteCancelacion: 'La cancelación solo está permitida hasta 2 horas antes del inicio de la clase',
  claseComenzada: 'No se puede reservar una clase que ya ha comenzado',
  sinCupo: 'No hay cupo disponible en la clase seleccionada',
  yaReservada: 'El socio ya posee una reserva confirmada para esta clase',
  yaEnEspera: 'El socio ya se encuentra en la lista de espera de esta clase',
  conCupo: 'La clase aún posee cupos disponibles. Realice la reserva directa.',
  esperaClaseComenzada: 'No se puede ingresar a la lista de espera de una clase que ya comenzó o finalizó',
  reservaYaCancelada: 'La reserva ya se encuentra cancelada',
  membresiaInactiva: 'El socio no posee una membresía activa y vigente',
} as const;

const HORA_MS = 60 * 60 * 1000;

// ─── 2. DATOS MOCK ───────────────────────────────────────────────────────────
const MOCK_SEDES: SedeDTO[] = [
  { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
  { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
];

function crearSocioMock(idUsuario: number, nombre: string, apellido: string, dni: string): UsuarioDTO {
  return {
    idUsuario,
    authId: `uuid-socio-${idUsuario}`,
    dni,
    nombre,
    apellido,
    email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.com`,
    telefono: '11-5432-1098',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  };
}

// Socio "logueado" en modo mock: Valentina García (idUsuario 2, membresía ACTIVO).
export const MOCK_SOCIO_LOGUEADO = crearSocioMock(2, 'Valentina', 'García', '28456789');
const MOCK_OTROS_SOCIOS = [
  crearSocioMock(5, 'Lucas', 'Fernández', '33111222'),
  crearSocioMock(6, 'Martina', 'López', '35999888'),
  crearSocioMock(7, 'Sofía', 'Ruiz', '37444555'),
];

let MOCK_CLASES: ClaseGrupalDTO[] = [];
let MOCK_RESERVAS: ReservaClaseDTO[] = [];
let MOCK_ESPERA: ListaEsperaDTO[] = [];
let nextClaseId = 100;
let nextReservaId = 200;
let nextEsperaId = 300;

function enHoras(horas: number): string {
  return toLocalISOString(new Date(Date.now() + horas * HORA_MS));
}

/**
 * (Re)arma los datos mock con fechas relativas al momento actual.
 * Exportado como `_resetMockClases` para que los tests arranquen siempre del mismo estado.
 */
function inicializarMock(): void {
  const [palermo, belgrano] = MOCK_SEDES;
  MOCK_CLASES = [
    // 20 hs → dentro de la ventana de 48 hs, con cupo (el socio ya la reservó)
    { idClase: 1, sede: palermo, nombreActividad: 'Spinning', fechaHoraInicio: enHoras(20), duracionMinutos: 60, cupoMaximo: 20, cupoDisponible: 5 },
    // 36 hs → sin cupo, el socio está tercero en espera
    { idClase: 2, sede: palermo, nombreActividad: 'Yoga', fechaHoraInicio: enHoras(36), duracionMinutos: 75, cupoMaximo: 15, cupoDisponible: 0 },
    // 72 hs → fuera de la ventana de 48 hs
    { idClase: 3, sede: palermo, nombreActividad: 'CrossFit', fechaHoraInicio: enHoras(72), duracionMinutos: 50, cupoMaximo: 12, cupoDisponible: 3 },
    // 10 hs → sin cupo, para probar "Anotarme en espera"
    { idClase: 4, sede: palermo, nombreActividad: 'Pilates', fechaHoraInicio: enHoras(10), duracionMinutos: 60, cupoMaximo: 10, cupoDisponible: 0 },
    // 40 hs → con cupo, para probar "Reservar"
    { idClase: 5, sede: palermo, nombreActividad: 'Boxeo', fechaHoraInicio: enHoras(40), duracionMinutos: 60, cupoMaximo: 12, cupoDisponible: 7 },
    // 1.5 hs → reservada por el socio, dentro del corte de 2 hs (no cancelable)
    { idClase: 7, sede: palermo, nombreActividad: 'Funcional Avanzado', fechaHoraInicio: enHoras(1.5), duracionMinutos: 45, cupoMaximo: 15, cupoDisponible: 10 },
    { idClase: 6, sede: belgrano, nombreActividad: 'Funcional', fechaHoraInicio: enHoras(25), duracionMinutos: 45, cupoMaximo: 15, cupoDisponible: 8 },
  ];
  const clase = (id: number) => MOCK_CLASES.find((c) => c.idClase === id)!;
  const [lucas, martina, sofia] = MOCK_OTROS_SOCIOS;

  MOCK_RESERVAS = [
    { idReservaClase: 101, clase: clase(1), usuario: MOCK_SOCIO_LOGUEADO, estado: 'CONFIRMADA' },
    { idReservaClase: 102, clase: clase(7), usuario: MOCK_SOCIO_LOGUEADO, estado: 'CONFIRMADA' },
    { idReservaClase: 103, clase: clase(4), usuario: MOCK_SOCIO_LOGUEADO, estado: 'CANCELADA' },
    { idReservaClase: 104, clase: clase(1), usuario: lucas, estado: 'CONFIRMADA' },
    { idReservaClase: 105, clase: clase(2), usuario: sofia, estado: 'CONFIRMADA' },
  ];
  MOCK_ESPERA = [
    { idEspera: 201, clase: clase(2), usuario: lucas, ordenPosicion: 1 },
    { idEspera: 202, clase: clase(2), usuario: martina, ordenPosicion: 2 },
    { idEspera: 203, clase: clase(2), usuario: MOCK_SOCIO_LOGUEADO, ordenPosicion: 3 },
  ];
  nextClaseId = 100;
  nextReservaId = 200;
  nextEsperaId = 300;
}

inicializarMock();

/** Solo para tests: restaura los datos mock iniciales. */
export function _resetMockClases(): void {
  inicializarMock();
}

const demora = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function horasHastaInicio(clase: ClaseGrupalDTO): number {
  return (parseLocalDateTime(clase.fechaHoraInicio).getTime() - Date.now()) / HORA_MS;
}

function buscarClaseMock(idClase: number): ClaseGrupalDTO {
  const clase = MOCK_CLASES.find((c) => c.idClase === idClase);
  if (!clase) throw new Error(`Clase grupal con id ${idClase} no encontrada`);
  return clase;
}

function reemplazarClaseMock(actualizada: ClaseGrupalDTO): void {
  MOCK_CLASES = MOCK_CLASES.map((c) => (c.idClase === actualizada.idClase ? actualizada : c));
  // Las reservas y la espera guardan una copia de la clase: la refrescamos
  MOCK_RESERVAS = MOCK_RESERVAS.map((r) => (r.clase.idClase === actualizada.idClase ? { ...r, clase: actualizada } : r));
  MOCK_ESPERA = MOCK_ESPERA.map((e) => (e.clase.idClase === actualizada.idClase ? { ...e, clase: actualizada } : e));
}

function reservaConfirmadaMock(idClase: number, idUsuario: number): ReservaClaseDTO | undefined {
  return MOCK_RESERVAS.find(
    (r) => r.clase.idClase === idClase && r.usuario.idUsuario === idUsuario && r.estado === 'CONFIRMADA'
  );
}

/** Quita una entrada de la espera y reacomoda las posiciones de esa clase (igual que el backend). */
function quitarDeEsperaMock(entrada: ListaEsperaDTO): void {
  MOCK_ESPERA = MOCK_ESPERA
    .filter((e) => e.idEspera !== entrada.idEspera)
    .map((e) =>
      e.clase.idClase === entrada.clase.idClase && e.ordenPosicion > entrada.ordenPosicion
        ? { ...e, ordenPosicion: e.ordenPosicion - 1 }
        : e
    );
}

/** Agrega el estado del socio logueado a cada clase, como hace la agenda del backend para SOCIO. */
function conEstadoDelSocio(clase: ClaseGrupalDTO): ClaseGrupalDTO {
  const idSocio = MOCK_SOCIO_LOGUEADO.idUsuario;
  const espera = MOCK_ESPERA.find((e) => e.clase.idClase === clase.idClase && e.usuario.idUsuario === idSocio);
  return {
    ...clase,
    yaReservada: Boolean(reservaConfirmadaMock(clase.idClase, idSocio)),
    ...(espera ? { posicionEspera: espera.ordenPosicion } : {}),
  };
}

// ─── 3. AGENDA, CRUD E INSCRIPTOS ────────────────────────────────────────────

/**
 * Agenda de una sede. Para un SOCIO, el backend agrega `yaReservada` y `posicionEspera`.
 */
export async function listarClases(idSede: number): Promise<ClaseGrupalDTO[]> {
  if (USE_MOCK) {
    await demora(300);
    return MOCK_CLASES.filter((c) => c.sede.idSede === idSede).map(conEstadoDelSocio);
  }
  return httpClient.get<ClaseGrupalDTO[]>(CLASES_ENDPOINTS.listarClases(idSede));
}

/** Alta de clase (solo GERENTE). El backend fija `cupoDisponible = cupoMaximo`. */
export async function crearClase(datos: ClaseGrupalRequest): Promise<ClaseGrupalDTO> {
  if (USE_MOCK) {
    await demora(300);
    const sede = MOCK_SEDES.find((s) => s.idSede === datos.idSede);
    if (!sede) throw new Error(`Sede con id ${datos.idSede} no encontrada`);
    if (parseLocalDateTime(datos.fechaHoraInicio).getTime() <= Date.now()) {
      throw new Error('La fecha y hora de inicio debe ser en el futuro');
    }
    const nueva: ClaseGrupalDTO = {
      idClase: ++nextClaseId,
      sede,
      nombreActividad: datos.nombreActividad,
      fechaHoraInicio: datos.fechaHoraInicio,
      duracionMinutos: datos.duracionMinutos,
      cupoMaximo: datos.cupoMaximo,
      cupoDisponible: datos.cupoMaximo,
    };
    MOCK_CLASES = [...MOCK_CLASES, nueva];
    return nueva;
  }
  return httpClient.post<ClaseGrupalDTO>(CLASES_ENDPOINTS.crearClase(), {
    body: JSON.stringify(datos),
  });
}

/** Edición de clase (solo GERENTE). No permite bajar el cupo por debajo de las reservas confirmadas. */
export async function actualizarClase(idClase: number, datos: ClaseGrupalRequest): Promise<ClaseGrupalDTO> {
  if (USE_MOCK) {
    await demora(300);
    const actual = buscarClaseMock(idClase);
    const confirmadas = actual.cupoMaximo - actual.cupoDisponible;
    if (datos.cupoMaximo < confirmadas) {
      throw new Error(
        `El cupo máximo (${datos.cupoMaximo}) no se puede bajar por debajo de las reservas confirmadas (${confirmadas})`
      );
    }
    const sede = MOCK_SEDES.find((s) => s.idSede === datos.idSede) ?? actual.sede;
    const actualizada: ClaseGrupalDTO = {
      ...actual,
      sede,
      nombreActividad: datos.nombreActividad,
      fechaHoraInicio: datos.fechaHoraInicio,
      duracionMinutos: datos.duracionMinutos,
      cupoMaximo: datos.cupoMaximo,
      cupoDisponible: Math.max(0, datos.cupoMaximo - confirmadas),
    };
    reemplazarClaseMock(actualizada);
    return actualizada;
  }
  return httpClient.put<ClaseGrupalDTO>(CLASES_ENDPOINTS.actualizarClase(idClase), {
    body: JSON.stringify(datos),
  });
}

/** Baja de clase (solo GERENTE). El backend la rechaza si tiene reservas confirmadas. */
export async function eliminarClase(idClase: number): Promise<void> {
  if (USE_MOCK) {
    await demora(300);
    buscarClaseMock(idClase);
    const vigentes = MOCK_RESERVAS.filter((r) => r.clase.idClase === idClase && r.estado === 'CONFIRMADA').length;
    if (vigentes > 0) {
      throw new Error(`No se puede eliminar la clase porque tiene ${vigentes} reservas confirmadas`);
    }
    MOCK_CLASES = MOCK_CLASES.filter((c) => c.idClase !== idClase);
    MOCK_ESPERA = MOCK_ESPERA.filter((e) => e.clase.idClase !== idClase);
    return;
  }
  await httpClient.delete<void>(CLASES_ENDPOINTS.eliminarClase(idClase));
}

/** Inscriptos con reserva confirmada (GERENTE / RECEPCIONISTA). */
export async function listarInscriptos(idClase: number): Promise<InscriptoClaseDTO[]> {
  if (USE_MOCK) {
    await demora(200);
    buscarClaseMock(idClase);
    return MOCK_RESERVAS
      .filter((r) => r.clase.idClase === idClase && r.estado === 'CONFIRMADA')
      .map((r) => ({
        idReservaClase: r.idReservaClase,
        idUsuario: r.usuario.idUsuario,
        nombre: r.usuario.nombre,
        apellido: r.usuario.apellido,
        estado: r.estado,
      }));
  }
  return httpClient.get<InscriptoClaseDTO[]>(CLASES_ENDPOINTS.inscriptosClase(idClase));
}

/** Cola de espera de una clase ordenada por posición (GERENTE / RECEPCIONISTA). */
export async function listarEsperaDeClase(idClase: number): Promise<ListaEsperaDTO[]> {
  if (USE_MOCK) {
    await demora(200);
    buscarClaseMock(idClase);
    return MOCK_ESPERA
      .filter((e) => e.clase.idClase === idClase)
      .sort((a, b) => a.ordenPosicion - b.ordenPosicion);
  }
  return httpClient.get<ListaEsperaDTO[]>(CLASES_ENDPOINTS.listaEsperaClase(idClase));
}

// ─── 4. ACCIONES DEL SOCIO (usuario tomado del token) ────────────────────────

/** Reservas de clases del socio logueado. */
export async function listarMisReservas(): Promise<ReservaClaseDTO[]> {
  if (USE_MOCK) {
    await demora(200);
    return MOCK_RESERVAS.filter((r) => r.usuario.idUsuario === MOCK_SOCIO_LOGUEADO.idUsuario);
  }
  return httpClient.get<ReservaClaseDTO[]>(CLASES_ENDPOINTS.misReservas());
}

/** Listas de espera en las que está anotado el socio logueado. */
export async function listarMiListaEspera(): Promise<ListaEsperaDTO[]> {
  if (USE_MOCK) {
    await demora(200);
    return MOCK_ESPERA.filter((e) => e.usuario.idUsuario === MOCK_SOCIO_LOGUEADO.idUsuario);
  }
  return httpClient.get<ListaEsperaDTO[]>(CLASES_ENDPOINTS.miListaEspera());
}

/**
 * Reserva una clase para el socio logueado.
 * Reglas del backend: membresía activa, clase no comenzada, hasta 48 hs antes,
 * sin doble reserva y con cupo. Si estaba en espera, sale de la cola.
 */
export async function reservarClase(idClase: number): Promise<ReservaClaseDTO> {
  if (USE_MOCK) {
    await demora(300);
    const clase = buscarClaseMock(idClase);
    const idSocio = MOCK_SOCIO_LOGUEADO.idUsuario;
    const horas = horasHastaInicio(clase);
    if (horas <= 0) throw new Error(MENSAJES_CLASES.claseComenzada);
    if (horas > VENTANA_RESERVA_HORAS) throw new Error(MENSAJES_CLASES.ventanaReserva);
    if (reservaConfirmadaMock(idClase, idSocio)) throw new Error(MENSAJES_CLASES.yaReservada);
    if (clase.cupoDisponible <= 0) throw new Error(MENSAJES_CLASES.sinCupo);

    const actualizada = { ...clase, cupoDisponible: clase.cupoDisponible - 1 };
    reemplazarClaseMock(actualizada);
    const nueva: ReservaClaseDTO = {
      idReservaClase: ++nextReservaId,
      clase: actualizada,
      usuario: MOCK_SOCIO_LOGUEADO,
      estado: 'CONFIRMADA',
    };
    MOCK_RESERVAS = [...MOCK_RESERVAS, nueva];
    const espera = MOCK_ESPERA.find((e) => e.clase.idClase === idClase && e.usuario.idUsuario === idSocio);
    if (espera) quitarDeEsperaMock(espera);
    return nueva;
  }
  return httpClient.post<ReservaClaseDTO>(CLASES_ENDPOINTS.reservar(idClase));
}

/**
 * Cancela una reserva propia. El backend solo lo permite hasta 2 hs antes del inicio
 * y avisa al primero de la lista de espera.
 */
export async function cancelarReservaClase(idReservaClase: number): Promise<ReservaClaseDTO> {
  if (USE_MOCK) {
    await demora(300);
    const reserva = MOCK_RESERVAS.find((r) => r.idReservaClase === idReservaClase);
    if (!reserva) throw new Error(`Reserva con id ${idReservaClase} no encontrada`);
    if (reserva.estado === 'CANCELADA') throw new Error(MENSAJES_CLASES.reservaYaCancelada);
    const clase = buscarClaseMock(reserva.clase.idClase);
    if (horasHastaInicio(clase) < CORTE_CANCELACION_HORAS) {
      throw new Error(MENSAJES_CLASES.corteCancelacion);
    }
    const actualizada = { ...clase, cupoDisponible: Math.min(clase.cupoMaximo, clase.cupoDisponible + 1) };
    reemplazarClaseMock(actualizada);
    const cancelada: ReservaClaseDTO = { ...reserva, clase: actualizada, estado: 'CANCELADA' };
    MOCK_RESERVAS = MOCK_RESERVAS.map((r) => (r.idReservaClase === idReservaClase ? cancelada : r));
    return cancelada;
  }
  return httpClient.patch<ReservaClaseDTO>(CLASES_ENDPOINTS.cancelarReserva(idReservaClase));
}

/** Anota al socio logueado en la lista de espera de una clase completa. */
export async function anotarseEnEspera(idClase: number): Promise<ListaEsperaDTO> {
  if (USE_MOCK) {
    await demora(300);
    const clase = buscarClaseMock(idClase);
    const idSocio = MOCK_SOCIO_LOGUEADO.idUsuario;
    if (horasHastaInicio(clase) <= 0) throw new Error(MENSAJES_CLASES.esperaClaseComenzada);
    if (clase.cupoDisponible > 0) throw new Error(MENSAJES_CLASES.conCupo);
    if (reservaConfirmadaMock(idClase, idSocio)) throw new Error(MENSAJES_CLASES.yaReservada);
    const cola = MOCK_ESPERA.filter((e) => e.clase.idClase === idClase);
    if (cola.some((e) => e.usuario.idUsuario === idSocio)) throw new Error(MENSAJES_CLASES.yaEnEspera);

    const nueva: ListaEsperaDTO = {
      idEspera: ++nextEsperaId,
      clase,
      usuario: MOCK_SOCIO_LOGUEADO,
      ordenPosicion: cola.length + 1,
    };
    MOCK_ESPERA = [...MOCK_ESPERA, nueva];
    return nueva;
  }
  return httpClient.post<ListaEsperaDTO>(CLASES_ENDPOINTS.anotarseEnEspera(idClase));
}

/** Saca al socio de una lista de espera; el backend reacomoda las posiciones. */
export async function salirDeEspera(idEspera: number): Promise<void> {
  if (USE_MOCK) {
    await demora(300);
    const entrada = MOCK_ESPERA.find((e) => e.idEspera === idEspera);
    if (!entrada) throw new Error(`Inscripción en lista de espera con id ${idEspera} no encontrada`);
    quitarDeEsperaMock(entrada);
    return;
  }
  await httpClient.delete<void>(CLASES_ENDPOINTS.salirDeEspera(idEspera));
}
