/**
 * canchasService.test.ts — Pruebas unitarias para canchasService (RF-10, RF-11, RF-12, SCRUM-73, SCRUM-75).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  esHorarioPico,
  calcularCotizacion,
  inferirTipoCancha,
  listarCanchas,
  obtenerDisponibilidad,
  crearReserva,
  cancelarReserva,
  listarMisReservas,
  _resetMockReservas,
} from '../canchasService';
import { AppError } from '../httpClient';

describe('canchasService (Lógica de Negocio y Modo Mock)', () => {
  beforeEach(() => {
    _resetMockReservas();
  });

  describe('esHorarioPico y calcularCotizacion (RF-11, SCRUM-73)', () => {
    it('identifica correctamente turnos pico (19:00 a 21:00 hs)', () => {
      expect(esHorarioPico('18:00')).toBe(false);
      expect(esHorarioPico('19:00')).toBe(true);
      expect(esHorarioPico('20:00')).toBe(true);
      expect(esHorarioPico('21:00')).toBe(false);
      expect(esHorarioPico('14:00')).toBe(false);
    });

    it('calcula cotización estándar para no socio (sin recargo ni descuento)', () => {
      const coti = calcularCotizacion(10000, '15:00', false);
      expect(coti.precioBase).toBe(10000);
      expect(coti.esPico).toBe(false);
      expect(coti.recargoPico).toBe(0);
      expect(coti.descuentoSocio).toBe(0);
      expect(coti.total).toBe(10000);
    });

    it('calcula recargo pico (+20%) para público externo en horario de 19:00 hs', () => {
      const coti = calcularCotizacion(10000, '19:00', false);
      expect(coti.esPico).toBe(true);
      expect(coti.recargoPico).toBe(2000); // 20% de 10000
      expect(coti.descuentoSocio).toBe(0);
      expect(coti.total).toBe(12000);
    });

    it('aplica recargo pico (+20%) y beneficio socio activo (-15%) en horario pico', () => {
      // Base: 10.000, Pico 20%: +2.000 -> Subtotal: 12.000, Descuento socio 15% de 12.000: 1.800 -> Total: 10.200
      const coti = calcularCotizacion(10000, '20:00', true);
      expect(coti.esPico).toBe(true);
      expect(coti.recargoPico).toBe(2000);
      expect(coti.descuentoSocio).toBe(1800);
      expect(coti.total).toBe(10200);
    });
  });

  describe('inferirTipoCancha', () => {
    it('reconoce el deporte según el nombre de la cancha', () => {
      expect(inferirTipoCancha('Cancha 1 — Pádel')).toBe('PADEL');
      expect(inferirTipoCancha('Cancha 2 — Fútbol 5')).toBe('FUTBOL_5');
      expect(inferirTipoCancha('Microestadio — Básquet')).toBe('BASQUET');
      expect(inferirTipoCancha('Central Tenis')).toBe('TENIS');
      expect(inferirTipoCancha('Espacio Multiuso')).toBe('OTRO');
    });
  });

  describe('listarCanchas y disponibilidad (RF-10, SCRUM-75)', () => {
    it('obtiene las canchas de una sede con tipo normalizado', async () => {
      const canchas = await listarCanchas(1);
      expect(canchas.length).toBeGreaterThan(0);
      expect(canchas.every((c) => c.sede.idSede === 1)).toBe(true);
      expect(canchas.every((c) => Boolean(c.tipo))).toBe(true);
    });

    it('genera grilla horaria con franjas de 08:00 a 22:00 e identifica franja pico', async () => {
      const franjas = await obtenerDisponibilidad(1, '2026-11-20');
      expect(franjas.length).toBe(15); // de 08:00 a 22:00
      const pico19 = franjas.find((f) => f.horaInicio === '19:00');
      expect(pico19?.esPico).toBe(true);
      const estandar15 = franjas.find((f) => f.horaInicio === '15:00');
      expect(estandar15?.esPico).toBe(false);
    });
  });

  describe('crearReserva y manejo de conflicto 409', () => {
    it('crea una reserva en horario libre en estado PENDIENTE_PAGO', async () => {
      const nueva = await crearReserva({
        idCancha: 3, // Tenis Palermo
        fecha: '2026-11-25',
        horaInicio: '10:00',
        horaFin: '11:00',
        esSocio: true,
        idUsuario: 1,
      });

      expect(nueva.idReservaCancha).toBeDefined();
      expect(nueva.estado).toBe('PENDIENTE_PAGO');
      expect(nueva.fechaHoraInicio).toBe('2026-11-25T10:00:00');
      expect(nueva.cotizacion?.total).toBe(nueva.precioFinal);
    });

    it('rechaza con error 400 fechas en el pasado', async () => {
      await expect(
        crearReserva({
          idCancha: 1,
          fecha: '2020-01-01',
          horaInicio: '10:00',
          horaFin: '11:00',
          esSocio: true,
        })
      ).rejects.toThrowError(AppError);
    });

    it('al simular conflicto 409 lanza AppError con status 409 y ocupa el turno en la grilla', async () => {
      let errorLanzado: unknown = null;
      try {
        await crearReserva(
          {
            idCancha: 3,
            fecha: '2026-11-28',
            horaInicio: '14:00',
            horaFin: '15:00',
            esSocio: true,
          },
          true // simularConflicto
        );
      } catch (err) {
        errorLanzado = err;
      }

      expect(errorLanzado).toBeInstanceOf(AppError);
      expect((errorLanzado as AppError).status).toBe(409);

      // Al consultar la disponibilidad inmediatamente después, el turno debe figurar como OCUPADO
      const franjas = await obtenerDisponibilidad(3, '2026-11-28');
      const turnoConflicto = franjas.find((f) => f.horaInicio === '14:00');
      expect(turnoConflicto?.estado).toBe('OCUPADO');
    });
  });

  describe('cancelarReserva y listarMisReservas', () => {
    it('permite cancelar una reserva existente y cambiar su estado a CANCELADA', async () => {
      const cancelada = await cancelarReserva(1029);
      expect(cancelada.idReservaCancha).toBe(1029);
      expect(cancelada.estado).toBe('CANCELADA');

      const reservas = await listarMisReservas(1);
      const encontrada = reservas.find((r) => r.idReservaCancha === 1029);
      expect(encontrada?.estado).toBe('CANCELADA');
    });

    it('lanza 404 si la reserva a cancelar no existe', async () => {
      await expect(cancelarReserva(999999)).rejects.toThrowError(AppError);
    });
  });
});
