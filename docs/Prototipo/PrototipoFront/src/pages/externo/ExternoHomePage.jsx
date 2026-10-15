import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  Calendar, 
  Sparkles, 
  MapPin, 
  ArrowRight, 
  Dumbbell, 
  CheckCircle2, 
  ShieldPlus 
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function ExternoHomePage() {
  const { currentUser, navigate, selectedSede, courtBookings } = useApp();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#1B2A55] to-[#111A36] text-white rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F0B429]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#F0B429]" />
              <span>Cliente Externo · Sin suscripción requerida</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-outfit tracking-tight text-white">
              ¡Te damos la bienvenida, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              ¿Querés jugar hoy? Reservá canchas en cualquier sede al instante sin necesidad de membresía activa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('courts')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#F26D6D] hover:bg-[#e05959] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Reservar Cancha</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Reservar Cancha */}
        <div 
          onClick={() => navigate('courts')}
          className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-slate-100 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F26D6D]/15 flex items-center justify-center text-[#F26D6D] mb-4 group-hover:bg-[#F26D6D] group-hover:text-white transition-colors">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#1B2A55] group-hover:text-[#F26D6D] transition-colors">
              Reservar Cancha
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Encontrá espacios libres de fútbol 5, tenis, básquet y paddle en {selectedSede}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1B2A55] group-hover:text-[#F26D6D]">
            <span>Ver turnos y tarifas</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Card 2: Mis Reservas */}
        <div 
          onClick={() => navigate('reservations')}
          className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-slate-100 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55] mb-4 group-hover:bg-[#1B2A55] group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-[#1B2A55] group-hover:text-[#1B2A55] transition-colors">
              Mis Reservas
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Administrá tus próximos turnos, pagos y cancelaciones
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1B2A55]">
            <span>Ver mis turnos</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Card 3: Ascender a Socio Plan Premium */}
        <div 
          onClick={() => navigate('profile')}
          className="bg-gradient-to-br from-[#FEF7E6] to-[#FEEAEA] rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-[#F0B429]/30 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#F0B429] flex items-center justify-center text-[#1B2A55] mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <ShieldPlus className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#1B2A55]">
                Hacete Socio FitZone
              </h3>
              <Badge variant="coral">−15% OFF</Badge>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              Obtené 15% de descuento en todos los turnos, acceso a 25+ clases grupales y pase digital QR.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#F0B429]/30 flex items-center justify-between text-xs font-bold text-[#1B2A55]">
            <span>Conocer Plan Premium ($15.000/mes)</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

      </div>

    </div>
  );
}
