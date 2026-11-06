/**
 * accesoRuta.ts — Decisión pura de acceso a una ruta protegida (SCRUM-92).
 *
 * La usa RoleMiddleware para decidir qué renderizar y el Playground para
 * mostrar la matriz rol × ruta sin montar un router. Al ser una función pura
 * se puede testear sin React.
 */

import type { Prestacion, TipoUsuario } from '../../types';

/** Resultado de evaluar si un usuario puede entrar a una ruta. */
export type ResultadoAccesoRuta =
  /** Puede entrar: se renderizan las rutas hijas. */
  | 'PERMITIDO'
  /** No hay sesión: va a /login?returnTo=... */
  | 'REQUIERE_LOGIN'
  /** Hay sesión pero el rol no alcanza: vuelve a su inicio con un aviso. */
  | 'SIN_PERMISO';

export interface EvaluarAccesoRutaParams {
  /** Rol del usuario logueado, o null si no hay sesión. */
  tipoUsuario: TipoUsuario | null;
  /** Prestaciones del rol del usuario (rolesService.obtenerPrestacionesPorRol). */
  prestacionesUsuario: readonly Prestacion[];
  /** Roles admitidos por la ruta. Si no se indica, no se filtra por rol. */
  allowedRoles?: readonly TipoUsuario[];
  /** Prestación que exige la ruta. Si no se indica, no se filtra por prestación. */
  prestacionRequerida?: Prestacion;
}

export function evaluarAccesoRuta({
  tipoUsuario,
  prestacionesUsuario,
  allowedRoles,
  prestacionRequerida,
}: EvaluarAccesoRutaParams): ResultadoAccesoRuta {
  if (!tipoUsuario) return 'REQUIERE_LOGIN';
  if (allowedRoles && !allowedRoles.includes(tipoUsuario)) return 'SIN_PERMISO';
  if (prestacionRequerida && !prestacionesUsuario.includes(prestacionRequerida)) return 'SIN_PERMISO';
  return 'PERMITIDO';
}
