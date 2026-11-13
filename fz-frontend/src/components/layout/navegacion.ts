/**
 * navegacion.ts — Módulos del menú lateral e inicio de cada rol (SCRUM-92).
 * Separado de Sidebar.tsx para poder reutilizarlo en App.tsx y en tests.
 */

import {
  Users,
  CreditCard,
  DoorOpen,
  Dumbbell,
  Layers,
  DollarSign,
  Shield,
  QrCode,
} from 'lucide-react';
import type { Prestacion, TipoUsuario } from '../../types';

export interface NavItem {
  id: string;
  label: string;
  icon: typeof Users;
  to: string;
  prestacion?: Prestacion;
}

/** Módulos que ve un visitante sin sesión: solo lo que el backend expone sin token. */
export const RUTAS_PUBLICAS: readonly string[] = ['/canchas'];

/**
 * Pantalla de inicio de cada rol: a donde llega después del login y a donde vuelve
 * si entra por URL a una sección de otro rol.
 */
export const INICIO_POR_ROL: Record<TipoUsuario, string> = {
  SOCIO: '/mi-qr',
  EXTERNO: '/canchas',
  RECEPCIONISTA: '/acceso',
  GERENTE: '/acceso',
};

/**
 * Módulos del menú con la prestación que exige cada uno. Las prestaciones por rol
 * salen de rolesService (ROLES_BASE_SISTEMA) y siguen la matriz del backend
 * (fz-backend/README.md, "Matriz de permisos por rol", SCRUM-91):
 *   Usuarios / Membresías  → RECEPCIONISTA, GERENTE
 *   Control Acceso         → RECEPCIONISTA, GERENTE
 *   Mi Pase QR             → SOCIO
 *   Clases Grupales        → SOCIO, RECEPCIONISTA, GERENTE (M3 no admite EXTERNO ni visitantes)
 *   Canchas                → todos, incluso visitantes (ver canchas y disponibilidad es público)
 *   Pagos                  → SOCIO, RECEPCIONISTA, GERENTE (el invitado paga en /reserva-invitado/:codigo)
 *   Roles y Accesos        → GERENTE
 */
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { id: 'usuarios',    label: 'Usuarios',        icon: Users,      to: '/usuarios',    prestacion: 'USUARIOS_ADMIN' },
  { id: 'membresias',  label: 'Membresías',      icon: CreditCard, to: '/membresias',  prestacion: 'USUARIOS_ADMIN' },
  { id: 'acceso',      label: 'Control Acceso',  icon: DoorOpen,   to: '/acceso',      prestacion: 'ACCESO_AFORO_VIEW' },
  { id: 'mi-qr',       label: 'Mi Pase QR',      icon: QrCode,     to: '/mi-qr',       prestacion: 'ACCESO_MI_QR' },
  { id: 'clases',      label: 'Clases Grupales', icon: Dumbbell,   to: '/clases',      prestacion: 'CLASES_VER' },
  { id: 'canchas',     label: 'Canchas',         icon: Layers,     to: '/canchas',     prestacion: 'CANCHAS_VER' },
  { id: 'pagos',       label: 'Pagos',           icon: DollarSign, to: '/pagos',       prestacion: 'PAGOS_VER_HISTORIAL' },
  { id: 'roles',       label: 'Roles y Accesos', icon: Shield,     to: '/admin/roles', prestacion: 'ROLES_GESTIONAR' },
];
