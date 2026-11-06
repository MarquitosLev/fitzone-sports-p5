import { describe, it, expect } from 'vitest';
import {
  listarRoles,
  obtenerRolPorCodigo,
  obtenerPrestacionesPorRol,
  PRESTACIONES_EXCLUSIVAS_SOCIO,
} from '../../services/rolesService';
import { PRESTACIONES } from '../../types/rol';

describe('SCRUM-107: rolesService (RBAC por prestaciones dinámicas)', () => {
  it('lista los 4 roles del sistema protegidos por defecto', () => {
    const roles = listarRoles();
    expect(roles.length).toBeGreaterThanOrEqual(4);
    expect(roles.some((r) => r.codigo === 'GERENTE' && r.esSistema)).toBe(true);
    expect(roles.some((r) => r.codigo === 'RECEPCIONISTA' && r.esSistema)).toBe(true);
    expect(roles.some((r) => r.codigo === 'SOCIO' && r.esSistema)).toBe(true);
    expect(roles.some((r) => r.codigo === 'EXTERNO' && r.esSistema)).toBe(true);
  });

  it('el rol GERENTE posee todas las prestaciones salvo las exclusivas del socio', () => {
    const prestacionesGerente = obtenerPrestacionesPorRol('GERENTE');
    const totalPrestaciones = Object.keys(PRESTACIONES).length;
    expect(prestacionesGerente.length).toBe(totalPrestaciones - PRESTACIONES_EXCLUSIVAS_SOCIO.length);
    expect(prestacionesGerente).toContain('ROLES_GESTIONAR');
    expect(prestacionesGerente).not.toContain('ACCESO_MI_QR');
  });

  it('el rol SOCIO posee prestaciones exclusivas de cliente y no administrativas', () => {
    const prestacionesSocio = obtenerPrestacionesPorRol('SOCIO');
    expect(prestacionesSocio).toContain('ACCESO_MI_QR');
    expect(prestacionesSocio).toContain('CANCHAS_DESCUENTO_SOCIO');
    expect(prestacionesSocio).not.toContain('ROLES_GESTIONAR');
    expect(prestacionesSocio).not.toContain('ACCESO_ESCANEAR');
  });

  it('solo existen los cuatro roles del backend', () => {
    expect(listarRoles().map((r) => r.codigo)).toEqual(['GERENTE', 'RECEPCIONISTA', 'SOCIO', 'EXTERNO']);
    expect(obtenerRolPorCodigo('INSTRUCTOR')).toBeUndefined();
  });
});
