import React, { useState } from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import {
  Users,
  ShieldAlert,
  UserCheck,
  Building2,
  TrendingUp,
  MapPin,
  Layers,
  ChevronDown,
  Check,
  Sparkles
} from 'lucide-react';

export function RoleSwitcher() {
  const { currentRole, switchRole, selectedSede, setSelectedSede, sedes, navigate, currentRoute } = useApp();
  const [isSocioHovered, setIsSocioHovered] = useState(false);

  const isSocio = currentRole === ROLES.SOCIO_ACTIVO || currentRole === ROLES.SOCIO_VENCIDO;

  const roles = [
    { id: ROLES.EXTERNO, label: 'Cliente Externo', icon: Users, color: 'bg-[#F0B429]' },
    { id: ROLES.RECEPCION, label: 'Recepcionista', icon: Building2, color: 'bg-[#1B2A55]' },
    { id: ROLES.GERENTE_CENTRAL, label: 'Gerente Central', icon: TrendingUp, color: 'bg-purple-600' },
  ];

  return (
    <div className="bg-[#111A36] text-white border-b border-white/10 px-3 py-2 text-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Interactive Role Picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-400 hidden sm:inline flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#F26D6D]" /> Rol de Vista:
          </span>
          <div className="inline-flex bg-white/10 p-1 rounded-xl gap-1 items-center">

            {/* Socio Item with Hover Integration for Socio Activo / Socio Vencido */}
            <div
              className="relative"
              onMouseEnter={() => setIsSocioHovered(true)}
              onMouseLeave={() => setIsSocioHovered(false)}
            >
              <button
                onClick={() => {
                  if (currentRole !== ROLES.SOCIO_ACTIVO && currentRole !== ROLES.SOCIO_VENCIDO) {
                    switchRole(ROLES.SOCIO_ACTIVO);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${isSocio
                    ? currentRole === ROLES.SOCIO_VENCIDO
                      ? 'bg-[#E5484D] text-white shadow-sm scale-105'
                      : 'bg-[#2E9E5B] text-white shadow-sm scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                {currentRole === ROLES.SOCIO_VENCIDO ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5" />
                )}
                <span>
                  {currentRole === ROLES.SOCIO_VENCIDO ? 'Socio (Vencido)' : 'Socio Activo'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Hover Popover: Integración de estado Socio Vencido dentro de Socio Activo */}
              {isSocioHovered && (
                <div className="absolute left-0 mt-1 w-56 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-100 p-1.5 z-50 animate-slide-up">
                  <div className="px-2.5 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Estado de membresía
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      switchRole(ROLES.SOCIO_ACTIVO);
                      setIsSocioHovered(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${currentRole === ROLES.SOCIO_ACTIVO
                        ? 'bg-[#2E9E5B]/10 text-[#2E9E5B] font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2E9E5B]" />
                      Socio Activo (Al día)
                    </span>
                    {currentRole === ROLES.SOCIO_ACTIVO && <Check className="w-3.5 h-3.5 text-[#2E9E5B]" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      switchRole(ROLES.SOCIO_VENCIDO);
                      setIsSocioHovered(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${currentRole === ROLES.SOCIO_VENCIDO
                        ? 'bg-[#E5484D]/10 text-[#E5484D] font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#E5484D]" />
                      Socio Vencido (Prueba regularización)
                    </span>
                    {currentRole === ROLES.SOCIO_VENCIDO && <Check className="w-3.5 h-3.5 text-[#E5484D]" />}
                  </button>
                </div>
              )}
            </div>

            {/* Other Roles */}
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => switchRole(r.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${isActive
                      ? `${r.color} text-white shadow-sm scale-105`
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: UI Kit Playground & Sede selector */}
        <div className="flex items-center gap-2">
          {/* UI Kit Button */}
          <button
            onClick={() => navigate('playground')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              currentRoute === 'playground'
                ? 'bg-[#F26D6D] text-white shadow-sm ring-2 ring-white/30 scale-105'
                : 'bg-white/10 text-slate-200 hover:bg-[#F26D6D] hover:text-white'
            }`}
            title="Abrir Playground / Showcase de Componentes Base (UI Kit)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F0B429]" />
            <span className="font-extrabold tracking-wide">UI Kit</span>
          </button>

          <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg text-slate-200">
            <MapPin className="w-3 h-3 text-[#F26D6D]" />
            <select
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              {sedes.map((s) => (
                <option key={s.id} value={s.fullName} className="bg-[#1B2A55] text-white">
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
