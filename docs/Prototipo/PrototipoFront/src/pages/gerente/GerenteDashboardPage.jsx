import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  Building2, 
  FileText, 
  Download, 
  Sliders, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';

export function GerenteDashboardPage() {
  const { addToast, currentRoute } = useApp();
  const [selectedMonth, setSelectedMonth] = useState('Octubre 2026');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const topSedes = [
    { name: 'Palermo', sep: 68.0, oct: 74.8, socios: '2.184', ocup: '76%', status: 'SOBRE META', badgeVariant: 'green-soft' },
    { name: 'Belgrano', sep: 62.0, oct: 69.2, socios: '1.972', ocup: '82%', status: 'ALTA OCUPACIÓN', badgeVariant: 'gold-soft' },
    { name: 'Caballito', sep: 55.0, oct: 61.7, socios: '1.846', ocup: '71%', status: 'SOBRE META', badgeVariant: 'green-soft' },
    { name: 'Núñez', sep: 48.0, oct: 52.4, socios: '1.540', ocup: '64%', status: 'ESTABLE', badgeVariant: 'navy-soft' },
    { name: 'Córdoba', sep: 44.0, oct: 49.1, socios: '1.620', ocup: '78%', status: 'EN CRECIMIENTO', badgeVariant: 'coral-soft' },
    { name: 'Rosario', sep: 38.0, oct: 42.6, socios: '1.310', ocup: '69%', status: 'ESTABLE', badgeVariant: 'navy-soft' },
  ];

  const handleDownloadExecutiveReport = () => {
    addToast('Reporte Descargado', 'Se descargó el consolidado ejecutivo de 27 sedes en PDF.', 'success');
    setIsReportModalOpen(false);
  };

  const getPageTitle = () => {
    switch (currentRoute) {
      case 'gerente-reportes':
        return {
          title: 'Membresías e Ingresos Consolidados',
          subtitle: 'Análisis comparativo de recaudación por sede y retención de cartera activa'
        };
      case 'gerente-reportes-pdf':
        return {
          title: 'Reportes Ejecutivos Oficiales',
          subtitle: 'Generación, auditoría y descarga consolidada en formato PDF de las 27 sedes'
        };
      case 'gerente-parametros':
        return {
          title: 'Parámetros Globales del Sistema',
          subtitle: 'Configuración de aforos, políticas de reservas y recargos de la red FitZone Sports'
        };
      default:
        return {
          title: 'Rendimiento Consolidado',
          subtitle: 'Octubre 2026 · 27 sedes activas · actualizado hoy 09:42 hs'
        };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            GERENCIA CENTRAL · RED NACIONAL FITZONE SPORTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            {pageInfo.title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {pageInfo.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="red-soft">7 ALERTAS</Badge>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#F26D6D]" />
            <span>Descargar reporte ejecutivo</span>
          </button>
        </div>
      </div>

      {/* 4 Main Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Socios activos"
          value="18.642"
          change="+6,8% interanual"
          changeType="positive"
          icon={Users}
          color="white"
        />

        <StatCard
          title="Ingresos del mes"
          value="$1.284M"
          change="+11,4% vs. septiembre"
          changeType="positive"
          icon={DollarSign}
          color="navy"
        />

        <StatCard
          title="Ocupación promedio"
          value="68,4%"
          change="+3,1 puntos porcentuales"
          changeType="positive"
          icon={Activity}
          color="white"
        />

        <StatCard
          title="Retención 90 días"
          value="87,6%"
          badge={<Badge variant="green-soft" size="xs">SALUDABLE</Badge>}
          subtitle="+2,4 puntos vs. Q2"
          icon={TrendingUp}
          color="white"
        />
      </div>

      {/* Panel contextual: Parámetros del Sistema */}
      {currentRoute === 'gerente-parametros' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-6 animate-slide-up">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-[#1B2A55] font-outfit">
                Parámetros Operativos Centralizados
              </h3>
              <p className="text-xs text-slate-500">Reglas aplicadas a las 27 sedes en tiempo real</p>
            </div>
            <Badge variant="green-soft">SINCRONIZADO</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Beneficio Socio Activo</span>
              <span className="text-xl font-black text-[#1B2A55] block">15% de Descuento</span>
              <p className="text-[11px] text-slate-500">En reservas de canchas y turnos pico.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Recargo Horario Pico</span>
              <span className="text-xl font-black text-[#F26D6D] block">+20% Tarifa</span>
              <p className="text-[11px] text-slate-500">Franja de 19:00 a 21:00 hs en canchas.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Alerta de Aforo Máximo</span>
              <span className="text-xl font-black text-[#E5484D] block">85% Capacidad</span>
              <p className="text-[11px] text-slate-500">Disparo automático de alerta en recepción.</p>
            </div>
          </div>
        </div>
      )}

      {/* Panel contextual: Reportes Ejecutivos PDF */}
      {currentRoute === 'gerente-reportes-pdf' && (
        <div className="bg-[#1B2A55] text-white rounded-3xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-center justify-between gap-6 animate-slide-up">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F0B429]">
              AUDITORÍA Y CIERRE MENSUAL
            </span>
            <h3 className="text-2xl font-black font-outfit">Reporte Consolidado Octubre 2026</h3>
            <p className="text-xs text-slate-300 max-w-lg">
              Incluye balance contable de $1.284M ARS, ocupación media de 68,4% y desglose por cada una de las 27 sedes operativas.
            </p>
          </div>
          <button
            onClick={handleDownloadExecutiveReport}
            className="px-6 py-3.5 bg-[#F26D6D] hover:bg-[#e05959] text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Reporte Completo (PDF)</span>
          </button>
        </div>
      )}

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 cols: Comparative Revenue Bar Chart (Sep vs Oct) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-[#1B2A55] font-outfit">
                Ingresos por sede · Top 6
              </h3>
              <p className="text-xs text-slate-500">
                Comparación mensual consolidada: Septiembre vs. Octubre (en Millones ARS)
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#1B2A55]" />
                <span className="text-slate-700">Octubre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#CBD5E1]" />
                <span className="text-slate-400">Septiembre</span>
              </div>
            </div>
          </div>

          {/* Visual Custom Bar Chart */}
          <div className="space-y-4 pt-2">
            {topSedes.map((sede) => {
              const maxVal = 80;
              const octWidth = (sede.oct / maxVal) * 100;
              const sepWidth = (sede.sep / maxVal) * 100;

              return (
                <div key={sede.name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold">
                    <span className="text-[#1B2A55] font-extrabold">{sede.name}</span>
                    <span className="text-[#1B2A55] font-black">${sede.oct}M <span className="text-slate-400 font-normal">(${sede.sep}M sep)</span></span>
                  </div>

                  <div className="space-y-1">
                    {/* Oct bar */}
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1B2A55] h-full rounded-full transition-all duration-700"
                        style={{ width: `${octWidth}%` }}
                      />
                    </div>
                    {/* Sep bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#CBD5E1] h-full rounded-full transition-all duration-700"
                        style={{ width: `${sepWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 cols: Retention & Membership Health */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#1B2A55] font-outfit">
                Salud de Retención
              </h3>
              <Badge variant="green-soft">SALUDABLE</Badge>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-4 rounded-2xl bg-[#EAF7EE] border border-[#2E9E5B]/20">
                <span className="text-[11px] font-bold text-[#2E9E5B] uppercase block">Renovación mensual</span>
                <span className="text-3xl font-black text-[#1B2A55] block mt-0.5">91,2%</span>
                <span className="text-xs text-slate-500">Renovación automática sobre 18k socios</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Bajas del mes</span>
                  <span className="text-lg font-black text-[#1B2A55] mt-0.5 block">436</span>
                  <span className="text-[10px] text-[#2E9E5B]">−12% vs promedio</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">En riesgo</span>
                  <span className="text-lg font-black text-[#F0B429] mt-0.5 block">218</span>
                  <span className="text-[10px] text-slate-400">Sin acceso +20 días</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
            <span className="font-extrabold text-[#1B2A55] block">12 planes activos · 3 cambios pendientes</span>
            <p className="text-[11px] text-slate-400">Revisión tarifaria programada para el Q4 2026.</p>
          </div>
        </div>

      </div>

      {/* Sede Performance Table */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-[#1B2A55] font-outfit">
              Rendimiento Detallado por Sede
            </h3>
            <p className="text-xs text-slate-500">Ingresos, socios activos, porcentaje de ocupación y cumplimiento de metas</p>
          </div>
          <span className="text-xs font-bold text-[#1B2A55]">
            Mostrando 6 de 27 sedes →
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Sede</th>
                <th className="py-3 px-4">Ingresos Octubre</th>
                <th className="py-3 px-4">Socios Activos</th>
                <th className="py-3 px-4">Ocupación Media</th>
                <th className="py-3 px-4 text-right">Estado Operativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {topSedes.map((s) => (
                <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-black text-[#1B2A55] text-sm">
                    {s.name}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#1B2A55]">
                    ${s.oct}M
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {s.socios}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-700">
                    {s.ocup}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant={s.badgeVariant} size="xs">{s.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Executive Report */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Descargar Reporte Ejecutivo Mensual"
        subtitle="Consolidado de KPIs, ingresos y ocupación de las 27 sedes en formato PDF."
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span>Período:</span>
              <strong className="text-[#1B2A55]">{selectedMonth}</strong>
            </div>
            <div className="flex justify-between">
              <span>Sedes auditadas:</span>
              <strong className="text-[#1B2A55]">27 sedes activas (Argentina)</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Facturación:</span>
              <strong className="text-[#2E9E5B]">$1.284.000.000 ARS</strong>
            </div>
            <div className="flex justify-between">
              <span>Métricas de Retención:</span>
              <strong className="text-[#1B2A55]">87,6% a 90 días</strong>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownloadExecutiveReport}
              className="px-5 py-2.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold rounded-xl shadow flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Generar y Descargar PDF</span>
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
