/**
 * paseFirmado.test.ts — QR firmado por el dispositivo del socio y verificado sin servidor (RNF-01).
 * Usa WebCrypto real; el servidor se simula con un httpClient falso.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HabilitadosDTO, MembresiaDTO } from '../../types';

vi.mock('../../config', () => ({ USE_MOCK: false }));

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
vi.mock('../../services/httpClient', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/httpClient')>();
  return { ...original, httpClient: { get, post, put, patch: vi.fn(), delete: vi.fn() } };
});

const terminal = await import('../../services/offline/terminalLocal');
const pase = await import('../../services/offline/paseOffline');
const { obtenerMiQr, prepararPaseOffline } = await import('../../services/accesoService');

const ID_SOCIO = 3;

/** Registra la clave del dispositivo y devuelve la pública que recibió el "servidor". */
async function registrarDispositivo(): Promise<string> {
  put.mockResolvedValueOnce({ horaServidor: new Date().toISOString() });
  expect(await prepararPaseOffline(ID_SOCIO)).toBe(true);
  return JSON.parse(put.mock.calls.at(-1)![1].body).clavePublica as string;
}

async function bajarLista(clavePublica: string | null) {
  const ahora = Date.now();
  const lista: HabilitadosDTO = {
    horaServidor: new Date(ahora).toISOString(),
    validaHasta: new Date(ahora + 24 * 3600_000).toISOString(),
    idSede: 1,
    aforoMaximo: 10,
    socios: [
      { idUsuario: ID_SOCIO, nombre: 'Martín', apellido: 'Socio', dni: '00000003', venceMembresia: '2099-12-31', clavePublica },
      { idUsuario: 6, nombre: 'Nicolás', apellido: 'Otro', dni: '00000006', venceMembresia: '2099-12-31', clavePublica: null },
    ],
    adentro: [],
  };
  get.mockResolvedValueOnce(lista);
  await terminal.refrescarHabilitados();
}

beforeEach(() => {
  localStorage.clear();
  get.mockReset();
  post.mockReset();
  put.mockReset();
  pase.reiniciarPaseOffline();
});

describe('pase firmado en el dispositivo', () => {
  it('registra una clave pública P-256 y firma el QR sin pedirlo al servidor', async () => {
    const clavePublica = await registrarDispositivo();
    expect(put).toHaveBeenCalledWith('/v1/usuarios/me/clave-qr', expect.objectContaining({ silent: true }));
    expect(clavePublica).toHaveLength(124); // SPKI de una clave P-256 en base64

    const qr = await obtenerMiQr(ID_SOCIO);

    expect(qr.token).toMatch(/^F2\.3\.\d+\.[\w-]+\.[\w-]{86}$/);
    expect(qr.expiraEnSegundos).toBeGreaterThan(0);
    expect(qr.expiraEnSegundos).toBeLessThanOrEqual(60);
    expect(get).not.toHaveBeenCalled();
  });

  it('sin clave registrada (el registro falló), pide el QR al servidor como antes', async () => {
    put.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await prepararPaseOffline(ID_SOCIO)).toBe(false);
    get.mockResolvedValueOnce({ tokenQr: 'token-v1', segundosRestantes: 40 });

    const qr = await obtenerMiQr(ID_SOCIO);

    expect(get).toHaveBeenCalledWith('/v1/usuarios/me/qr');
    expect(qr.token).toBe('token-v1');
  });

  it('si el servidor no responde, conserva la clave que ya estaba registrada', async () => {
    await registrarDispositivo();
    put.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    expect(await prepararPaseOffline(ID_SOCIO)).toBe(true);
    expect((await obtenerMiQr(ID_SOCIO)).token.startsWith('F2.')).toBe(true);
  });
});

describe('terminal sin conexión con QR firmado', () => {
  it('aprueba un QR firmado por el dispositivo del socio', async () => {
    const clave = await registrarDispositivo();
    await bajarLista(clave);
    const { token } = await obtenerMiQr(ID_SOCIO);

    const res = await terminal.validarLocal(token);

    expect(res.aprobado).toBe(true);
    expect(res.usuario?.idUsuario).toBe(ID_SOCIO);
  });

  it('rechaza una firma alterada y un QR armado a mano con el id del socio', async () => {
    const clave = await registrarDispositivo();
    await bajarLista(clave);
    const { token } = await obtenerMiQr(ID_SOCIO);
    const partes = token.split('.');
    const firmaAlterada = [...partes.slice(0, 4), partes[4].slice(0, -2) + (partes[4].endsWith('AA') ? 'BB' : 'AA')].join('.');
    const ventana = Math.floor(Date.now() / 60_000);
    const armadoAMano = btoa(`${ID_SOCIO}:${ventana}:nonce:firma`).replace(/=+$/, '');

    expect((await terminal.validarLocal(firmaAlterada)).motivoRechazo).toBe('QR_VENCIDO');
    // El formato viejo no se puede verificar sin servidor: no se acepta de un socio que firma desde su dispositivo
    expect((await terminal.validarLocal(armadoAMano)).motivoRechazo).toBe('QR_VENCIDO');
  });

  it('rechaza un QR firmado si el socio no tiene clave en la lista (otro dispositivo o lista vieja)', async () => {
    await registrarDispositivo();
    await bajarLista(null);
    const { token } = await obtenerMiQr(ID_SOCIO);

    expect((await terminal.validarLocal(token)).motivoRechazo).toBe('QR_VENCIDO');
  });

  it('un socio sin dispositivo registrado sigue entrando con el QR del servidor', async () => {
    await bajarLista(null);
    const ventana = Math.floor(Date.now() / 60_000);
    const tokenV1 = btoa(`6:${ventana}:nonce:hmac`).replace(/=+$/, '');

    expect((await terminal.validarLocal(tokenV1)).aprobado).toBe(true);
  });
});

describe('membresía guardada para el pase sin conexión', () => {
  const membresia = { idMembresia: 1, estado: 'ACTIVO', fechaVencimiento: '2026-12-02' } as MembresiaDTO;

  it('devuelve la última membresía leída mientras siga vigente', () => {
    pase.guardarMembresiaLocal(ID_SOCIO, membresia);
    expect(pase.membresiaLocal(ID_SOCIO, new Date(2026, 10, 17))?.estado).toBe('ACTIVO');
  });

  it('una membresía guardada que ya venció se muestra como VENCIDO', () => {
    pase.guardarMembresiaLocal(ID_SOCIO, membresia);
    expect(pase.membresiaLocal(ID_SOCIO, new Date(2026, 11, 3))?.estado).toBe('VENCIDO');
  });
});
