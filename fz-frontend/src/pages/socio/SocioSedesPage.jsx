import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MapPin, 
  Search, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Building2,
  Phone,
  Layers
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioSedesPage() {
  const { sedes, selectedSede, setSelectedSede, navigate, addToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSedes = sedes.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSede = (sede) => {
    setSelectedSede(sede.fullName);
    addToast('Sede Actualizada', `Ahora estás navegando en ${sede.fullName}.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            RED NACIONAL FITZONE SPORTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            Elegí tu sede más cercana
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nuestras 25+ sedes disponibles en todo el país con equipamiento de primer nivel
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por barrio, calle o ciudad..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
          />
        </div>
      </div>

      {/* Sedes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSedes.map((s) => {
          const isSelected = selectedSede === s.fullName;
          const aforoPercent = Math.round((s.aforo / s.maxAforo) * 100);

          return (
            <div
              key={s.id}
              className={`bg-white rounded-3xl p-6 shadow-card border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-[#1B2A55] ring-2 ring-[#1B2A55]/20 shadow-card-hover'
                  : 'border-slate-100 hover:shadow-card-hover'
              }`}
            >
              <div className="space-y-4">
                {/* Header with Title and Distance */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-black text-[#1B2A55] font-outfit">
                      {s.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{s.address}</p>
                  </div>
                  <span className="text-xs font-extrabold text-[#F26D6D] bg-rose-50 px-2.5 py-1 rounded-full shrink-0">
                    • {s.distance}
                  </span>
                </div>

                {/* Sede Features snippet */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#1B2A55]" />
                    <span>{s.canchasCount} Canchas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#2E9E5B]" />
                    <span>{s.clasesCount || 20}+ Clases/día</span>
                  </div>
                </div>

                {/* Aforo meter */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <Activity className="w-3 h-3 text-[#F26D6D]" />
                      <span>Aforo en tiempo real</span>
                    </span>
                    <span className="font-extrabold text-[#1B2A55]">{aforoPercent}% ({s.aforo}/{s.maxAforo})</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        aforoPercent >= 80 ? 'bg-[#F26D6D]' : aforoPercent >= 60 ? 'bg-[#F0B429]' : 'bg-[#2E9E5B]'
                      }`}
                      style={{ width: `${aforoPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                {isSelected ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-[#1B2A55] text-white font-bold text-xs rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-[#2E9E5B]" />
                    <span>Sede activa seleccionada</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectSede(s)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-[#1B2A55] text-slate-700 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Seleccionar esta sede</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
