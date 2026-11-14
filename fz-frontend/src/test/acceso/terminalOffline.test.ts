/**
 * terminalOffline.test.ts — Validación local, cola y fallback del terminal sin conexión (RNF-01).
 * Fuerza USE_MOCK=false y simula el servidor con un httpClient falso.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HabilitadosDTO } from '../../types';

vi.mock('../../config', () => ({ USE_MOCK: false }));

const get = vi.fn();
const post = vi.fn();
vi.mock('../../services/httpClient', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/httpClient')>();
  return { ...original, httpClient: { get, post, put: vi.fn(), patch: vi.fn(), delete: vi.fn() } };
});

const { AppError } = await import('../../services/httpClient');
const terminal = await import('../../services/offline/terminalLocal');
const cola = await import('../../services/offline/colaIngresos');
const conectividad = await import('../../services/offline/conectividad');
const { validarIngreso, registrarEgreso, sincronizarIngresosPendientes } = await import(
  '../../services/accesoService'
);

const VENTANA_MS = 60_000;

/** Mismo formato que QrTokenService.generarToken: base64url(idUsuario:ventana:nonce:firma). */
function tokenDe(idUsuario: number, momentoMs = Date.now()): string {
  const crudo = `${idUsuario}:${Math.floor(momentoMs / VENTANA_MS)}:nonce${Math.random().toString(36).slice(2)}:firma`;
  return btoa(crudo).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function listaDelServidor(cambios: Partial<HabilitadosDTO> = {}): HabilitadosDTO {
  const ahora = Date.now();
  return {
    horaServidor: new Date(ahora).toISOString(),
    validaHasta: new Date(ahora + 24 * 3600_000).toISOString(),
    idSede: 1,
    aforoMaximo: 3,
    socios: [
      { idUsuario: 3, nombre: 'Martín', apellido: 'Socio', dni: '00000003', venceMembresia: '2099-12-31' },
      { idUsuario: 5, nombre: 'Pablo', apellido: 'Moroso', dni: '00000005', venceMembresia: '2000-01-01' },
    ],
    adentro: [],
    ...cambios,
  };
}

async function bajarLista(cambios: Partial<HabilitadosDTO> = {}) {
  get.mockResolvedValueOnce(listaDelServidor(cambios));
  await terminal.refrescarHabilitados();
}

beforeEach(() => {
  localStorage.clear();
  get.mockReset();
  post.mockReset();
  conectividad.reiniciarConectividad();
});

describe('decodificarToken', () => {
  it('lee idUsuario y ventana de un token con el formato del backend', () => {
    const ahora = Date.parse('2026-11-15T15:00:20Z');
    expect(terminal.decodificarToken(tokenDe(3, ahora))).toEqual({
      idUsuario: 3,
      ventana: Math.floor(ahora / VENTANA_MS),
    });
  });

  it('devuelve null si el token no tiene 4 partes o no es base64', () => {
    expect(terminal.decodificarToken(btoa('3:123'))).toBeNull();
    expect(terminal.decodificarToken('%%%no-es-base64')).toBeNull();
  });
});

describe('validarLocal', () => {
  it('aprueba a un socio vigente que no está adentro', async () => {
    await bajarLista();
    const res = terminal.validarLocal(tokenDe(3));
    expect(res.aprobado).toBe(true);
    expect(res.offline).toBe(true);
    expect(res.usuario?.nombre).toBe('Martín');
  });

  it('rechaza un QR de hace 5 minutos con QR_VENCIDO', async () => {
    await bajarLista();
    expect(terminal.validarLocal(tokenDe(3, Date.now() - 5 * 60_000)).motivoRechazo).toBe('QR_VENCIDO');
  });

  it('rechaza con SIN_DATOS_LOCALES si no hay lista, si venció o si es de otra sede', async () => {
    expect(terminal.validarLocal(tokenDe(3)).motivoRechazo).toBe('SIN_DATOS_LOCALES');

    await bajarLista({ validaHasta: new Date(Date.now() - 1000).toISOString() });
    expect(terminal.validarLocal(tokenDe(3)).motivoRechazo).toBe('SIN_DATOS_LOCALES');

    await bajarLista();
    expect(terminal.validarLocal(tokenDe(3), 2).motivoRechazo).toBe('SIN_DATOS_LOCALES');
  });

  it('rechaza con MEMBRESIA_INACTIVA a quien no está en la lista o tiene la membresía vencida', async () => {
    await bajarLista();
    expect(terminal.validarLocal(tokenDe(99)).motivoRechazo).toBe('MEMBRESIA_INACTIVA');
    expect(terminal.validarLocal(tokenDe(5)).motivoRechazo).toBe('MEMBRESIA_INACTIVA');
  });

  it('rechaza con YA_INGRESADO a quien ya figura adentro (RN-01 local)', async () => {
    await bajarLista();
    terminal.agregarAdentro(tokenDe(3), new Date());
    expect(terminal.validarLocal(tokenDe(3)).motivoRechazo).toBe('YA_INGRESADO');
  });

  it('rechaza con AFORO_COMPLETO cuando la sede está llena', async () => {
    const adentro = [10, 11, 12].map((idUsuario) => ({
      idAcceso: idUsuario,
      idUsuario,
      tokenQr: null,
      fechaHoraIngreso: '2026-11-15T10:00:00',
    }));
    await bajarLista({ adentro });
    expect(terminal.validarLocal(tokenDe(3)).motivoRechazo).toBe('AFORO_COMPLETO');
    expect(terminal.aforoLocal(1)).toEqual({ aforoActual: 3, aforoMaximo: 3, porcentaje: 100 });
  });

  it('corrige el reloj de la PC con la hora del servidor', async () => {
    const servidorAdelantado = Date.now() + 10 * 60_000;
    await bajarLista({ horaServidor: new Date(servidorAdelantado).toISOString() });
    // El QR se generó con la hora del servidor, 10 minutos por delante del reloj de esta PC
    expect(terminal.validarLocal(tokenDe(3, servidorAdelantado)).aprobado).toBe(true);
  });
});

describe('colaIngresos', () => {
  it('quita los confirmados y los DUPLICADO, marca los rechazados y deja el resto', () => {
    ['a', 'b', 'c', 'd'].forEach((t) => cola.encolar({ tokenQr: t, ocurrioEn: new Date().toISOString() }));

    const resultado = cola.aplicarResultados([
      { tokenQr: 'a', ok: true },
      { tokenQr: 'b', ok: true, codigo: 'DUPLICADO' },
      { tokenQr: 'c', ok: false, codigo: 'YA_INGRESADO', mensaje: 'Ya está adentro' },
    ]);

    expect(resultado.map((i) => [i.tokenQr, i.estado])).toEqual([
      ['c', 'error'],
      ['d', 'pendiente'],
    ]);
    expect(resultado[0].codigo).toBe('YA_INGRESADO');
    expect(cola.descartar('c').map((i) => i.tokenQr)).toEqual(['d']);
  });

  it('manda solo los pendientes con token, sede y hora del escaneo', async () => {
    cola.encolar({ tokenQr: 'tok', idSede: 1, ocurrioEn: '2026-11-15T15:00:00.000Z', socio: 'Martín' });
    post.mockResolvedValueOnce({ resultados: [{ tokenQr: 'tok', ok: true, idAcceso: 9 }] });

    const resumen = await cola.sincronizarCola();

    expect(post).toHaveBeenCalledWith('/v1/accesos/sincronizacion', expect.objectContaining({ silent: true }));
    expect(JSON.parse(post.mock.calls[0][1].body)).toEqual({
      eventos: [{ tokenQr: 'tok', idSede: 1, ocurrioEn: '2026-11-15T15:00:00.000Z' }],
    });
    expect(resumen).toEqual({ confirmados: 1, conError: 0, restantes: 0 });
    expect(cola.cargarCola()).toEqual([]);
  });
});

describe('accesoService sin conexión', () => {
  it('si el servidor no responde, valida en local, encola y abre el circuito', async () => {
    await bajarLista();
    post.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const res = await validarIngreso({ token: tokenDe(3) });

    expect(res.aprobado).toBe(true);
    expect(res.offline).toBe(true);
    expect(cola.pendientes()).toHaveLength(1);
    expect(conectividad.estaSinConexion()).toBe(true);
    expect(terminal.aforoLocal(1)?.aforoActual).toBe(1);

    // Con el circuito abierto el próximo escaneo no espera al servidor
    post.mockClear();
    const otro = await validarIngreso({ token: tokenDe(3) });
    expect(post).not.toHaveBeenCalled();
    expect(otro.motivoRechazo).toBe('YA_INGRESADO');
  });

  it('un rechazo de negocio del servidor NO pasa a modo offline ni encola', async () => {
    await bajarLista();
    post.mockRejectedValueOnce(
      new AppError('Membresía inactiva', 422, {
        codigo: 'MEMBRESIA_INACTIVA',
        mensaje: 'El socio no posee una membresía activa',
        timestamp: '',
      })
    );

    const res = await validarIngreso({ token: tokenDe(3) });

    expect(res.aprobado).toBe(false);
    expect(res.offline).toBeUndefined();
    expect(res.motivoRechazo).toBe('MEMBRESIA_INACTIVA');
    expect(cola.pendientes()).toHaveLength(0);
    expect(conectividad.estaSinConexion()).toBe(false);
  });

  it('un 503 del proxy cuenta como servidor caído', async () => {
    await bajarLista();
    post.mockRejectedValueOnce(new AppError('Error 503', 503));
    expect((await validarIngreso({ token: tokenDe(3) })).offline).toBe(true);
  });

  it('no permite el egreso de un ingreso que todavía no confirmó el servidor', async () => {
    await expect(registrarEgreso(-1)).rejects.toThrow('todavía no se confirmó');
    expect(post).not.toHaveBeenCalled();
  });

  it('al volver el servidor sincroniza la cola y cierra el circuito', async () => {
    cola.encolar({ tokenQr: 'tok', ocurrioEn: new Date().toISOString() });
    conectividad.marcarSinConexion();
    get.mockResolvedValueOnce({ status: 'OK' }); // ping
    post.mockResolvedValueOnce({ resultados: [{ tokenQr: 'tok', ok: true }] });

    const resumen = await sincronizarIngresosPendientes();

    expect(get).toHaveBeenCalledWith('/ping', expect.objectContaining({ silent: true }));
    expect(resumen?.confirmados).toBe(1);
    expect(conectividad.estaSinConexion()).toBe(false);
  });

  it('si el servidor sigue caído, la cola queda intacta', async () => {
    cola.encolar({ tokenQr: 'tok', ocurrioEn: new Date().toISOString() });
    get.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    expect(await sincronizarIngresosPendientes()).toBeNull();
    expect(post).not.toHaveBeenCalled();
    expect(cola.pendientes()).toHaveLength(1);
  });
});
