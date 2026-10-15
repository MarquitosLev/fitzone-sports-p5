import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  FileBadge
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function ExternoProfilePage() {
  const { currentUser, navigate } = useApp();

  const handleSubscribe = () => {
    navigate('checkout', {
      concept: {
        title: 'Alta Membresía · Plan Premium',
        detail: 'Primer mes · Acceso total a clases y -15% en canchas',
        amount: 15000,
        userRole: 'Cliente Externo → Socio',
        voucherType: 'Factura B',
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-[#1B2A55] text-white flex items-center justify-center font-bold text-2xl shadow-lg overflow-hidden border-2 border-slate-100">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.initials || 'LS'
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-[#1B2A55] font-outfit">
                {currentUser.name}
              </h1>
              <Badge variant="gold-soft">CLIENTE EXTERNO</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">{currentUser.email}</p>
            <p className="text-xs font-mono text-slate-400">ID #{currentUser.memberId || 'EXT-9921'}</p>
          </div>
        </div>

        <button
          onClick={handleSubscribe}
          className="px-4 py-2 bg-[#F26D6D] hover:bg-[#e05959] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-center sm:self-auto cursor-pointer shadow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hacerme Socio (15% OFF)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP VIEW: Dos tarjetas independientes (Membresía + Personal) */}
      {/* ============================================================== */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tarjeta 1 Independiente: Mi Membresía / Beneficios */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55]">
                  <FileBadge className="w-5 h-5 text-[#F26D6D]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1B2A55] font-outfit">Mi Membresía</h2>
                  <p className="text-xs text-slate-400">Estado de suscripción actual</p>
                </div>
              </div>
              <Badge variant="default">SIN_SUSCRIPCIÓN</Badge>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1B2A55] to-[#111A36] text-white space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F0B429]">
                  PLAN RECOMENDADO
                </span>
                <h3 className="text-xl font-black font-outfit mt-0.5">Plan Premium FitZone</h3>
                <p className="text-xs text-slate-300 mt-0.5">$15.000 / mes · acceso a 27 sedes</p>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E5B] shrink-0" />
                  <span>15% OFF en todas las reservas de canchas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E5B] shrink-0" />
                  <span>Acceso libre e ilimitado a clases grupales</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E9E5B] shrink-0" />
                  <span>Pase digital QR dinámico en molinetes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSubscribe}
              className="w-full py-3.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-[#F26D6D]" />
              <span>Suscribirme al Plan Premium</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tarjeta 2 Independiente: Información Personal */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55]">
                  <User className="w-5 h-5 text-[#F26D6D]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1B2A55] font-outfit">Información Personal</h2>
                  <p className="text-xs text-slate-400">Datos registrados para reservas y comprobantes</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Nombre Completo</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.name}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">DNI</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.dni || '35.120.449'}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Correo Electrónico</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Teléfono de Contacto</label>
                <input
                  type="tel"
                  disabled
                  value={currentUser.phone || '+54 9 11 5566-7788'}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* MOBILE VIEW: Formato de lista unificada */}
      {/* ============================================================== */}
      <div className="md:hidden bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden divide-y divide-slate-100">
        
        {/* Sección 1: Membresía */}
        <div className="p-4 bg-slate-50/80">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <FileBadge className="w-3.5 h-3.5 text-[#F26D6D]" /> Estado de Membresía
          </span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Estado</span>
          <span className="font-bold text-slate-600">Cliente Externo (Sin abono)</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Beneficio</span>
          <span className="font-bold text-[#F0B429]">Tarifa Estándar Canchas</span>
        </div>

        <div className="p-4">
          <button
            onClick={handleSubscribe}
            className="w-full py-3 bg-[#1B2A55] text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#F26D6D]" />
            <span>Hacerme Socio (15% OFF en Canchas)</span>
          </button>
        </div>

        {/* Sección 2: Información Personal */}
        <div className="p-4 bg-slate-50/80">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#F26D6D]" /> Información Personal
          </span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Nombre Completo</span>
          <span className="font-bold text-[#1B2A55]">{currentUser.name}</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Documento (DNI)</span>
          <span className="font-mono font-bold text-[#1B2A55]">{currentUser.dni || '35.120.449'}</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Correo Electrónico</span>
          <span className="font-bold text-[#1B2A55] truncate max-w-[200px]">{currentUser.email}</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Teléfono</span>
          <span className="font-bold text-[#1B2A55]">{currentUser.phone || '+54 9 11 5566-7788'}</span>
        </div>

      </div>

    </div>
  );
}
