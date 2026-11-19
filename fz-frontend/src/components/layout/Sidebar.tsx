/**
 * Sidebar.tsx — Barra de navegación lateral.
 *
 * Migrado desde el prototipo (Sidebar.jsx) a TypeScript.
 * Usa `NavLink` de react-router-dom en lugar de un estado manual de ruta.
 * `NavLink` agrega automáticamente la clase "active" al enlace de la ruta actual.
 */

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LogIn, ChevronRight, ChevronDown, Lock } from 'lucide-react';
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
  const esPersonal = usuario?.tipoUsuario === 'RECEPCIONISTA' || usuario?.tipoUsuario === 'GERENTE';
  const { sedeActiva, sedes, setSedeActiva } = useSede();
  const [sedeDropdownOpen, setSedeDropdownOpen] = useState(false);
  const misPrestaciones = usePrestacionesUsuario();

  const esPersonalConSedeFija = Boolean(
    usuario &&
    (usuario.tipoUsuario === 'RECEPCIONISTA' || usuario.tipoUsuario === 'GERENTE') &&
    usuario.idSede
  );

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
        {/* Badge / Selector de sede activa */}
        <div className="relative">
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Sede activa
            </span>
            {esPersonalConSedeFija ? (
              <div className="flex items-center justify-between mt-1">
                <span className="font-extrabold text-fitzone-navy text-sm truncate">
                  {sedeActiva?.nombre ?? 'Sin sede seleccionada'}
                </span>
                <span title="Sede fija de operador asignada por sistema">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </span>
              </div>
            ) : (
              <button
                type="button"
                id="sidebar-sede-selector-btn"
                onClick={() => setSedeDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between mt-1 text-left cursor-pointer group"
                aria-haspopup="listbox"
                aria-expanded={sedeDropdownOpen}
                aria-label="Selector de sede en navegación"
              >
                <span className="font-extrabold text-fitzone-navy text-sm truncate group-hover:text-fitzone-coral transition-colors">
                  {sedeActiva?.nombre ?? 'Seleccionar sede'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-fitzone-green animate-pulse" />
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      sedeDropdownOpen ? 'rotate-180 text-fitzone-navy' : 'group-hover:text-fitzone-navy'
                    }`}
                  />
                </div>
              </button>
            )}
          </div>

          {/* Dropdown de sedes en Sidebar */}
          {sedeDropdownOpen && !esPersonalConSedeFija && (
            <>
              {/* Backdrop para cerrar al hacer click fuera */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setSedeDropdownOpen(false)}
              />
              <div
                role="listbox"
                aria-label="Sedes disponibles"
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-modal border border-slate-100 py-2 z-50 animate-slide-up max-h-60 overflow-y-auto overscroll-contain"
              >
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-4 pt-1 pb-2">
                  Sedes disponibles
                </p>
                {sedes.map((sede) => (
                  <button
                    key={sede.idSede}
                    type="button"
                    role="option"
                    aria-selected={sedeActiva?.idSede === sede.idSede}
                    onClick={() => {
                      setSedeActiva(sede);
                      setSedeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                      sedeActiva?.idSede === sede.idSede
                        ? 'bg-fitzone-navy text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block truncate">{sede.nombre}</span>
                    <span
                      className={`text-[11px] font-medium block ${
                        sedeActiva?.idSede === sede.idSede ? 'text-white/70' : 'text-slate-400'
                      }`}
                    >
                      Aforo máx.: {sede.aforoMaximo} personas
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
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
          {esPersonal ? 'FitZone Sports · Portal de Gestión' : 'FitZone Sports'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar (fijo a la izquierda en pantallas >= lg) ── */}
      <aside className="hidden lg:block w-64 bg-white border-r border-slate-200/80 h-full overflow-y-auto p-4 shrink-0">
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
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl p-4 flex flex-col justify-between z-10 animate-slide-up overflow-y-auto"
            aria-label="Menú móvil"
          >
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
}
