import React from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { 
  Home, 
  Calendar, 
  Dumbbell, 
  QrCode, 
  MapPin, 
  CreditCard, 
  User, 
  Layers, 
  ScanLine, 
  Activity, 
  ClipboardCheck, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Sliders,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function Sidebar() {
  const { currentRoute, navigate, currentRole, selectedSede } = useApp();

  const getNavItems = () => {
    switch (currentRole) {
      case ROLES.SOCIO_ACTIVO:
      case ROLES.SOCIO_VENCIDO:
        return [
          { id: 'home', label: 'Inicio', icon: Home, route: 'home' },
          { id: 'courts', label: 'Canchas', icon: Layers, route: 'courts', badge: '−15%' },
          { id: 'reservations', label: 'Mis reservas', icon: Calendar, route: 'reservations' },
          { id: 'classes', label: 'Clases grupales', icon: Dumbbell, route: 'classes' },
          // Resaltado rojo únicamente si el socio se encuentra en estado VENCIDO
          { id: 'qr', label: 'Mi acceso QR', icon: QrCode, route: 'qr', highlight: currentRole === ROLES.SOCIO_VENCIDO },
          { id: 'sedes', label: 'Sedes', icon: MapPin, route: 'sedes' },
          { id: 'history', label: 'Pagos y facturas', icon: CreditCard, route: 'history' },
          { id: 'profile', label: 'Mi perfil', icon: User, route: 'profile' },
        ];

      case ROLES.EXTERNO:
        return [
          { id: 'home', label: 'Inicio', icon: Home, route: 'home' },
          { id: 'courts', label: 'Reservar Cancha', icon: Layers, route: 'courts' },
          { id: 'reservations', label: 'Mis reservas', icon: Calendar, route: 'reservations' },
          { id: 'sedes', label: 'Sedes disponibles', icon: MapPin, route: 'sedes' },
          { id: 'profile', label: 'Mi perfil', icon: User, route: 'profile' },
        ];

      case ROLES.RECEPCION:
        return [
          { id: 'recepcion-dashboard', label: 'Inicio / Turno', icon: Home, route: 'recepcion-dashboard' },
          // Sin resaltado rojo ni alertas en Validar acceso QR
          { id: 'recepcion-scanner', label: 'Validar acceso QR', icon: ScanLine, route: 'recepcion-scanner' },
          { id: 'recepcion-aforo', label: 'Control de Aforo', icon: Activity, route: 'recepcion-aforo' },
          { id: 'recepcion-agenda', label: 'Gestión de Agenda', icon: Dumbbell, route: 'recepcion-agenda' },
          { id: 'recepcion-attendance', label: 'Toma de asistencia', icon: ClipboardCheck, route: 'recepcion-attendance' },
          { id: 'recepcion-courts', label: 'Gestión de canchas', icon: Layers, route: 'recepcion-courts' },
          { id: 'recepcion-cash', label: 'Cobros en efectivo', icon: DollarSign, route: 'recepcion-cash' },
        ];

      case ROLES.GERENTE_CENTRAL:
        return [
          { id: 'gerente-dashboard', label: 'Resumen ejecutivo', icon: TrendingUp, route: 'gerente-dashboard' },
          { id: 'sedes', label: 'Sedes (27)', icon: MapPin, route: 'sedes' },
          { id: 'gerente-reportes', label: 'Membresías e Ingresos', icon: CreditCard, route: 'gerente-reportes' },
          { id: 'gerente-reportes-pdf', label: 'Reportes ejecutivos', icon: FileText, route: 'gerente-reportes-pdf' },
          { id: 'gerente-parametros', label: 'Parámetros del sistema', icon: Sliders, route: 'gerente-parametros' },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-105px)] p-4 shrink-0 justify-between">
      <div className="space-y-6">
        {/* Sede badge info */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
            UBICACIÓN SELECCIONADA
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-extrabold text-[#1B2A55] text-sm truncate">
              {selectedSede}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#2E9E5B] animate-pulse" />
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-[#1B2A55] text-white shadow-sm'
                    : item.highlight
                    ? 'bg-[#E5484D]/10 text-[#E5484D] hover:bg-[#E5484D]/20'
                    : 'text-slate-600 hover:text-[#1B2A55] hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive 
                      ? 'text-[#F26D6D]' 
                      : item.highlight 
                      ? 'text-[#E5484D]' 
                      : 'text-slate-400 group-hover:text-[#1B2A55]'
                  }`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-[#F26D6D] text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-white/60" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar Footer */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <button
          onClick={() => navigate('playground')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentRoute === 'playground'
              ? 'bg-[#1B2A55] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#1B2A55] hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#F26D6D]" />
            <span>UI Kit Playground</span>
          </div>
          <span className="text-[10px] font-black uppercase bg-[#F26D6D]/15 text-[#F26D6D] px-1.5 py-0.5 rounded-md">
            UI
          </span>
        </button>

        <button
          onClick={() => navigate('login')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-[#E5484D] hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>

        <div className="text-[11px] text-slate-400 px-3 text-center">
          FitZone Sports · Portal de Gestión
        </div>
      </div>
    </aside>
  );
}
