/**
 * accesoService.test.ts — Pruebas unitarias para el servicio de accesos y aforo (SCRUM-82, RN-01, RF-04, RF-05, BUG-09).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  obtenerAforo,
  listarAccesosActivos,
  validarIngreso,
  registrarEgreso,
  resetMockAccesos,
} from '../../services/accesoService';

describe('accesoService', () => {
  beforeEach(() => {
    resetMockAccesos();
  });

  describe('obtenerAforo & BUG-09 (Soporte multisede)', () => {
    it('calcula el aforo en tiempo real contando únicamente las personas adentro (fechaHoraEgreso === null) en Palermo (Sede 1)', async () => {
      const aforo = await obtenerAforo(1);

      // En mock inicial hay 2 personas adentro de Palermo (Lucas ya egresó, Valentina y Martín siguen adentro)
      expect(aforo.aforoActual).toBe(2);
      expect(aforo.aforoMaximo).toBe(80);
      expect(aforo.porcentaje).toBe(2.5);
    });

    it('calcula el aforo de forma aislada para Belgrano (Sede 2) resolviendo BUG-09', async () => {
      const aforoBelgrano = await obtenerAforo(2);

      // En mock inicial hay 1 persona en Belgrano (Camila)
      expect(aforoBelgrano.aforoActual).toBe(1);
      expect(aforoBelgrano.aforoMaximo).toBe(60);
      expect(aforoBelgrano.porcentaje).toBeCloseTo(1.67, 1);
    });

    it('refleja 0 aforo en sedes sin ingresos activos (Caballito / Sede 3)', async () => {
      const aforoCaballito = await obtenerAforo(3);

      expect(aforoCaballito.aforoActual).toBe(0);
      expect(aforoCaballito.aforoMaximo).toBe(50);
      expect(aforoCaballito.porcentaje).toBe(0);
    });
  });

  describe('registrarEgreso', () => {
    it('asigna fechaHoraEgreso y disminuye en 1 el aforo actual de la sede correspondiente', async () => {
      const aforoAntes = await obtenerAforo(1);
      expect(aforoAntes.aforoActual).toBe(2);

      // Egresamos el acceso #2 (Valentina en Palermo)
      const accesoEgresado = await registrarEgreso(2);
      expect(accesoEgresado.fechaHoraEgreso).toBeTruthy();

      const aforoDespues = await obtenerAforo(1);
      expect(aforoDespues.aforoActual).toBe(1);

      const personasAdentro = await listarAccesosActivos(1);
      expect(personasAdentro.some((a) => a.idAcceso === 2)).toBe(false);
    });

    it('lanza error si se intenta egresar un acceso inexistente', async () => {
      await expect(registrarEgreso(99999)).rejects.toThrow('no encontrado');
    });
  });

  describe('validarIngreso & Motivos de Rechazo (RF-04, RN-01, RF-05)', () => {
    it('aprueba un ingreso válido, genera el AccesoDTO e incrementa el aforo', async () => {
      const aforoAntes = await obtenerAforo(1);
      const res = await validarIngreso({ token: 'TEST-OK-30123456', idSede: 1 });

      expect(res.aprobado).toBe(true);
      expect(res.usuario?.dni).toBe('30123456');
      expect(res.acceso).toBeTruthy();
      expect(res.acceso?.fechaHoraEgreso).toBeNull();

      const aforoDespues = await obtenerAforo(1);
      expect(aforoDespues.aforoActual).toBe(aforoAntes.aforoActual + 1);
    });

    it('rechaza con QR_VENCIDO cuando el token indica expiración', async () => {
      const res = await validarIngreso({ token: 'TEST-QR-VENCIDO', idSede: 1 });

      expect(res.aprobado).toBe(false);
      expect(res.motivoRechazo).toBe('QR_VENCIDO');
      expect(res.mensaje).toContain('expirado');
    });

    it('rechaza con MEMBRESIA_INACTIVA cuando el socio no tiene membresía al día', async () => {
      const res = await validarIngreso({ token: 'TEST-MEMBRESIA-INACTIVA', idSede: 1 });

      expect(res.aprobado).toBe(false);
      expect(res.motivoRechazo).toBe('MEMBRESIA_INACTIVA');
      expect(res.mensaje).toContain('inactiva');
    });

    it('rechaza con YA_INGRESADO si el socio ya tiene un acceso activo sin egreso (RN-01)', async () => {
      // Valentina (DNI 28456789) ya está adentro en mock inicial
      const res = await validarIngreso({ token: 'TEST-YA-INGRESADO', idSede: 1 });

      expect(res.aprobado).toBe(false);
      expect(res.motivoRechazo).toBe('YA_INGRESADO');
      expect(res.mensaje).toContain('RN-01');
    });

    it('rechaza con AFORO_COMPLETO cuando la sede alcanza su capacidad máxima (RF-05)', async () => {
      const res = await validarIngreso({ token: 'TEST-AFORO-COMPLETO', idSede: 1 });

      expect(res.aprobado).toBe(false);
      expect(res.motivoRechazo).toBe('AFORO_COMPLETO');
      expect(res.mensaje).toContain('RF-05');
    });
  });

  describe('listarAccesosActivos', () => {
    it('devuelve exclusivamente los accesos con fechaHoraEgreso === null para la sede solicitada', async () => {
      const activosPalermo = await listarAccesosActivos(1);

      expect(activosPalermo.length).toBe(2);
      expect(activosPalermo.every((a) => a.sede.idSede === 1)).toBe(true);
      expect(activosPalermo.every((a) => a.fechaHoraEgreso === null)).toBe(true);
    });
  });
});
