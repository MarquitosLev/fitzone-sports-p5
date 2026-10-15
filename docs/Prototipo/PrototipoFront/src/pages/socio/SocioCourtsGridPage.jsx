import React, { useState, useMemo } from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { 
  Layers, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ChevronRight, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioCourtsGridPage({ isExterno = false }) {
  const { courts, selectedSede, currentRole, startCourtBooking, navigate } = useApp();
  const [selectedSport, setSelectedSport] = useState('Paddle');

  // Helper para obtener fecha ISO actual en formato YYYY-MM-DD
  const getTodayIso = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayIso = getTodayIso();
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso);

  // Lista dinámica de los próximos 5 días iniciando en el momento actual
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const fullMonthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const quickDays = useMemo(() => {
    return Array.from({ length: 5 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + idx);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = idx === 0 ? 'Hoy' : idx === 1 ? 'Mañana' : `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
      const fullLabel = `${dayNames[d.getDay()]} ${d.getDate()} de ${fullMonthNames[d.getMonth()]} de ${d.getFullYear()}`;
      return { iso, label, fullLabel };
    });
  }, []);

  const currentDayInfo = quickDays.find(q => q.iso === selectedDateIso) || {
    iso: selectedDateIso,
    fullLabel: selectedDateIso
  };

  const sports = ['Paddle', 'Fútbol 5', 'Tenis', 'Básquet'];
  const isMember = currentRole === ROLES.SOCIO_ACTIVO && !isExterno;

  const currentCourt = courts.find(c => c.sport === selectedSport) || courts[0];

  const [selectedSlot, setSelectedSlot] = useState(null);

  // Validación de horario: Verifica si un turno ya pasó en base al momento actual
  const isSlotInPast = (slotTime) => {
    if (selectedDateIso > todayIso) return false;
    if (selectedDateIso < todayIso) return true;

    const [start] = slotTime.split('–');
    const [hours, minutes] = start.trim().split(':').map(Number);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = hours * 60 + (minutes || 0);

    return slotMinutes <= currentMinutes;
  };

  const handleSelectSlot = (court, slot, isPast) => {
    if (isPast || slot.status === 'OCUPADO' || slot.status === 'MANTENIMIENTO' || slot.status === 'RECIEN_TOMADO') return;
    
    const base = slot.isPeak ? court.basePrice * 1.2 : court.basePrice;
    const finalPrice = isMember ? base * 0.85 : base;

    setSelectedSlot({
      courtId: court.id,
      slotId: slot.id,
      time: slot.time,
      isPeak: slot.isPeak,
      price: finalPrice,
      originalPrice: base,
    });
  };

  const handleContinue = () => {
    if (!selectedSlot || !currentCourt) return;
    const rawSlot = currentCourt.slots?.find(s => s.id === selectedSlot.slotId) || {
      time: selectedSlot.time,
      isPeak: selectedSlot.isPeak,
      price: selectedSlot.price
    };
    startCourtBooking(currentCourt, rawSlot, currentDayInfo.fullLabel);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header breadcrumb & info (referencia a módulo técnico eliminada) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            RESERVA DE CANCHAS DEPORTIVAS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            {isMember ? 'Jugá con tu beneficio de socio' : 'Tu próxima cancha te espera'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isMember 
              ? '15% OFF en todos tus turnos (tarifa estándar y horario pico)' 
              : 'Tarifa oficial al instante sin suscripción requerida'}
          </p>
        </div>
      </div>

      {/* Prominencia Visual de la Sede Seleccionada */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#1B2A55]/15 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#1B2A55]/10 flex items-center justify-center text-[#F26D6D] shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              SEDE ACTUALMENTE SELECCIONADA
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#1B2A55] font-outfit tracking-tight mt-0.5">
              {selectedSede}
            </h2>
          </div>
        </div>

        <button
          onClick={() => navigate('sedes')}
          className="px-4 py-2 bg-slate-100 hover:bg-[#1B2A55] text-slate-700 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <span>Cambiar de sede</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sport Selector Pills */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          Tipo de actividad
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => {
                setSelectedSport(sport);
                setSelectedSlot(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSport === sport
                  ? 'bg-[#1B2A55] text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
      </div>

      {/* Date Selector con restricción estricta de fecha mínima actual */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-[#F26D6D]" />
          <div>
            <span className="text-xs font-extrabold text-[#1B2A55] block">
              Día del turno: {currentDayInfo.fullLabel}
            </span>
            <span className="text-[10px] text-slate-400">
              Solo se permiten turnos para el momento actual en adelante.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Date Pills */}
          {quickDays.map((d) => {
            const isSelected = selectedDateIso === d.iso;
            return (
              <button
                key={d.iso}
                onClick={() => {
                  setSelectedDateIso(d.iso);
                  setSelectedSlot(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1B2A55] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            );
          })}

          {/* Date Picker Input with min restricted to today */}
          <input
            type="date"
            min={todayIso}
            value={selectedDateIso}
            onChange={(e) => {
              const val = e.target.value;
              if (val >= todayIso) {
                setSelectedDateIso(val);
                setSelectedSlot(null);
              }
            }}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-[#1B2A55] font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B2A55]"
          />
        </div>
      </div>

      {/* Court Title & Slots Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-[#1B2A55] font-outfit">
                {currentCourt.name}
              </h3>
              <Badge variant="navy-soft">{currentCourt.sport}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentCourt.covered ? 'Cubierta' : 'Descubierta'} · {currentCourt.surface} · Turnos de 1 hora
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tarifa Base</span>
            <span className="text-lg font-black text-[#1B2A55]">
              ${currentCourt.basePrice.toLocaleString('es-AR')} <span className="text-xs font-normal text-slate-400">/ hora</span>
            </span>
          </div>
        </div>

        {/* Time Slots Grid con validación de horarios pasados y descuento tachado */}
        {currentCourt.status === 'EN_MANTENIMIENTO' ? (
          <div className="p-8 bg-[#FEF7E6] rounded-2xl text-center space-y-2 border border-[#F0B429]/30">
            <AlertCircle className="w-8 h-8 text-[#B7791F] mx-auto" />
            <h4 className="font-extrabold text-sm text-[#1B2A55]">Cancha en Mantenimiento</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              {currentCourt.maintenanceReason || 'Reparación del cerramiento.'} ({currentCourt.maintenanceRange})
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(currentCourt.slots || []).map((slot) => {
              const isSelected = selectedSlot?.slotId === slot.id;
              const isPast = isSlotInPast(slot.time);
              const isOccupied = slot.status === 'OCUPADO';
              const isMaintenance = slot.status === 'MANTENIMIENTO';
              const isJustTaken = slot.status === 'RECIEN_TOMADO';
              const isAvailable = !isPast && slot.status === 'DISPONIBLE';

              // Cálculo de precios
              const baseWithPeak = slot.isPeak ? currentCourt.basePrice * 1.2 : currentCourt.basePrice;
              const calculatedPrice = isMember ? baseWithPeak * 0.85 : baseWithPeak;

              let cardStyle = 'bg-slate-50 border-slate-200 hover:border-[#1B2A55] cursor-pointer';
              let statusLabel = slot.isPeak ? 'Pico +20%' : 'Estándar';
              let badgeStatus = isSelected ? 'Seleccionado' : 'Disponible';

              if (isPast) {
                cardStyle = 'bg-slate-100 border-slate-200 opacity-40 cursor-not-allowed';
                badgeStatus = 'Horario pasado';
              } else if (isSelected) {
                cardStyle = 'bg-[#1B2A55] text-white border-[#1B2A55] shadow-lg ring-2 ring-[#F26D6D] scale-102';
              } else if (isOccupied) {
                cardStyle = 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed';
                badgeStatus = 'No disponible';
              } else if (isMaintenance) {
                cardStyle = 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed';
                badgeStatus = 'En mantenimiento';
              } else if (isJustTaken) {
                cardStyle = 'bg-rose-50 border-rose-200 text-rose-700 opacity-75 cursor-not-allowed';
                badgeStatus = 'Recién tomado';
              }

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSelectSlot(currentCourt, slot, isPast)}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[145px] ${cardStyle}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase ${
                        isSelected ? 'text-[#F26D6D]' : slot.isPeak ? 'text-[#F26D6D]' : 'text-slate-400'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className={`font-extrabold text-sm mt-1 ${isSelected ? 'text-white' : 'text-[#1B2A55]'}`}>
                      {slot.time}
                    </div>
                  </div>

                  <div>
                    {/* Visualización de Precios: Para Socio Activo muestra el precio original tachado */}
                    {isMember ? (
                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className={`text-xs line-through font-semibold ${
                            isSelected ? 'text-white/60' : 'text-slate-400'
                          }`}>
                            ${baseWithPeak.toLocaleString('es-AR')}
                          </span>
                          <span className={`text-base font-black ${
                            isSelected ? 'text-white' : 'text-[#1B2A55]'
                          }`}>
                            ${calculatedPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className={`text-base font-black ${isSelected ? 'text-white' : 'text-[#1B2A55]'}`}>
                        ${calculatedPrice.toLocaleString('es-AR')}
                      </div>
                    )}

                    <span className={`text-[10px] font-bold block mt-1 ${
                      isSelected 
                        ? 'text-[#F26D6D]' 
                        : isAvailable 
                        ? 'text-[#2E9E5B]' 
                        : 'text-slate-400'
                    }`}>
                      {badgeStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend / Info guide */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-[#1B2A55] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p><strong>Restricción de reservas:</strong> Solo se pueden reservar turnos para la fecha y horario actuales en adelante. Los horarios previos quedan deshabilitados.</p>
            <p className="text-slate-400 text-[11px]">
              Horario pico: 19:00 a 21:00 hs (+20% sobre tarifa base). {isMember && 'Tu beneficio de Socio Activo (-15%) se aplica directamente sobre el precio final.'}
            </p>
          </div>
        </div>

        {/* Selected Slot Summary Action Bar */}
        {selectedSlot && (
          <div className="p-6 rounded-3xl bg-[#1B2A55] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F26D6D]">
                TU SELECCIÓN
              </span>
              <h4 className="text-xl font-black font-outfit mt-0.5">
                {currentCourt.sport} · {currentCourt.name}
              </h4>
              <p className="text-xs text-slate-300">
                {currentDayInfo.fullLabel} · {selectedSlot.time} · {selectedSede}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Total por 1 hora</span>
                <div className="flex items-baseline gap-2 justify-end">
                  {isMember && selectedSlot.originalPrice && (
                    <span className="text-sm font-bold text-slate-400 line-through">
                      ${selectedSlot.originalPrice.toLocaleString('es-AR')}
                    </span>
                  )}
                  <span className="text-2xl font-black text-[#F0B429]">
                    ${selectedSlot.price.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="px-6 py-3 bg-[#F26D6D] hover:bg-[#e05959] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Continuar con este turno</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
