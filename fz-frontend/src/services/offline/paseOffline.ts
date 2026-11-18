/**
 * paseOffline.ts — Pase QR del socio generado en su propio dispositivo (RNF-01).
 *
 * El dispositivo tiene un par de claves ECDSA P-256. La privada se crea no exportable y queda en
 * IndexedDB: nunca sale del navegador. La pública se registra en el servidor y viaja en la lista
 * de habilitados del terminal. Con eso el socio firma el QR de cada minuto sin servidor, y el
 * terminal y el servidor lo verifican.
 *
 * Formato del QR: F2.<idUsuario>.<ventana>.<nonce>.<firma>, con la firma (base64url, 64 bytes)
 * sobre "F2|<idUsuario>|<ventana>|<nonce>". Debe coincidir con QrFirmadoService del backend.
 */
import { httpClient } from '../httpClient';
import type { MembresiaDTO, QrTokenDTO } from '../../types';

export const ENDPOINT_CLAVE_QR = '/v1/usuarios/me/clave-qr';
const VENTANA_MS = 60_000;
const ALGORITMO = { name: 'ECDSA', namedCurve: 'P-256' } as const;
const FIRMA = { name: 'ECDSA', hash: 'SHA-256' } as const;

interface RegistroClave {
  idUsuario: number;
  privada: CryptoKey;
  publicaSpki: string;
  registrada: boolean;
  /** Hora del servidor menos la del dispositivo, medida al registrar la clave. */
  desfaseMs: number;
}

// ── Almacén de claves: IndexedDB, o memoria si el navegador no lo tiene (por ejemplo, en tests) ──

const DB = 'fitzone-pase-qr';
const STORE = 'claves';
const enMemoria = new Map<number, RegistroClave>();

function abrirDb(): Promise<IDBDatabase> | null {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(DB, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(STORE, { keyPath: 'idUsuario' });
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function leerRegistro(idUsuario: number): Promise<RegistroClave | undefined> {
  const apertura = abrirDb();
  if (!apertura) return enMemoria.get(idUsuario);
  const db = await apertura;
  return new Promise((resolve, reject) => {
    const pedido = db.transaction(STORE, 'readonly').objectStore(STORE).get(idUsuario);
    pedido.onsuccess = () => resolve(pedido.result as RegistroClave | undefined);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function guardarRegistro(registro: RegistroClave): Promise<void> {
  const apertura = abrirDb();
  if (!apertura) {
    enMemoria.set(registro.idUsuario, registro);
    return;
  }
  const db = await apertura;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(registro);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Base64 ──

function aBase64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function aBase64Url(bytes: ArrayBuffer): string {
  return aBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Clave del dispositivo ──

/**
 * Crea la clave del dispositivo si no existe y registra la pública en el servidor. Se llama al
 * abrir "Mi QR" con conexión: así el último dispositivo que se abre es el que firma QR válidos.
 * Si el servidor no responde, conserva la clave que ya estaba registrada.
 */
export async function asegurarClaveRegistrada(idUsuario: number): Promise<boolean> {
  let registro = await leerRegistro(idUsuario);
  if (!registro) {
    const par = (await crypto.subtle.generateKey(ALGORITMO, false, ['sign', 'verify'])) as CryptoKeyPair;
    registro = {
      idUsuario,
      privada: par.privateKey,
      publicaSpki: aBase64(await crypto.subtle.exportKey('spki', par.publicKey)),
      registrada: false,
      desfaseMs: 0,
    };
    await guardarRegistro(registro);
  }

  try {
    const { horaServidor } = await httpClient.put<{ horaServidor: string }>(ENDPOINT_CLAVE_QR, {
      silent: true,
      body: JSON.stringify({ clavePublica: registro.publicaSpki }),
    });
    await guardarRegistro({ ...registro, registrada: true, desfaseMs: Date.parse(horaServidor) - Date.now() });
    return true;
  } catch {
    return registro.registrada;
  }
}

/** Firma el QR del minuto actual en el dispositivo. null si este dispositivo no tiene una clave registrada. */
export async function generarQrFirmado(idUsuario: number): Promise<QrTokenDTO | null> {
  const registro = await leerRegistro(idUsuario);
  if (!registro?.registrada) return null;

  const ahora = Date.now() + registro.desfaseMs;
  const ventana = Math.floor(ahora / VENTANA_MS);
  const nonce = aBase64Url(crypto.getRandomValues(new Uint8Array(8)).buffer);
  const datos = new TextEncoder().encode(`F2|${idUsuario}|${ventana}|${nonce}`);
  const firma = aBase64Url(await crypto.subtle.sign(FIRMA, registro.privada, datos));

  return {
    token: `F2.${idUsuario}.${ventana}.${nonce}.${firma}`,
    expiraEnSegundos: Math.max(1, Math.ceil(((ventana + 1) * VENTANA_MS - ahora) / 1000)),
    generadoEn: new Date(ahora).toISOString(),
  };
}

// ── Membresía guardada, para mostrar el pase sin servidor ──

const claveMembresia = (idUsuario: number) => `fitzone.pase.membresia.${idUsuario}`;

export function guardarMembresiaLocal(idUsuario: number, membresia: MembresiaDTO | null): void {
  try {
    if (membresia) localStorage.setItem(claveMembresia(idUsuario), JSON.stringify(membresia));
    else localStorage.removeItem(claveMembresia(idUsuario));
  } catch {
    // Sin storage, el pase offline no está disponible; online sigue igual
  }
}

/**
 * La última membresía leída del servidor. Si ya pasó su vencimiento se devuelve como VENCIDO,
 * para que el pase no se muestre con datos viejos.
 */
export function membresiaLocal(idUsuario: number, hoy = new Date()): MembresiaDTO | null {
  try {
    const crudo = localStorage.getItem(claveMembresia(idUsuario));
    if (!crudo) return null;
    const membresia = JSON.parse(crudo) as MembresiaDTO;
    const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (membresia.estado === 'ACTIVO' && membresia.fechaVencimiento < hoyIso) {
      return { ...membresia, estado: 'VENCIDO' };
    }
    return membresia;
  } catch {
    return null;
  }
}

/** Solo para pruebas. */
export function reiniciarPaseOffline(): void {
  enMemoria.clear();
}
