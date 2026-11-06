/**
 * Sidebar.tsx — Barra de navegación lateral.
 *
 * Migrado desde el prototipo (Sidebar.jsx) a TypeScript.
 * Usa `NavLink` de react-router-dom en lugar de un estado manual de ruta.
 * `NavLink` agrega automáticamente la clase "active" al enlace de la ruta actual.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LogIn, ChevronRight } from 'lucide-react';
import { useSede } from '../../context/SedeContext';
import { useAuth } from '../../context/AuthContext';
import { usePrestacionesUsuario } from '../../hooks/usePrestaciones';
import { NAV_ITEMS, RUTAS_PUBLICAS } from './navegacion';
import type { NavItem } from './navegacion';

export interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { sedeActiva } = useSede();
  const misPrestaciones = usePrestacionesUsuario();

  // Visitante sin sesión ve solo lo público (canchas); usuario con sesión ve según prestaciones
  const modulosVisibles = NAV_ITEMS.filter((item) => {
    if (!usuario) {
      return RUTAS_PUBLICAS.includes(item.to);
    }
    return !item.prestacion || misPrestaciones.includes(item.prestacion);
  });

  const itemsVisibles: NavItem[] = modulosVisibles;

  const handleLogout = () => {
    if (onCloseMobile) onCloseMobile();
    logout();
    navigate('/login', { replace: true });
  };

  const handleLogin = () => {
    if (onCloseMobile) onCloseMobile();
    navigate('/login');
  };

  // Contenido de navegación reutilizable tanto para desktop como para mobile drawer
  const renderNavContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Badge de sede activa */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            Sede activa
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-extrabold text-fitzone-navy text-sm truncate">
              {sedeActiva?.nombre ?? 'Sin sede seleccionada'}
            </span>
            {/* Punto verde animado que indica "en línea" */}
            <span className="w-2 h-2 rounded-full bg-fitzone-green animate-pulse" />
          </div>
        </div>

        {/* Lista de navegación */}
        <nav className="space-y-1" aria-label="Navegación principal">
          {itemsVisibles.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.to}
                id={`nav-${item.id}`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all group ${
                    isActive
                      ? 'bg-fitzone-navy text-white shadow-sm'
                      : 'text-slate-600 hover:text-fitzone-navy hover:bg-slate-100/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-fitzone-coral' : 'text-slate-400 group-hover:text-fitzone-navy'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-white/60" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer del Sidebar */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        {usuario ? (
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-fitzone-red hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-fitzone-navy hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar sesión</span>
          </button>
        )}
        <div className="text-[11px] text-slate-400 px-3 text-center">
          FitZone Sports · Portal de Gestión
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar (fijo a la izquierda en pantallas >= lg) ── */}
      <aside className="hidden lg:block w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-64px)] p-4 shrink-0">
        {renderNavContent()}
      </aside>

      {/* ── Mobile Sidebar Drawer (overlay emergente en pantallas < lg) ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop traslúcido */}
          <div
            className="fixed inset-0 bg-fitzone-navy/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Drawer lateral */}
          <aside
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl p-4 flex flex-col justify-between z-10 animate-slide-up"
            aria-label="Menú móvil"
          >
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
}
