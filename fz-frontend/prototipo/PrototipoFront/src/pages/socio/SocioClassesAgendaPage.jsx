import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Users, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioClassesAgendaPage() {
  const { classes, selectedSede, navigate } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeTab, setActiveTab] = useState('esta-semana'); // 'esta-semana' | 'mis-reservas'

  const categories = ['Todas', 'Funcional', 'Spinning', 'Yoga', 'Pilates', 'Crossfit', 'Boxeo'];

  const filteredClasses = classes.filter((cls) => {
    const matchesCat = selectedCategory === 'Todas' || cls.category === selectedCategory;
    if (activeTab === 'mis-reservas') {
      return matchesCat && (cls.isReservedByCurrentUser || cls.isInWaitlistByCurrentUser);
    }
    return matchesCat;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header breadcrumb & info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            CLASES GRUPALES
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            Agenda de clases
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Elegí tu próximo entrenamiento · Semana del 28 Sep al 4 Oct 2026 · {selectedSede}
          </p>
        </div>

        {/* Tabs: Esta semana vs Mis reservas */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('esta-semana')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'esta-semana'
                ? 'bg-white text-[#1B2A55] shadow-sm'
                : 'text-slate-600 hover:text-[#1B2A55]'
            }`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setActiveTab('mis-reservas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mis-reservas'
                ? 'bg-white text-[#1B2A55] shadow-sm'
                : 'text-slate-600 hover:text-[#1B2A55]'
            }`}
          >
            Mis reservas ({classes.filter(c => c.isReservedByCurrentUser || c.isInWaitlistByCurrentUser).length})
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Actividad:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#1B2A55] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Classes List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>Clases de la semana</span>
          <span>{filteredClasses.length} {filteredClasses.length === 1 ? 'clase' : 'clases'}</span>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-[#1B2A55] text-base">No se encontraron clases</h3>
            <p className="text-xs text-slate-500 mt-1">
              No hay clases programadas para esta categoría o no tenés reservas activas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClasses.map((cls) => {
              const isFull = cls.status === 'COMPLETA' || cls.enrolledCount >= cls.maxCapacity;
              const isCancelled = cls.status === 'CANCELADA';
              const isFinished = cls.status === 'FINALIZADA';
              const freeSpots = Math.max(0, cls.maxCapacity - cls.enrolledCount);

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-3xl p-5 shadow-card hover:shadow-card-hover border border-slate-100 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header with Title and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-[#1B2A55] font-outfit">
                            {cls.title}
                          </h3>
                          {cls.isReservedByCurrentUser && (
                            <Badge variant="green-soft" size="xs">RESERVADA</Badge>
                          )}
                          {cls.isInWaitlistByCurrentUser && (
                            <Badge variant="gold-soft" size="xs">EN ESPERA</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {cls.dateShort} · {cls.room}
                        </p>
                      </div>

                      {/* Status Badges */}
                      {cls.status === 'PROGRAMADA' && <Badge variant="green-soft">PROGRAMADA</Badge>}
                      {cls.status === 'COMPLETA' && <Badge variant="gold-soft">COMPLETA</Badge>}
                      {cls.status === 'CANCELADA' && <Badge variant="red-soft">CANCELADA</Badge>}
                      {cls.status === 'FINALIZADA' && <Badge variant="default">FINALIZADA</Badge>}
                    </div>

                    {/* Class Details Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-[#F26D6D]" />
                        <span className="font-bold text-[#1B2A55]">{cls.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{cls.instructor}</span>
                      </div>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Cupo disponible / máximo</span>
                        <span className="font-extrabold text-[#1B2A55]">
                          {isCancelled ? '— / ' + cls.maxCapacity : `${freeSpots} / ${cls.maxCapacity}`}
                        </span>
                      </div>
                      {!isCancelled && (
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFull ? 'bg-[#F0B429]' : 'bg-[#2E9E5B]'
                            }`}
                            style={{ width: `${Math.min(100, (cls.enrolledCount / cls.maxCapacity) * 100)}%` }}
                          />
                        </div>
                      )}
                      {isCancelled && (
                        <p className="text-[11px] text-[#E5484D] font-medium mt-1">
                          {cls.cancelReason || 'Instructor no disponible. No se tomarán reservas.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    {isCancelled ? (
                      <button
                        onClick={() => navigate('class-detail', { classItem: cls })}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors text-center"
                      >
                        Ver motivo de cancelación
                      </button>
                    ) : isFull ? (
                      <button
                        onClick={() => navigate('waitlist', { classItem: cls })}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#FEF7E6] hover:bg-[#faeed0] text-[#B7791F] font-bold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <span>{cls.isInWaitlistByCurrentUser ? 'Ver mi posición en lista de espera' : 'Ver lista de espera'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('class-detail', { classItem: cls })}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
                      >
                        <span>{cls.isReservedByCurrentUser ? 'Gestionar mi reserva' : 'Ver clase y reservar'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rules and Policy Footer */}
      <div className="bg-slate-100/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-[#1B2A55] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Política de reserva de clases:</strong> Podés reservar hasta 48 h antes del inicio. Si no vas a asistir, cancelá hasta 2 h antes sin penalidad para liberar el lugar a otro socio. Horarios expresados en hora oficial de Buenos Aires.
        </p>
      </div>

    </div>
  );
}
