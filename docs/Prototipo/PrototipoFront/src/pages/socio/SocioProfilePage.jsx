import React from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { 
  User, 
  ShieldCheck, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  History,
  Lock,
  FileBadge
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioProfilePage() {
  const { currentUser, currentRole, navigate } = useApp();

  const isExpired = currentRole === ROLES.SOCIO_VENCIDO || currentUser.membershipStatus === 'VENCIDA';

  const handleRenewMembership = () => {
    navigate('checkout', {
      concept: {
        title: 'Membresía · Plan Premium',
        detail: 'Renovación mensual · Oct 2026',
        amount: currentUser.monthlyPrice || 15000,
        userRole: 'Socio',
        voucherType: 'Factura B',
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      
      {/* Warning banner if expired */}
      {isExpired && (
        <div className="bg-[#E5484D] text-white p-5 rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">Tu membresía está vencida</h4>
              <p className="text-xs text-white/90 mt-0.5">
                Renovála hoy para seguir accediendo a tu pase digital, reservas con 15% OFF y clases grupales.
              </p>
            </div>
          </div>
          <button
            onClick={handleRenewMembership}
            className="px-6 py-2.5 bg-white text-[#E5484D] hover:bg-rose-50 font-extrabold text-xs rounded-xl shadow transition-colors shrink-0 cursor-pointer"
          >
            Pagar / Renovar ($15.000)
          </button>
        </div>
      )}

      {/* User Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-[#1B2A55] text-white flex items-center justify-center font-bold text-2xl shadow-lg overflow-hidden border-2 border-slate-100">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.initials || 'MG'
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-[#1B2A55] font-outfit">
                {currentUser.name}
              </h1>
              {isExpired ? (
                <Badge variant="red-soft">MEMBRESÍA VENCIDA</Badge>
              ) : (
                <Badge variant="green-soft">SOCIO ACTIVO</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{currentUser.email}</p>
            <p className="text-xs font-mono text-slate-400">Socio #{currentUser.memberId || 'FZ-18472'}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('history')}
          className="px-4 py-2 bg-slate-100 hover:bg-[#1B2A55] text-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 self-center sm:self-auto cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Ver Facturas y Pagos</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* DESKTOP VIEW: Dos tarjetas independientes (Membresía + Personal) */}
      {/* ============================================================== */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tarjeta 1 Independiente: Mi Membresía */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55]">
                  <FileBadge className="w-5 h-5 text-[#F26D6D]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#1B2A55] font-outfit">Mi Membresía</h2>
                  <p className="text-xs text-slate-400">Detalles de tu plan y estado actual</p>
                </div>
              </div>
              <span className="text-lg font-black text-[#1B2A55]">
                ${currentUser.monthlyPrice?.toLocaleString('es-AR') || '15.000'} <span className="text-xs font-normal text-slate-400">/ mes</span>
              </span>
            </div>

            {/* Plan Info Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Plan Actual</span>
                <span className="text-sm font-extrabold text-[#1B2A55] mt-1 block">
                  {currentUser.plan || 'Plan Premium'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Estado</span>
                <span className={`text-sm font-extrabold mt-1 block ${isExpired ? 'text-[#E5484D]' : 'text-[#2E9E5B]'}`}>
                  {isExpired ? 'VENCIDA' : 'ACTIVO'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Vencimiento</span>
                <span className="text-sm font-extrabold text-[#1B2A55] mt-1 block">
                  {currentUser.validUntil || '15 Nov 2026'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Próxima renovación</span>
                <span className="text-sm font-extrabold text-[#1B2A55] mt-1 block">
                  {currentUser.nextRenewal || '15 Oct 2026'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Sede de registro</span>
              <span className="text-sm font-extrabold text-[#1B2A55] mt-0.5 block">
                {currentUser.sede || 'Sede Palermo'}
              </span>
            </div>

            {/* Historial de cambios */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-extrabold text-[#1B2A55] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" /> Historial de Contrato
              </span>
              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 flex justify-between items-center">
                <span>Alta Plan Premium (Sede Palermo)</span>
                <span className="text-slate-400 font-mono text-[11px]">15 Nov 2025</span>
              </div>
            </div>
          </div>

          {/* Action Button: Pagar / Renovar */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleRenewMembership}
              className="w-full py-3.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-[#F26D6D]" />
              <span>{isExpired ? 'Regularizar y Pagar Membresía' : 'Renovar Cuota Anticipada'}</span>
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
                  <p className="text-xs text-slate-400">Tus datos registrados en la base de socios</p>
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
                <label className="text-slate-400 font-bold block">Documento de Identidad (DNI)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.dni || '32.845.761'}
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
                  value={currentUser.phone || '+54 9 11 4455-8899'}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              Para modificar datos sensibles como DNI o titularidad, acercate a la recepción de tu sede con tu DNI físico.
            </span>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* MOBILE VIEW: Formato de lista unificada */}
      {/* ============================================================== */}
      <div className="md:hidden bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden divide-y divide-slate-100">
        
        {/* Sección 1: Datos de Membresía */}
        <div className="p-4 bg-slate-50/80">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <FileBadge className="w-3.5 h-3.5 text-[#F26D6D]" /> Mi Membresía
          </span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Estado del Abono</span>
          <span className={`font-bold ${isExpired ? 'text-[#E5484D]' : 'text-[#2E9E5B]'}`}>
            {isExpired ? 'Membresía Vencida' : 'Activo (Al día)'}
          </span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Plan Contratado</span>
          <span className="font-bold text-[#1B2A55]">{currentUser.plan || 'Plan Premium'}</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Cuota Mensual</span>
          <span className="font-bold text-[#1B2A55]">
            ${currentUser.monthlyPrice?.toLocaleString('es-AR') || '15.000'} / mes
          </span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Fecha de Vencimiento</span>
          <span className="font-bold text-[#1B2A55]">{currentUser.validUntil || '15 Nov 2026'}</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Próxima Renovación</span>
          <span className="font-bold text-[#1B2A55]">{currentUser.nextRenewal || '15 Oct 2026'}</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Sede de Registro</span>
          <span className="font-bold text-[#1B2A55]">{currentUser.sede || 'Sede Palermo'}</span>
        </div>

        <div className="p-4">
          <button
            onClick={handleRenewMembership}
            className="w-full py-3 bg-[#1B2A55] text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-[#F26D6D]" />
            <span>{isExpired ? 'Pagar / Regularizar Membresía' : 'Renovar Cuota'}</span>
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
          <span className="font-mono font-bold text-[#1B2A55]">{currentUser.dni || '32.845.761'}</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Correo Electrónico</span>
          <span className="font-bold text-[#1B2A55] truncate max-w-[200px]">{currentUser.email}</span>
        </div>

        <div className="p-4 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Teléfono</span>
          <span className="font-bold text-[#1B2A55]">{currentUser.phone || '+54 9 11 4455-8899'}</span>
        </div>

        <div className="p-4 text-[11px] text-slate-400 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Cambios de datos sensibles se realizan presencialmente en recepción.</span>
        </div>

      </div>

    </div>
  );
}
