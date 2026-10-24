import { describe, it, expect, beforeEach } from 'vitest';
import {
  listarRoles,
  obtenerRolPorCodigo,
  obtenerPrestacionesPorRol,
  crearRolPersonalizado,
  eliminarRolPersonalizado,
} from '../../services/rolesService';
import { PRESTACIONES } from '../../types/rol';

describe('SCRUM-107: rolesService (RBAC por prestaciones dinámicas)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lista los 4 roles del sistema protegidos por defecto', () => {
    const roles = listarRoles();
    expect(roles.length).toBeGreaterThanOrEqual(4);
    expect(roles.some((r) => r.codigo === 'GERENTE' && r.esSistema)).toBe(true);
    expect(roles.some((r) => r.codigo === 'RECEPCIONISTA' && r.esSistema)).toBe(true);
    expect(roles.some((r) => r.codigo === 'SOCIO' && r.esSistema)).toBe(true);
    expect(roles.some((r) => r.codigo === 'EXTERNO' && r.esSistema)).toBe(true);
  });

  it('el rol GERENTE posee todas las prestaciones atómicas', () => {
    const prestacionesGerente = obtenerPrestacionesPorRol('GERENTE');
    const totalPrestaciones = Object.keys(PRESTACIONES).length;
    expect(prestacionesGerente.length).toBe(totalPrestaciones);
    expect(prestacionesGerente).toContain('ROLES_GESTIONAR');
  });

  it('el rol SOCIO posee prestaciones exclusivas de cliente y no administrativas', () => {
    const prestacionesSocio = obtenerPrestacionesPorRol('SOCIO');
    expect(prestacionesSocio).toContain('ACCESO_MI_QR');
    expect(prestacionesSocio).toContain('CANCHAS_DESCUENTO_SOCIO');
    expect(prestacionesSocio).not.toContain('ROLES_GESTIONAR');
    expect(prestacionesSocio).not.toContain('ACCESO_ESCANEAR');
  });

  it('permite a Gerencia crear un rol personalizado dinámico', () => {
    const nuevo = crearRolPersonalizado({
      codigo: 'INSTRUCTOR',
      nombre: 'Instructor de Clases',
      descripcion: 'Encargado de dictar clases grupales',
      prestaciones: ['CLASES_VER', 'CLASES_ADMIN'],
    });

    expect(nuevo.codigo).toBe('INSTRUCTOR');
    expect(nuevo.esSistema).toBe(false);

    const rolesActualizados = listarRoles();
    expect(rolesActualizados.some((r) => r.codigo === 'INSTRUCTOR')).toBe(true);

    const prestaciones = obtenerPrestacionesPorRol('INSTRUCTOR');
    expect(prestaciones).toEqual(['CLASES_VER', 'CLASES_ADMIN']);
  });

  it('rechaza la creación de roles con código duplicado', () => {
    expect(() =>
      crearRolPersonalizado({
        codigo: 'GERENTE',
        nombre: 'Otro Gerente',
        descripcion: 'Duplicado',
        prestaciones: ['CANCHAS_VER'],
      })
    ).toThrow(/Ya existe un rol/);
  });

  it('permite eliminar un rol personalizado', () => {
    crearRolPersonalizado({
      codigo: 'AUDITOR',
      nombre: 'Auditor Externo',
      descripcion: 'Auditoría',
      prestaciones: ['PAGOS_VER_HISTORIAL'],
    });

    expect(obtenerRolPorCodigo('AUDITOR')).toBeDefined();

    eliminarRolPersonalizado('AUDITOR');
    expect(obtenerRolPorCodigo('AUDITOR')).toBeUndefined();
  });
});
