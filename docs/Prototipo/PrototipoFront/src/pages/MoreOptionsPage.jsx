import React from 'react';
import { useApp, ROLES } from '../context/AppContext';
import { 
  User, 
  History, 
  FileText, 
  CreditCard, 
  MapPin, 
  QrCode, 
  ChevronRight, 
  LogOut, 
  ShieldCheck, 
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export function MoreOptionsPage() {
  const { currentUser, currentRole, navigate } = useApp();

  const isSocio = currentRole === ROLES.SOCIO_ACTIVO || currentRole === ROLES.SOCIO_VENCIDO;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-20">
      
      {/* Header */}
      <div>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          MENÚ GENERAL
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
          Más opciones
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Accedé rápidamente a tu perfil, historial deportivo y facturación
        </p>
      </div>

      {/* Mini Profile Summary Header Card */}
      <div 
        onClick={() => navigate('profile')}
        className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-card flex items-center justify-between gap-4 cursor-pointer hover:border-slate-200 transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2A55] text-white flex items-center justify-center font-bold text-lg overflow-hidden border border-slate-200 shrink-0 shadow-sm">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.initials || 'FZ'
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#1B2A55] group-hover:text-[#F26D6D] transition-colors">
                {currentUser.name}
              </h2>
              {isSocio ? (
                currentUser.membershipStatus === 'VENCIDA' ? (
                  <Badge variant="red-soft" size="xs">VENCIDA</Badge>
                ) : (
                  <Badge variant="green-soft" size="xs">SOCIO ACTIVO</Badge>
                )
              ) : (
                <Badge variant="gold-soft" size="xs">CLIENTE EXTERNO</Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
            <span className="text-[11px] font-mono text-slate-400">
              {currentUser.memberId ? `Socio #${currentUser.memberId}` : currentUser.staffId || 'Cliente FitZone'}
            </span>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#1B2A55] group-hover:text-white transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN 1: MI PERFIL Y MEMBRESÍA */}
      {/* ============================================================== */}
      <div className="space-y-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
          Mi Perfil y Membresía
        </span>
        <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden divide-y divide-slate-100">
          
          <button
            onClick={() => navigate('profile')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55] group-hover:bg-[#1B2A55] group-hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#1B2A55] block">
                  Mi Perfil
                </span>
                <span className="text-xs text-slate-400">
                  Datos personales, DNI, teléfono y correo electrónico
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
          </button>

          <button
            onClick={() => navigate('profile')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#2E9E5B]/10 flex items-center justify-center text-[#2E9E5B] group-hover:bg-[#2E9E5B] group-hover:text-white transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#1B2A55] block">
                  Estado de Membresía
                </span>
                <span className="text-xs text-slate-400">
                  {currentUser.plan || 'Plan Premium'} · {currentUser.membershipStatus === 'VENCIDA' ? 'Renovación requerida' : 'Beneficios activos al 15% OFF'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
          </button>

          {isSocio && (
            <button
              onClick={() => navigate('qr')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F26D6D]/10 flex items-center justify-center text-[#F26D6D] group-hover:bg-[#F26D6D] group-hover:text-white transition-colors">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-[#1B2A55] block">
                    Pase Digital QR
                  </span>
                  <span className="text-xs text-slate-400">
                    Código de acceso dinámico para ingreso en molinetes
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
            </button>
          )}

        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN 2: HISTORIAL DE ACTIVIDAD */}
      {/* ============================================================== */}
      <div className="space-y-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
          Historial Deportivo
        </span>
        <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden divide-y divide-slate-100">
          
          <button
            onClick={() => navigate('reservations')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F0B429]/15 flex items-center justify-center text-[#B7791F] group-hover:bg-[#F0B429] group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#1B2A55] block">
                  Historial y Reservas de Cancha
                </span>
                <span className="text-xs text-slate-400">
                  Turnos activos de Paddle, Fútbol 5, Tenis y Básquet
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
          </button>

          {isSocio && (
            <button
              onClick={() => navigate('classes')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-[#1B2A55] block">
                    Historial de Clases Grupales
                  </span>
                  <span className="text-xs text-slate-400">
                    Asistencias, reservas e inscripciones a salas fitness
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
            </button>
          )}

        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN 3: FACTURAS Y PAGOS */}
      {/* ============================================================== */}
      <div className="space-y-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
          Pagos y Facturación
        </span>
        <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden divide-y divide-slate-100">
          
          <button
            onClick={() => navigate('history')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55] group-hover:bg-[#1B2A55] group-hover:text-white transition-colors">
                <FileText className="w-5 h-5 text-[#F26D6D]" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#1B2A55] block">
                  Facturas y Recibos Fiscales
                </span>
                <span className="text-xs text-slate-400">
                  Comprobantes oficiales AFIP, CAE y facturas electrónicas
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
          </button>

          <button
            onClick={() => navigate('history')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#2E9E5B]/10 flex items-center justify-center text-[#2E9E5B] group-hover:bg-[#2E9E5B] group-hover:text-white transition-colors">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#1B2A55] block">
                  Historial de Pagos y Transacciones
                </span>
                <span className="text-xs text-slate-400">
                  Cuotas de membresía, señas y alquileres abonados
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
          </button>

        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN 4: SEDES Y SESIÓN */}
      {/* ============================================================== */}
      <div className="space-y-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
          Sedes y Cuenta
        </span>
        <div className="bg-white rounded-3xl shadow-card border border-slate-100 overflow-hidden divide-y divide-slate-100">
          
          <button
            onClick={() => navigate('sedes')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55] group-hover:bg-[#1B2A55] group-hover:text-white transition-colors">
                <MapPin className="w-5 h-5 text-[#F26D6D]" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#1B2A55] block">
                  Red Nacional de Sedes
                </span>
                <span className="text-xs text-slate-400">
                  Ver direcciones, canchas y aforos en tiempo real
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
          </button>

          <button
            onClick={() => navigate('playground')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F26D6D]/10 flex items-center justify-center text-[#F26D6D] group-hover:bg-[#F26D6D] group-hover:text-white transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#1B2A55] block">
                  Librería de Componentes (UI Kit)
                </span>
                <span className="text-xs text-slate-400">
                  Explorar componentes base, variantes y estados interactivos
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1B2A55] transition-colors" />
          </button>

          <button
            onClick={() => navigate('login')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E5484D]/10 flex items-center justify-center text-[#E5484D] group-hover:bg-[#E5484D] group-hover:text-white transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-[#E5484D] block">
                  Cerrar Sesión
                </span>
                <span className="text-xs text-slate-400">
                  Finalizar sesión actual en este dispositivo
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#E5484D] transition-colors" />
          </button>

        </div>
      </div>

    </div>
  );
}
