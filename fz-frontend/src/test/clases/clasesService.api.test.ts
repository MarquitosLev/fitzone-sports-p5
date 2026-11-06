/**
 * clasesService.api.test.ts — Verifica que la rama real del servicio use las rutas
 * del backend (SCRUM-97) con el método HTTP correcto y sin enviar idUsuario.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => ({ USE_MOCK: false }));

const httpMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../services/httpClient', () => ({ httpClient: httpMock }));

import {
  listarClases,
  crearClase,
  actualizarClase,
  eliminarClase,
  listarInscriptos,
  listarEsperaDeClase,
  listarMisReservas,
  listarMiListaEspera,
  reservarClase,
  cancelarReservaClase,
  anotarseEnEspera,
  salirDeEspera,
} from '../../services/clasesService';

describe('clasesService (API real)', () => {
  beforeEach(() => {
    Object.values(httpMock).forEach((fn) => fn.mockReset().mockResolvedValue([]));
  });

  it('consulta la agenda de la sede', async () => {
    await listarClases(3);
    expect(httpMock.get).toHaveBeenCalledWith('/v1/clases?idSede=3');
  });

  it('crea y edita la clase enviando idSede en el body', async () => {
    const datos = {
      idSede: 1,
      nombreActividad: 'Yoga',
      fechaHoraInicio: '2026-12-01T10:00',
      duracionMinutos: 60,
      cupoMaximo: 15,
    };
    await crearClase(datos);
    expect(httpMock.post).toHaveBeenCalledWith('/v1/clases', { body: JSON.stringify(datos) });

    await actualizarClase(7, datos);
    expect(httpMock.put).toHaveBeenCalledWith('/v1/clases/7', { body: JSON.stringify(datos) });
  });

  it('elimina la clase', async () => {
    await eliminarClase(7);
    expect(httpMock.delete).toHaveBeenCalledWith('/v1/clases/7');
  });

  it('consulta inscriptos y lista de espera de una clase', async () => {
    await listarInscriptos(7);
    await listarEsperaDeClase(7);
    expect(httpMock.get).toHaveBeenCalledWith('/v1/clases/7/reservas');
    expect(httpMock.get).toHaveBeenCalledWith('/v1/clases/7/lista-espera');
  });

  it('consulta las reservas y la espera del socio logueado con las rutas /me', async () => {
    await listarMisReservas();
    await listarMiListaEspera();
    expect(httpMock.get).toHaveBeenCalledWith('/v1/usuarios/me/reservas-clase');
    expect(httpMock.get).toHaveBeenCalledWith('/v1/usuarios/me/lista-espera');
  });

  it('reserva y se anota en espera sobre la clase, sin body con idUsuario', async () => {
    await reservarClase(7);
    await anotarseEnEspera(7);
    expect(httpMock.post).toHaveBeenNthCalledWith(1, '/v1/clases/7/reservas');
    expect(httpMock.post).toHaveBeenNthCalledWith(2, '/v1/clases/7/lista-espera');
  });

  it('cancela la reserva con PATCH y sale de la espera con DELETE', async () => {
    await cancelarReservaClase(40);
    await salirDeEspera(50);
    expect(httpMock.patch).toHaveBeenCalledWith('/v1/reservas-clase/40/cancelar');
    expect(httpMock.delete).toHaveBeenCalledWith('/v1/lista-espera/50');
  });
});
