/**
 * clasesService.test.ts — Pruebas del servicio de Clases Grupales en modo mock.
 * Valida las reglas del backend replicadas en el mock (mensajes comparados por fragmento): 48 hs, 2 hs, cupo,
 * doble reserva y lista de espera con reacomodo de posiciones.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  listarClases,
  listarMisReservas,
  listarMiListaEspera,
  reservarClase,
  cancelarReservaClase,
  anotarseEnEspera,
  salirDeEspera,
  crearClase,
  actualizarClase,
  eliminarClase,
  listarInscriptos,
  listarEsperaDeClase,
  _resetMockClases,
} from '../../services/clasesService';
import { toLocalISOString } from '../../utils/formatters';

const enHoras = (horas: number) => toLocalISOString(new Date(Date.now() + horas * 60 * 60 * 1000));

describe('clasesService (Modo Mock)', () => {
  beforeEach(() => {
    _resetMockClases();
  });

  it('lista las clases de una sede con el estado del socio (yaReservada y posicionEspera)', async () => {
    const clasesPalermo = await listarClases(1);
    expect(clasesPalermo.length).toBeGreaterThan(0);
    expect(clasesPalermo.every((c) => c.sede.idSede === 1)).toBe(true);

    expect(clasesPalermo.find((c) => c.idClase === 1)?.yaReservada).toBe(true);
    expect(clasesPalermo.find((c) => c.idClase === 2)?.posicionEspera).toBe(3);
    expect(clasesPalermo.find((c) => c.idClase === 5)?.yaReservada).toBe(false);
    expect(clasesPalermo.find((c) => c.idClase === 5)?.posicionEspera).toBeUndefined();

    const clasesBelgrano = await listarClases(2);
    expect(clasesBelgrano.every((c) => c.sede.idSede === 2)).toBe(true);
  });

  it('reservar descuenta el cupo y cancelar lo libera', async () => {
    const idClase = 5; // Boxeo, con cupo y dentro de 48 hs
    const cupoInicial = (await listarClases(1)).find((c) => c.idClase === idClase)!.cupoDisponible;

    const reserva = await reservarClase(idClase);
    expect(reserva.estado).toBe('CONFIRMADA');
    expect(reserva.clase.idClase).toBe(idClase);

    const trasReserva = (await listarClases(1)).find((c) => c.idClase === idClase)!;
    expect(trasReserva.cupoDisponible).toBe(cupoInicial - 1);
    expect(trasReserva.yaReservada).toBe(true);
    expect((await listarMisReservas()).some((r) => r.idReservaClase === reserva.idReservaClase)).toBe(true);

    const cancelada = await cancelarReservaClase(reserva.idReservaClase);
    expect(cancelada.estado).toBe('CANCELADA');

    const trasCancelar = (await listarClases(1)).find((c) => c.idClase === idClase)!;
    expect(trasCancelar.cupoDisponible).toBe(cupoInicial);
    expect(trasCancelar.yaReservada).toBe(false);
  });

  it('rechaza la doble reserva con el mensaje del backend', async () => {
    await expect(reservarClase(1)).rejects.toThrow(/ya posee una reserva confirmada/);
  });

  it('rechaza reservar con más de 48 hs de anticipación', async () => {
    await expect(reservarClase(3)).rejects.toThrow(/hasta 48 horas de anticipación/);
  });

  it('rechaza reservar una clase sin cupo', async () => {
    await expect(reservarClase(4)).rejects.toThrow(/No hay cupo disponible/);
  });

  it('rechaza cancelar a menos de 2 hs del inicio', async () => {
    await expect(cancelarReservaClase(102)).rejects.toThrow(/hasta 2 horas antes del inicio/);
  });

  it('rechaza cancelar una reserva ya cancelada', async () => {
    await expect(cancelarReservaClase(103)).rejects.toThrow(/ya se encuentra cancelada/);
  });

  it('anotarse en espera asigna la última posición y no permite anotarse dos veces', async () => {
    const nueva = await anotarseEnEspera(4); // Pilates sin cupo, nadie en espera
    expect(nueva.ordenPosicion).toBe(1);
    expect((await listarMiListaEspera()).some((e) => e.idEspera === nueva.idEspera)).toBe(true);
    expect((await listarClases(1)).find((c) => c.idClase === 4)?.posicionEspera).toBe(1);

    await expect(anotarseEnEspera(4)).rejects.toThrow(/ya se encuentra en la lista de espera/);
  });

  it('no permite anotarse en espera si la clase todavía tiene cupo', async () => {
    await expect(anotarseEnEspera(5)).rejects.toThrow(/aún posee cupos disponibles/);
  });

  it('salir de la espera reacomoda las posiciones de los que siguen', async () => {
    // Clase 2: Lucas 1°, Martina 2°, socio logueado 3°. Sale Lucas (idEspera 201).
    await salirDeEspera(201);
    const cola = await listarEsperaDeClase(2);
    expect(cola.map((e) => e.ordenPosicion)).toEqual([1, 2]);
    expect((await listarClases(1)).find((c) => c.idClase === 2)?.posicionEspera).toBe(2);

    await salirDeEspera(203);
    expect((await listarMiListaEspera()).some((e) => e.clase.idClase === 2)).toBe(false);
  });

  it('el gerente crea, edita y elimina una clase', async () => {
    const creada = await crearClase({
      idSede: 1,
      nombreActividad: 'Zumba',
      fechaHoraInicio: enHoras(30),
      duracionMinutos: 45,
      cupoMaximo: 10,
    });
    expect(creada.cupoDisponible).toBe(10);
    expect(creada.sede.idSede).toBe(1);

    const editada = await actualizarClase(creada.idClase, {
      idSede: 1,
      nombreActividad: 'Zumba Fitness',
      fechaHoraInicio: creada.fechaHoraInicio,
      duracionMinutos: 60,
      cupoMaximo: 8,
    });
    expect(editada.nombreActividad).toBe('Zumba Fitness');
    expect(editada.cupoDisponible).toBe(8);

    await eliminarClase(creada.idClase);
    expect((await listarClases(1)).some((c) => c.idClase === creada.idClase)).toBe(false);
  });

  it('no permite bajar el cupo por debajo de las reservas confirmadas ni eliminar una clase con reservas', async () => {
    // Clase 1: 20 de cupo, 5 disponibles → 15 confirmadas
    const clase = (await listarClases(1)).find((c) => c.idClase === 1)!;
    await expect(
      actualizarClase(1, {
        idSede: 1,
        nombreActividad: clase.nombreActividad,
        fechaHoraInicio: clase.fechaHoraInicio,
        duracionMinutos: clase.duracionMinutos,
        cupoMaximo: 10,
      })
    ).rejects.toThrow(/no se puede bajar por debajo de las reservas confirmadas/);

    await expect(eliminarClase(1)).rejects.toThrow(/tiene \d+ reservas confirmadas/);
  });

  it('lista los inscriptos confirmados y la cola de espera ordenada de una clase', async () => {
    const inscriptos = await listarInscriptos(1);
    expect(inscriptos.length).toBe(2);
    expect(inscriptos.every((i) => i.estado === 'CONFIRMADA')).toBe(true);

    const cola = await listarEsperaDeClase(2);
    expect(cola.map((e) => e.ordenPosicion)).toEqual([1, 2, 3]);
  });
});
