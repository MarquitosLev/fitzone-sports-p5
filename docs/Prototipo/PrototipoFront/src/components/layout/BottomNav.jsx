import React from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { 
  Home, 
  Layers, 
  Dumbbell, 
  QrCode, 
  Calendar, 
  MapPin, 
  ScanLine, 
  Activity, 
  DollarSign,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';

export function BottomNav() {
  const { currentRoute, navigate, currentRole } = useApp();

  const getNavTabs = () => {
    switch (currentRole) {
      case ROLES.SOCIO_ACTIVO:
      case ROLES.SOCIO_VENCIDO:
        return [
          { id: 'home', label: 'Inicio', icon: Home, route: 'home' },
          { id: 'courts', label: 'Canchas', icon: Layers, route: 'courts' },
          { id: 'qr', label: 'Mi QR', icon: QrCode, route: 'qr', isCenter: true },
          { id: 'classes', label: 'Clases', icon: Dumbbell, route: 'classes' },
          { id: 'more', label: 'Más', icon: MoreHorizontal, route: 'more' },
        ];

      case ROLES.EXTERNO:
        return [
          { id: 'home', label: 'Inicio', icon: Home, route: 'home' },
          { id: 'courts', label: 'Canchas', icon: Layers, route: 'courts' },
          { id: 'reservations', label: 'Reservas', icon: Calendar, route: 'reservations' },
          { id: 'sedes', label: 'Sedes', icon: MapPin, route: 'sedes' },
          { id: 'more', label: 'Más', icon: MoreHorizontal, route: 'more' },
        ];

      case ROLES.RECEPCION:
        return [
          { id: 'recepcion-dashboard', label: 'Inicio', icon: Home, route: 'recepcion-dashboard' },
          { id: 'recepcion-scanner', label: 'Escanear', icon: ScanLine, route: 'recepcion-scanner', isCenter: true },
          { id: 'recepcion-aforo', label: 'Aforo', icon: Activity, route: 'recepcion-aforo' },
          { id: 'recepcion-agenda', label: 'Agenda', icon: Dumbbell, route: 'recepcion-agenda' },
          { id: 'more', label: 'Más', icon: MoreHorizontal, route: 'more' },
        ];

      case ROLES.GERENTE_CENTRAL:
        return [
          { id: 'gerente-dashboard', label: 'Dashboard', icon: TrendingUp, route: 'gerente-dashboard' },
          { id: 'sedes', label: 'Sedes', icon: MapPin, route: 'sedes' },
          { id: 'more', label: 'Más', icon: MoreHorizontal, route: 'more' },
        ];

      default:
        return [];
    }
  };

  const tabs = getNavTabs();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-1.5 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRoute === tab.route;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.route)}
                className="flex flex-col items-center justify-center -mt-5 focus:outline-none group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${
                  isActive ? 'bg-[#F26D6D] text-white ring-4 ring-rose-100' : 'bg-[#1B2A55] text-white'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${
                  isActive ? 'text-[#F26D6D]' : 'text-slate-600'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.route)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors focus:outline-none cursor-pointer ${
                isActive ? 'text-[#1B2A55]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#F26D6D]' : ''}`} />
              <span className={`text-[10px] font-extrabold mt-0.5 ${isActive ? 'text-[#1B2A55]' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
