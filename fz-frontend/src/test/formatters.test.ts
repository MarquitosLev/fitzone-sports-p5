/**
 * formatters.test.ts — Pruebas unitarias para utilidades de fechas y formateo.
 * Valida parseLocalDateTime y prevención de desfases horarios por LocalDateTime de Java.
 */

import { describe, it, expect } from 'vitest';
import { parseLocalDateTime, formatearFechaHora, formatearHora, formatearMonto } from '../utils/formatters';

describe('formatters util', () => {
  describe('parseLocalDateTime', () => {
    it('parsea un string ISO LocalDateTime en la zona horaria local exacta', () => {
      const iso = '2026-10-17T18:30:45';
      const parsed = parseLocalDateTime(iso);

      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(9); // Octubre (0-indexed)
      expect(parsed.getDate()).toBe(17);
      expect(parsed.getHours()).toBe(18);
      expect(parsed.getMinutes()).toBe(30);
      expect(parsed.getSeconds()).toBe(45);
    });

    it('maneja strings sin segundos (YYYY-MM-DDTHH:mm)', () => {
      const iso = '2026-05-10T09:15';
      const parsed = parseLocalDateTime(iso);

      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(4); // Mayo
      expect(parsed.getDate()).toBe(10);
      expect(parsed.getHours()).toBe(9);
      expect(parsed.getMinutes()).toBe(15);
      expect(parsed.getSeconds()).toBe(0);
    });

    it('maneja strings con milisegundos (YYYY-MM-DDTHH:mm:ss.SSS)', () => {
      const iso = '2026-12-31T23:59:59.500';
      const parsed = parseLocalDateTime(iso);

      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getHours()).toBe(23);
      expect(parsed.getMilliseconds()).toBe(500);
    });

    it('soporta strings que ya tienen Z o zona explícita delegando al constructor Date', () => {
      const isoWithZ = '2026-10-17T18:00:00Z';
      const parsed = parseLocalDateTime(isoWithZ);

      expect(parsed.getTime()).toBe(new Date(isoWithZ).getTime());
    });

    it('devuelve Date(NaN) para strings vacíos o nulos', () => {
      expect(isNaN(parseLocalDateTime('').getTime())).toBe(true);
    });
  });

  describe('formatearFechaHora', () => {
    it('formatea un LocalDateTime manteniendo la hora local sin desfasarla', () => {
      const iso = '2026-10-17T18:00:00';
      const resultado = formatearFechaHora(iso);

      expect(resultado).toContain('17/10/2026');
      expect(resultado).toContain('18:00');
    });

    it('devuelve guión si la fecha está vacía', () => {
      expect(formatearFechaHora('')).toBe('—');
    });
  });

  describe('formatearHora', () => {
    it('extrae correctamente hora y minutos sin conversiones', () => {
      expect(formatearHora('2026-10-17T08:05:00')).toBe('08:05');
      expect(formatearHora('2026-10-17T20:30:00')).toBe('20:30');
    });
  });

  describe('formatearMonto', () => {
    it('formatea montos en pesos argentinos', () => {
      const monto = formatearMonto(15000);
      expect(monto).toContain('15.000');
    });
  });
});
