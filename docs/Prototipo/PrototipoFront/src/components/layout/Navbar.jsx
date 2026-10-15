import React, { useState } from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { 
  Menu, 
  X, 
  MapPin, 
  LogOut, 
  User, 
  QrCode, 
  Bell, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export function Navbar() {
  const { 
    currentUser, 
    currentRole, 
    selectedSede, 
    setSelectedSede, 
    sedes, 
    navigate, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen,
    switchRole 
  } = useApp();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const getRoleBadge = () => {
    switch (currentRole) {
      case ROLES.SOCIO_ACTIVO:
        return <Badge variant="green-soft">SOCIO ACTIVO</Badge>;
      case ROLES.SOCIO_VENCIDO:
        return <Badge variant="red-soft">MEMBRESÍA VENCIDA</Badge>;
      case ROLES.EXTERNO:
        return <Badge variant="gold-soft">CLIENTE EXTERNO</Badge>;
      case ROLES.RECEPCION:
        return <Badge variant="navy-soft">RECEPCIONISTA</Badge>;
      case ROLES.GERENTE_CENTRAL:
        return <Badge variant="navy">GERENCIA CENTRAL</Badge>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-[41px] z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Sede Indicator */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('home')}
              className="flex items-center gap-3 group focus:outline-none"
            >
              {/* Geometric FitZone Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#1B2A55] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
                  <rect width="64" height="64" rx="16" fill="#1B2A55"/>
                  <path d="M19.5 17H44.5C45.9 17 47 18.1 47 19.5V44.5C47 45.9 45.9 47 44.5 47H19.5C18.1 47 17 45.9 17 44.5V19.5C17 18.1 18.1 17 19.5 17Z" stroke="#F26D6D" strokeWidth="4"/>
                </svg>
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-extrabold text-xl tracking-tight text-[#1B2A55] font-outfit">
                  FitZone
                </span>
                <span className="text-[10px] font-black text-[#F26D6D] tracking-[0.2em]">
                  SPORTS
                </span>
              </div>
            </button>

            {/* Sede indicator (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs font-semibold text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-[#F26D6D]" />
              <span>{selectedSede}</span>
              <button 
                onClick={() => navigate('sedes')}
                className="text-[#1B2A55] hover:text-[#F26D6D] hover:underline font-bold text-[11px] ml-1"
              >
                Cambiar →
              </button>
            </div>
          </div>

          {/* Center: Active Role Badge */}
          <div className="hidden md:flex items-center gap-2">
            {getRoleBadge()}
          </div>

          {/* Right Action Buttons & User Menu */}
          <div className="flex items-center gap-3">
            {/* Socio QR Quick Access button if socio */}
            {(currentRole === ROLES.SOCIO_ACTIVO || currentRole === ROLES.SOCIO_VENCIDO) && (
              <button
                onClick={() => navigate('qr')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B2A55]/5 hover:bg-[#1B2A55]/10 text-[#1B2A55] font-bold text-xs transition-colors border border-[#1B2A55]/15"
                title="Abrir pase QR digital"
              >
                <QrCode className="w-4 h-4 text-[#F26D6D]" />
                <span className="hidden sm:inline">Mi Pase QR</span>
              </button>
            )}

            {/* User Profile trigger with dropdown/modal */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(prev => !prev)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                title="Menú de perfil"
              >
                <div className="w-9 h-9 rounded-xl bg-[#1B2A55] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-slate-200">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.initials || 'FZ'
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-extrabold text-[#1B2A55] leading-tight line-clamp-1">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {currentUser.memberId || currentUser.staffId || currentUser.email}
                  </span>
                </div>
              </button>

              {/* Menú flotante/modal activado por clic/tap en foto de perfil */}
              {isProfileDropdownOpen && (
                <>
                  {/* Backdrop para cerrar al tocar fuera en mobile/desktop */}
                  <div 
                    className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs sm:bg-transparent"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />

                  <div 
                    className="fixed sm:absolute right-4 sm:right-0 top-20 sm:top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50 animate-slide-up"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 1. Nombre completo y 2. Correo electrónico */}
                    <div className="flex items-center gap-3.5 pb-3.5 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-2xl bg-[#1B2A55] text-white flex items-center justify-center font-bold text-base shadow-sm overflow-hidden shrink-0">
                        {currentUser.avatar ? (
                          <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          currentUser.initials || 'FZ'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-[#1B2A55] truncate">
                          {currentUser.name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    {/* 3. Tipo de rol */}
                    <div className="py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Tipo de rol:</span>
                      <div>
                        {getRoleBadge()}
                      </div>
                    </div>

                    {/* Acciones y 4. Opción de Cerrar sesión */}
                    <div className="pt-2 space-y-1">
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate('profile');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Ver mi perfil completo</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate('login');
                        }}
                        className="w-full text-left px-3 py-2.5 text-xs font-bold text-[#E5484D] hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-[#E5484D]" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-[#1B2A55] hover:bg-slate-100 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
