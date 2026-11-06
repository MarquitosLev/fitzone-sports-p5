/**
 * Header.tsx — Barra de navegación superior.
 *
 * Muestra: logo FitZone | SedeSelector | menú de usuario (placeholder por ahora).
 * El `SedeSelector` usa el `SedeContext` para cambiar la sede activa globalmente.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, User, LogOut, Menu, X, Lock } from 'lucide-react';
import { useSede } from '../../context/SedeContext';
import { useAuth } from '../../context/AuthContext';

export interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({ onToggleMobileMenu, isMobileMenuOpen = false }: HeaderProps) {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { sedeActiva, sedes, setSedeActiva } = useSede();
  const [sedeDropdownOpen, setSedeDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const esPersonalConSedeFija = Boolean(
    usuario &&
    (usuario.tipoUsuario === 'RECEPCIONISTA' || usuario.tipoUsuario === 'GERENTE') &&
    usuario.idSede
  );

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 bg-fitzone-navy border-b border-white/10 sticky top-0 z-30 shadow-md flex items-center shrink-0">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

        {/* ── Logo + Hamburguesa móvil ───────────────────────────────── */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleMobileMenu && (
            <button
              type="button"
              id="mobile-menu-btn"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 -ml-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label={isMobileMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md">
            <span className="font-outfit font-black text-base text-fitzone-navy leading-none">FZ</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-outfit font-extrabold text-lg tracking-tight text-white">FitZone</span>
            <span className="text-[9px] font-black text-fitzone-coral tracking-[0.2em]">SPORTS</span>
          </div>
        </div>

        {/* ── SedeSelector ────────────────────────────────────────────── */}
        {/*
          El SedeSelector permite al recepcionista/gerente cambiar de sede sin recargar.
          Internamente actualiza el SedeContext, lo que hace que todos los servicios
          vuelvan a pedir datos con el nuevo idSede.
        */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            id="sede-selector-btn"
            onClick={() => !esPersonalConSedeFija && setSedeDropdownOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-sm font-semibold text-white transition-all ${
              esPersonalConSedeFija ? 'cursor-default opacity-90' : 'hover:bg-white/15 hover:border-white/25 cursor-pointer'
            }`}
            aria-haspopup="listbox"
            aria-expanded={sedeDropdownOpen}
          >
            <MapPin className="w-4 h-4 text-fitzone-coral shrink-0" />
            <span className="max-w-[180px] truncate">
              {sedeActiva?.nombre ?? 'Seleccionar sede'}
            </span>
            {esPersonalConSedeFija ? (
              <span title="Sede fija de operador asignada por sistema">
                <Lock className="w-3.5 h-3.5 text-white/50 ml-1" />
              </span>
            ) : (
              <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${sedeDropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Dropdown de sedes */}
          {sedeDropdownOpen && !esPersonalConSedeFija && (
            <>
              {/* Backdrop para cerrar al hacer click fuera */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setSedeDropdownOpen(false)}
              />
              <div
                role="listbox"
                aria-label="Selector de sede"
                className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-modal border border-slate-100 py-2 z-50 animate-slide-up"
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
                    <span className="block">{sede.nombre}</span>
                    <span className={`text-[11px] font-medium ${sedeActiva?.idSede === sede.idSede ? 'text-white/70' : 'text-slate-400'}`}>
                      Aforo máx.: {sede.aforoMaximo} personas
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Menú de Usuario (placeholder) ───────────────────────────── */}
        <div className="relative">
          <button
            type="button"
            id="user-menu-btn"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Menú de usuario"
            aria-haspopup="menu"
            aria-expanded={profileDropdownOpen}
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white border border-white/20 flex items-center justify-center font-bold text-xs shadow-sm">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-extrabold text-white leading-tight">
                {usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario'}
              </span>
              <span className="text-[10px] text-fitzone-gold font-bold">
                {usuario ? usuario.tipoUsuario : 'Invitado'}
              </span>
            </div>
          </button>

          {/* Dropdown de perfil */}
          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-modal border border-slate-100 py-2 z-50 animate-slide-up"
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-fitzone-navy truncate">
                    {usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Invitado'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {usuario?.email ?? 'Sin sesión activa'}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-fitzone-red hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
