import { NavLink } from 'react-router-dom';
import { UserCheck, User, ClipboardList, Shield } from 'lucide-react';
import type { TipoUsuario } from '../../types';

interface RolNavItem {
  tipo: TipoUsuario;
  label: string;
  to: string;
  icon: typeof UserCheck;
}

const ROLES_NAV: readonly RolNavItem[] = [
  { tipo: 'SOCIO', label: 'Socio', to: '/rol/socio', icon: UserCheck },
  { tipo: 'EXTERNO', label: 'Externo', to: '/rol/externo', icon: User },
  { tipo: 'RECEPCIONISTA', label: 'Recepcionista', to: '/rol/recepcionista', icon: ClipboardList },
  { tipo: 'GERENTE', label: 'Gerente', to: '/rol/gerente', icon: Shield },
] as const;

/**
 * Barra de navegación rápida entre los 4 roles principales del sistema.
 * Permite verificar visualmente cada ruta de rol (/rol/socio, /rol/externo, /rol/recepcionista, /rol/gerente).
 */
export function RolNav() {
  return (
    <nav aria-label="Navegación de roles" className="flex items-center justify-center gap-2 flex-wrap mb-6">
      {ROLES_NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.tipo}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                isActive
                  ? 'bg-fitzone-navy text-white border-fitzone-navy shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-fitzone-navy hover:border-slate-300'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
