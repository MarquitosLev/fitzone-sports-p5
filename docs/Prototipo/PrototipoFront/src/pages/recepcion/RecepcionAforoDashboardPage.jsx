import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  Layers, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function RecepcionAforoDashboardPage() {
  const { selectedSede, sedes, accessLogs, navigate } = useApp();

  const currentSedeObj = sedes.find(s => s.fullName === selectedSede) || sedes[0];
  const aforoPercent = Math.round((currentSedeObj.aforo / currentSedeObj.maxAforo) * 100);
  const remainingSpots = Math.max(0, currentSedeObj.maxAforo - currentSedeObj.aforo);
  const isHighAlert = aforoPercent >= 85;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            CONTROL DE ACCESO Y CAPACIDAD
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            Ocupación y Aforo en Tiempo Real
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedSede} · actualizado automáticamente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isHighAlert ? 'red' : 'green'}>
            {isHighAlert ? 'ALERTA DE CAPACIDAD' : 'DATOS EN VIVO'}
          </Badge>
        </div>
      </div>

      {/* Main Realtime Meter Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              AFORO ACTUAL EN SEDE
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-5xl sm:text-6xl font-black text-[#1B2A55] font-outfit">
                {aforoPercent}%
              </h2>
              <span className="text-xl font-extrabold text-slate-500">
                {currentSedeObj.aforo} <span className="text-sm font-medium text-slate-400">/ {currentSedeObj.maxAforo} personas</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Capacidad total autorizada por normativa municipal
            </p>
          </div>

          <div className="text-left md:text-right space-y-1">
            <span className="text-xs font-bold uppercase text-slate-400 block">Disponibilidad libre</span>
            <span className="text-3xl font-black text-[#2E9E5B]">{remainingSpots} lugares</span>
            <span className="text-xs text-slate-400 block">+8 personas en los últimos 30 min</span>
          </div>
        </div>

        {/* Progress Bar Meter */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isHighAlert ? 'bg-[#E5484D]' : aforoPercent >= 70 ? 'bg-[#F0B429]' : 'bg-[#2E9E5B]'
              }`}
              style={{ width: `${Math.min(100, aforoPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>0 · Disponible</span>
            <span>50%</span>
            <span>{currentSedeObj.maxAforo} · Máximo permitido</span>
          </div>
        </div>

        {/* Capacity Warning Banner if high */}
        {isHighAlert && (
          <div className="p-4 rounded-2xl bg-[#FDECEE] border border-[#E5484D]/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#E5484D] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-[#E5484D]">La sede se acerca al aforo máximo</h4>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                Quedan solo {remainingSpots} lugares disponibles. Avisá a recepción si se forma una cola de espera en molinetes.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Breakdown by Zone & Movements Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Zone Distribution */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
          <h3 className="text-base font-black text-[#1B2A55] font-outfit">
            Ocupación por Salas
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Sala de Musculación y Cardio</span>
                <span className="text-[#1B2A55]">68 / 90 (75%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2E9E5B] h-full rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Salones de Clases Grupales</span>
                <span className="text-[#1B2A55]">34 / 50 (68%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2E9E5B] h-full rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700">Canchas Deportivas (Paddle/Fútbol/Tenis)</span>
                <span className="text-[#1B2A55]">24 / 40 (60%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#2E9E5B] h-full rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Movements (Ingresos y Egresos) */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#1B2A55] font-outfit">
              Últimos ingresos y egresos
            </h3>
            <span className="text-xs text-slate-400 font-medium">Movimientos de hoy</span>
          </div>

          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
            {accessLogs.slice(0, 5).map((log) => {
              const isIngreso = log.type === 'Ingreso';
              const isPermitted = log.status === 'PERMITIDO';

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${
                      !isPermitted 
                        ? 'bg-rose-100 text-[#E5484D]' 
                        : isIngreso 
                        ? 'bg-emerald-100 text-[#2E9E5B]' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isIngreso ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-[#1B2A55] block">{log.name}</span>
                      <span className="text-[11px] text-slate-500">{log.type} · {log.reason}</span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-slate-500">{log.time}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
