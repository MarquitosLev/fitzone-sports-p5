/**
 * accesoService.test.ts — Pruebas unitarias para el servicio de accesos físicos y token QR (SCRUM-85).
 */

import { describe, it, expect } from 'vitest';
import { obtenerQrSocio, listarAccesos } from '../accesoService';

describe('accesoService', () => {
  it('genera un token QR dinámico con vencimiento de 60 segundos para el socio en modo mock', async () => {
    const idUsuario = 2;
    const res = await obtenerQrSocio(idUsuario);

    expect(res).toBeDefined();
    expect(res.token).toContain(`FZ-QR-${idUsuario}-`);
    expect(res.expiraEnSegundos).toBe(60);
    expect(res.generadoEn).toBeDefined();
    expect(new Date(res.generadoEn).getTime()).not.toBeNaN();
  });

  it('lista los accesos físicos registrados filtrados por sede', async () => {
    const idSede = 1;
    const accesos = await listarAccesos(idSede);

    expect(Array.isArray(accesos)).toBe(true);
    expect(accesos.length).toBeGreaterThan(0);
    expect(accesos.every((a) => a.sede.idSede === idSede)).toBe(true);
  });
});
