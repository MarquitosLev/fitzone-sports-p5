import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Activity, 
  DollarSign, 
  Dumbbell, 
  ScanLine, 
  Search, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

export function RecepcionDashboardPage() {
  const { selectedSede, accessLogs, cashRegister, classes, navigate } = useApp();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header with Shift Status & Sede info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            GESTIÓN DE USUARIOS Y MEMBRESÍAS · RECEPCIÓN
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            Operación diaria · {selectedSede}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lunes 5 de octubre · Turno mañana · actualización en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="green">CAJA ABIERTA</Badge>
          <Badge variant="red-soft">3 ALERTAS</Badge>
        </div>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Accesos del día"
          value="184"
          change="+12% vs. lunes anterior"
          icon={Users}
          color="white"
        />

        <StatCard
          title="Aforo actual"
          value="126 / 180"
          badge={<Badge variant="green-soft" size="xs">70% · NORMAL</Badge>}
          subtitle="Nivel saludable"
          icon={Activity}
          color="white"
        />

        <StatCard
          title="Cobros del turno"
          value={`$${cashRegister.totalCollected.toLocaleString('es-AR')}`}
          subtitle={`${cashRegister.operationsCount} operaciones confirmadas`}
          icon={DollarSign}
          color="navy"
        />

        <StatCard
          title="Clases hoy"
          value="6 clases"
          subtitle="142 reservas · 9 en espera"
          icon={Dumbbell}
          color="white"
        />
      </div>

      {/* Main Reception Dashboard Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 cols: Real-time Access Feed & Aforo by Zone */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Live Access Feed */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#1B2A55] font-outfit">
                  Accesos en tiempo real
                </h3>
                <div className="w-2 h-2 rounded-full bg-[#2E9E5B] animate-pulse" />
              </div>
              <button
                onClick={() => navigate('recepcion-scanner')}
                className="text-xs font-bold text-[#1B2A55] hover:text-[#F26D6D] flex items-center gap-1"
              >
                <span>Abrir escáner QR</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {accessLogs.slice(0, 4).map((log) => {
                const isPermitted = log.status === 'PERMITIDO';

                return (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPermitted ? 'bg-[#2E9E5B]/10 text-[#2E9E5B]' : 'bg-[#E5484D]/10 text-[#E5484D]'
                      }`}>
                        {isPermitted ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-[#1B2A55]">{log.name}</h4>
                        <p className="text-[11px] text-slate-500">{log.reason}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-400 block">{log.time}</span>
                      {isPermitted ? (
                        <Badge variant="green-soft" size="xs">PERMITIDO</Badge>
                      ) : (
                        <Badge variant="red-soft" size="xs">DENEGADO</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('recepcion-scanner')}
              className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors text-center block"
            >
              Ver actividad completa →
            </button>
          </div>

          {/* Aforo breakdown by Zone */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1B2A55] font-outfit">
                Ocupación por zonas
              </h3>
              <button
                onClick={() => navigate('recepcion-aforo')}
                className="text-xs font-bold text-[#1B2A55] hover:text-[#F26D6D] flex items-center gap-1"
              >
                <span>Dashboard de aforo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Sala musculación</span>
                  <span className="text-[#1B2A55]">68 / 90 (75%)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2E9E5B] h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Salones y canchas</span>
                  <span className="text-[#1B2A55]">58 / 90 (64%)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2E9E5B] h-full rounded-full" style={{ width: '64%' }} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right 5 cols: Cash Register summary & Quick Action Shortcuts */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Caja del Turno Card */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  CAJA DEL TURNO
                </span>
                <h3 className="text-lg font-black text-[#1B2A55] font-outfit mt-0.5">
                  Caja Palermo 01
                </h3>
              </div>
              <Badge variant="green">ABIERTA</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Membresías cobradas</span>
                <span className="font-bold text-[#1B2A55]">${cashRegister.membershipsCollected.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Reservas de cancha</span>
                <span className="font-bold text-[#1B2A55]">${cashRegister.bookingsCollected.toLocaleString('es-AR')}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-extrabold text-[#1B2A55]">TOTAL COBRADO</span>
                <span className="text-2xl font-black text-[#1B2A55]">${cashRegister.totalCollected.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('recepcion-cash')}
              className="w-full py-3 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-[#F26D6D]" />
              <span>Registrar pago en efectivo</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">Cierre programado: 14:00 hs · Lucía Sánchez</p>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-3">
            <h3 className="text-base font-black text-[#1B2A55] font-outfit">
              Accesos directos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => navigate('recepcion-scanner')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-left border border-slate-100 transition-colors"
              >
                <ScanLine className="w-5 h-5 text-[#F26D6D] mb-1" />
                <span className="font-bold text-xs text-[#1B2A55] block">Validar ingreso QR</span>
                <span className="text-[11px] text-slate-400">Escáner y código manual</span>
              </button>

              <button
                onClick={() => navigate('recepcion-agenda')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-left border border-slate-100 transition-colors"
              >
                <Dumbbell className="w-5 h-5 text-[#1B2A55] mb-1" />
                <span className="font-bold text-xs text-[#1B2A55] block">Agenda de clases</span>
                <span className="text-[11px] text-slate-400">Reservas y asistencia</span>
              </button>

              <button
                onClick={() => navigate('recepcion-courts')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-left border border-slate-100 transition-colors"
              >
                <Layers className="w-5 h-5 text-[#2E9E5B] mb-1" />
                <span className="font-bold text-xs text-[#1B2A55] block">Gestión canchas</span>
                <span className="text-[11px] text-slate-400">Alta y mantenimiento</span>
              </button>

              <button
                onClick={() => navigate('recepcion-attendance')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-left border border-slate-100 transition-colors"
              >
                <Users className="w-5 h-5 text-[#F0B429] mb-1" />
                <span className="font-bold text-xs text-[#1B2A55] block">Asistencia</span>
                <span className="text-[11px] text-slate-400">Marcas de presencia</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
