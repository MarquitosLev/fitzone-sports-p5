/**
 * terminalLocal.ts — Lista local de habilitados y validación sin conexión (RNF-01).
 *
 * El terminal baja cada 5 minutos la lista de socios con membresía vigente (sin secretos) y la
 * usa para validar cuando el servidor no responde. El token QR es base64url(idUsuario:ventana:nonce:firma):
 * acá se leen idUsuario y ventana, pero la firma solo la puede verificar el servidor, y lo hace
 * al sincronizar la cola.
 */
import { httpClient } from '../httpClient';
import { toLocalISOString } from '../../utils/formatters';
import type { AccesoDTO, AforoSedeDTO, HabilitadosDTO, ResultadoValidacionDTO } from '../../types';

const CLAVE_LISTA = 'fitzone.acceso.habilitados';
const VENTANA_MS = 60_000;

export const ENDPOINT_HABILITADOS = '/v1/accesos/terminal/habilitados';

/** La lista guardada, con el desfase entre el reloj del servidor y el de esta PC. */
export interface ListaLocal extends HabilitadosDTO {
  desfaseMs: number;
}

export function cargarLista(): ListaLocal | null {
  try {
    const crudo = localStorage.getItem(CLAVE_LISTA);
    return crudo ? (JSON.parse(crudo) as ListaLocal) : null;
  } catch {
    return null;
  }
}

function guardarLista(lista: ListaLocal): void {
  try {
    localStorage.setItem(CLAVE_LISTA, JSON.stringify(lista));
  } catch {
    // Sin storage el terminal sigue online; offline va a rechazar por falta de datos
  }
}

export function borrarLista(): void {
  try {
    localStorage.removeItem(CLAVE_LISTA);
  } catch {
    // nada que borrar
  }
}

/** Baja la lista de la sede y la guarda. Sin idSede, el servidor usa la sede del operador. */
export async function refrescarHabilitados(idSede?: number): Promise<ListaLocal> {
  const ruta = idSede !== undefined ? `${ENDPOINT_HABILITADOS}?idSede=${idSede}` : ENDPOINT_HABILITADOS;
  const datos = await httpClient.get<HabilitadosDTO>(ruta, { silent: true });
  const lista: ListaLocal = { ...datos, desfaseMs: Date.parse(datos.horaServidor) - Date.now() };
  guardarLista(lista);
  return lista;
}

/** Lee idUsuario y ventana del token sin verificar la firma. null si no tiene el formato esperado. */
export function decodificarToken(token: string): { idUsuario: number; ventana: number } | null {
  try {
    const base64 = token.trim().replace(/-/g, '+').replace(/_/g, '/');
    const partes = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)).split(':');
    if (partes.length !== 4) return null;
    const idUsuario = Number(partes[0]);
    const ventana = Number(partes[1]);
    if (!Number.isSafeInteger(idUsuario) || !Number.isSafeInteger(ventana)) return null;
    return { idUsuario, ventana };
  } catch {
    return null;
  }
}

function rechazo(motivoRechazo: ResultadoValidacionDTO['motivoRechazo'], mensaje: string): ResultadoValidacionDTO {
  return { aprobado: false, motivoRechazo, mensaje, offline: true };
}

/**
 * Valida un ingreso contra la lista local, en el mismo orden que el servidor.
 * No modifica nada: si aprueba, quien llama encola el ingreso y lo suma con {@link agregarAdentro}.
 */
export function validarLocal(token: string, idSede?: number, ahoraMs = Date.now()): ResultadoValidacionDTO {
  const datos = decodificarToken(token);
  const lista = cargarLista();
  const ahoraServidor = ahoraMs + (lista?.desfaseMs ?? 0);

  if (!datos) {
    return rechazo('QR_VENCIDO', 'El formato del código QR es inválido.');
  }
  // Misma tolerancia que el servidor: ventana anterior, actual o siguiente
  if (Math.abs(datos.ventana - Math.floor(ahoraServidor / VENTANA_MS)) > 1) {
    return rechazo('QR_VENCIDO', 'El código QR ha expirado. Pedile al socio que lo actualice.');
  }
  if (!lista || ahoraServidor > Date.parse(lista.validaHasta) || (idSede !== undefined && lista.idSede !== idSede)) {
    return rechazo('SIN_DATOS_LOCALES', 'Sin conexión y sin una lista de habilitados vigente para esta sede.');
  }

  const socio = lista.socios.find((s) => s.idUsuario === datos.idUsuario);
  const hoy = toLocalISOString(new Date(ahoraServidor)).slice(0, 10);
  if (!socio || socio.venceMembresia < hoy) {
    return rechazo('MEMBRESIA_INACTIVA', 'El socio no figura con una membresía activa y vigente.');
  }

  const usuario = aUsuario(socio);
  if (lista.adentro.some((a) => a.idUsuario === datos.idUsuario || a.tokenQr === token.trim())) {
    return { ...rechazo('YA_INGRESADO', `${socio.nombre} ${socio.apellido} ya figura adentro de la sede.`), usuario };
  }
  if (lista.adentro.length >= lista.aforoMaximo) {
    return rechazo('AFORO_COMPLETO', `La sede está al máximo de su capacidad (${lista.aforoMaximo}).`);
  }

  return {
    aprobado: true,
    offline: true,
    mensaje: 'Sin conexión: ingreso aprobado con los datos locales. Se confirma al volver el servidor.',
    usuario,
  };
}

/** Suma un ingreso a la lista local para que cuente en el aforo y en RN-01 mientras siga sin conexión. */
export function agregarAdentro(token: string, ocurrioEn: Date, idAcceso: number | null = null): void {
  const lista = cargarLista();
  const datos = decodificarToken(token);
  if (!lista || !datos) return;
  lista.adentro = [
    ...lista.adentro.filter((a) => a.idUsuario !== datos.idUsuario),
    { idAcceso, idUsuario: datos.idUsuario, tokenQr: token.trim(), fechaHoraIngreso: toLocalISOString(ocurrioEn) },
  ];
  guardarLista(lista);
}

/** Saca de la lista local a quien egresó estando online, para no rechazarlo después por RN-01. */
export function quitarAdentro(idAcceso: number): void {
  const lista = cargarLista();
  if (!lista) return;
  lista.adentro = lista.adentro.filter((a) => a.idAcceso !== idAcceso);
  guardarLista(lista);
}

export function aforoLocal(idSede: number): AforoSedeDTO | null {
  const lista = cargarLista();
  if (!lista || lista.idSede !== idSede) return null;
  const aforoActual = lista.adentro.length;
  const porcentaje = lista.aforoMaximo > 0 ? Math.round((aforoActual / lista.aforoMaximo) * 10000) / 100 : 0;
  return { aforoActual, aforoMaximo: lista.aforoMaximo, porcentaje };
}

/**
 * Personas adentro según la lista local, con la forma de AccesoDTO para la misma tabla de la pantalla.
 * Los ingresos que todavía no confirmó el servidor llevan un id negativo.
 */
export function adentroLocal(idSede: number): AccesoDTO[] | null {
  const lista = cargarLista();
  if (!lista || lista.idSede !== idSede) return null;
  return lista.adentro.map((a, i) => {
    const socio = lista.socios.find((s) => s.idUsuario === a.idUsuario);
    return {
      idAcceso: a.idAcceso ?? -(i + 1),
      usuario: aUsuario(socio ?? { idUsuario: a.idUsuario, nombre: 'Socio', apellido: `#${a.idUsuario}`, dni: '' }),
      sede: { idSede: lista.idSede, nombre: '', aforoMaximo: lista.aforoMaximo },
      fechaHoraIngreso: a.fechaHoraIngreso,
      fechaHoraEgreso: null,
    };
  });
}

function aUsuario(socio: { idUsuario: number; nombre: string; apellido: string; dni: string }) {
  return {
    idUsuario: socio.idUsuario,
    authId: null,
    dni: socio.dni,
    nombre: socio.nombre,
    apellido: socio.apellido,
    email: '',
    telefono: '',
    fotoUrl: null,
    tipoUsuario: 'SOCIO' as const,
    idSede: null,
  };
}
