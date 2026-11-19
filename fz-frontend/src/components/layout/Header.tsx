/**
 * Header.tsx — Barra de navegación superior.
 *
 * Muestra: logo FitZone | menú de usuario / inicio de sesión.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({ onToggleMobileMenu, isMobileMenuOpen = false }: HeaderProps) {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

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

        {/* ── Usuario con sesión: perfil y cierre de sesión. Sin sesión: el visitante es un cliente externo ── */}
        {usuario ? (
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
                  {`${usuario.nombre} ${usuario.apellido}`}
                </span>
                <span className="text-[10px] text-fitzone-gold font-bold">
                  {usuario.tipoUsuario}
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
                      {`${usuario.nombre} ${usuario.apellido}`}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {usuario.email}
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
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-xs font-extrabold text-white/90 mr-1">Cliente externo</span>
            <button
              type="button"
              id="login-btn"
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white border border-white/25 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              id="hacete-socio-btn"
              onClick={() => navigate('/registro')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-fitzone-coral text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Hacete socio
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
