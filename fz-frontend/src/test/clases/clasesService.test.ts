/**
 * clasesService.test.ts — Pruebas del servicio de Clases Grupales en modo mock.
 * Valida el flujo completo de negocio: listar → reservar (descuenta cupo) → cancelar (libera cupo) → lista de espera.
 */

import { describe, it, expect } from 'vitest';
import {
  listarClases,
  listarReservasSocio,
  listarEsperaSocio,
  reservarClase,
  cancelarReservaClase,
  anotarseEnEspera,
} from '../../services/clasesService';

describe('clasesService (Modo Mock)', () => {
  it('lista las clases correspondientes a una sede dada', async () => {
    const clasesPalermo = await listarClases(1);
    expect(clasesPalermo.length).toBeGreaterThan(0);
    expect(clasesPalermo.every((c) => c.sede.idSede === 1)).toBe(true);

    const clasesBelgrano = await listarClases(2);
    expect(clasesBelgrano.every((c) => c.sede.idSede === 2)).toBe(true);
  });

  it('flujo completo: reservar clase descuenta cupo y cancelar la reserva lo libera', async () => {
    // 1. Buscamos una clase con cupo disponible en Palermo
    const clases = await listarClases(1);
    const claseConCupo = clases.find((c) => c.cupoDisponible > 0);
    expect(claseConCupo).toBeDefined();

    const idClase = claseConCupo!.idClase;
    const cupoInicial = claseConCupo!.cupoDisponible;
    const idUsuarioPrueba = 2;

    // 2. Reservamos la clase
    const reserva = await reservarClase(idClase, idUsuarioPrueba);
    expect(reserva.idReservaClase).toBeDefined();
    expect(reserva.estado).toBe('CONFIRMADA');
    expect(reserva.clase.idClase).toBe(idClase);

    // Verificamos que el cupo disponible se descontó en 1
    const clasesPostReserva = await listarClases(1);
    const claseActualizada = clasesPostReserva.find((c) => c.idClase === idClase);
    expect(claseActualizada?.cupoDisponible).toBe(cupoInicial - 1);

    // 3. Verificamos que la reserva aparece en las reservas del socio
    const reservasSocio = await listarReservasSocio(idUsuarioPrueba);
    const encontrada = reservasSocio.find((r) => r.idReservaClase === reserva.idReservaClase);
    expect(encontrada).toBeDefined();
    expect(encontrada?.estado).toBe('CONFIRMADA');

    // 4. Cancelamos la reserva
    await cancelarReservaClase(reserva.idReservaClase);

    // Verificamos que la reserva cambió a CANCELADA
    const reservasPostCancel = await listarReservasSocio(idUsuarioPrueba);
    const reservaCancelada = reservasPostCancel.find((r) => r.idReservaClase === reserva.idReservaClase);
    expect(reservaCancelada?.estado).toBe('CANCELADA');

    // Verificamos que el cupo disponible se restauró (+1)
    const clasesPostCancel = await listarClases(1);
    const claseLiberada = clasesPostCancel.find((c) => c.idClase === idClase);
    expect(claseLiberada?.cupoDisponible).toBe(cupoInicial);
  });

  it('permite anotarse en lista de espera y calcula ordenPosicion incremental', async () => {
    const idClaseSinCupo = 2; // Yoga en Palermo (cupo 0)
    const idUsuario = 2;

    const nuevaEspera = await anotarseEnEspera(idClaseSinCupo, idUsuario);
    expect(nuevaEspera.idEspera).toBeDefined();
    expect(nuevaEspera.clase.idClase).toBe(idClaseSinCupo);
    expect(nuevaEspera.ordenPosicion).toBeGreaterThan(0);

    const listaEspera = await listarEsperaSocio(idUsuario);
    expect(listaEspera.some((e) => e.idEspera === nuevaEspera.idEspera)).toBe(true);
  });
});
