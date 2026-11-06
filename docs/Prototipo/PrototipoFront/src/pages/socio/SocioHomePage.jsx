import React from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { 
  Dumbbell, 
  Layers, 
  CreditCard, 
  QrCode, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioHomePage() {
  const { currentUser, currentRole, navigate, selectedSede, courtBookings, classes } = useApp();

  const isExpired = currentRole === ROLES.SOCIO_VENCIDO || currentUser.membershipStatus === 'VENCIDA';

  // Find next confirmed booking
  const nextBooking = courtBookings.find(b => b.status === 'CONFIRMADA');
  const pendingBooking = courtBookings.find(b => b.status === 'PENDIENTE_PAGO');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Warning banner if expired */}
      {isExpired && (
        <div className="bg-[#E5484D] text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm">Tu membresía está vencida</h4>
              <p className="text-xs text-white/90">
                Renovála para seguir accediendo al gimnasio, reservar con 15% de descuento y acceder con tu QR digital.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('profile')}
            className="px-4 py-2 bg-white text-[#E5484D] font-extrabold text-xs rounded-xl shadow hover:bg-rose-50 transition-colors shrink-0"
          >
            Pagar / Renovar $15.000
          </button>
        </div>
      )}

      {/* Hero Header Greeting */}
      <div className="bg-gradient-to-br from-[#1B2A55] to-[#111A36] text-white rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F26D6D]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#F0B429]" />
              <span>Sede actual: {selectedSede}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-outfit tracking-tight text-white">
              ¡Hola de nuevo, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Tenés beneficio del <strong className="text-[#F26D6D]">15% OFF</strong> en reservas de canchas y acceso libre a todas las clases grupales.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('qr')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#F26D6D] hover:bg-[#e05959] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all hover:scale-105"
            >
              <QrCode className="w-4 h-4" />
              <span>Abrir Pase QR</span>
            </button>
            <button
              onClick={() => navigate('courts')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md transition-all border border-white/20"
            >
              <span>Reservar Cancha</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Notifications / Reminders banner if pending or confirmed booking */}
      {(pendingBooking || nextBooking) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingBooking && (
            <div className="bg-[#FEF7E6] border border-[#F0B429]/40 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F0B429]/20 rounded-xl text-[#B7791F]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#B7791F] tracking-wider">
                    RESERVA PENDIENTE DE PAGO
                  </span>
                  <h4 className="font-extrabold text-sm text-[#1B2A55]">
                    {pendingBooking.courtName} · {pendingBooking.time}
                  </h4>
                  <p className="text-xs text-slate-600">Total: ${pendingBooking.totalPrice.toLocaleString('es-AR')}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('court-confirm', { booking: pendingBooking })}
                className="px-3.5 py-1.5 bg-[#1B2A55] text-white font-bold text-xs rounded-xl hover:bg-[#111A36] transition-colors shrink-0"
              >
                Pagar ahora
              </button>
            </div>
          )}

          {nextBooking && (
            <div className="bg-[#EAF7EE] border border-[#2E9E5B]/40 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#2E9E5B]/20 rounded-xl text-[#2E9E5B]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#2E9E5B] tracking-wider">
                    PRÓXIMO TURNO CONFIRMADO
                  </span>
                  <h4 className="font-extrabold text-sm text-[#1B2A55]">
                    {nextBooking.courtName} · {nextBooking.date}
                  </h4>
                  <p className="text-xs text-slate-600">{nextBooking.time} · {nextBooking.sede}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('reservations')}
                className="px-3.5 py-1.5 bg-white border border-[#2E9E5B] text-[#2E9E5B] font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors shrink-0"
              >
                Ver detalle
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main 4 Cards Section matching Figma socio-home-desktop */}
      <div>
        <h2 className="text-lg font-black text-[#1B2A55] font-outfit mb-4">
          Servicios y Reservas
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Reservar Clase */}
          <div 
            onClick={() => navigate('classes')}
            className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-slate-100 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55] mb-4 group-hover:bg-[#1B2A55] group-hover:text-white transition-colors">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#1B2A55] group-hover:text-[#F26D6D] transition-colors">
                Reservar Clase
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                25+ Clases disponibles en tu sede
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1B2A55] group-hover:text-[#F26D6D]">
              <span>Ver agenda semanal</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2: Reservar Cancha */}
          <div 
            onClick={() => navigate('courts')}
            className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-slate-100 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#F26D6D]/15 flex items-center justify-center text-[#F26D6D] mb-4 group-hover:bg-[#F26D6D] group-hover:text-white transition-colors">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-[#1B2A55] group-hover:text-[#F26D6D] transition-colors">
                  Reservar Cancha
                </h3>
                <Badge variant="coral-soft">−15%</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Paddle, Fútbol 5, Tenis, Básquet
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1B2A55] group-hover:text-[#F26D6D]">
              <span>Elegir horario</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 3: Mi Membresía */}
          <div 
            onClick={() => navigate('profile')}
            className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-slate-100 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#2E9E5B]/15 flex items-center justify-center text-[#2E9E5B] mb-4 group-hover:bg-[#2E9E5B] group-hover:text-white transition-colors">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#1B2A55] group-hover:text-[#2E9E5B] transition-colors">
                Mi Membresía
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Estado: <span className={`font-bold ${isExpired ? 'text-[#E5484D]' : 'text-[#2E9E5B]'}`}>
                  {isExpired ? 'Vencida' : 'Premium Activo'}
                </span>
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1B2A55] group-hover:text-[#2E9E5B]">
              <span>Gestionar plan</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 4: Pagos y Facturas */}
          <div 
            onClick={() => navigate('history')}
            className="bg-white rounded-3xl p-6 shadow-card hover:shadow-card-hover border border-slate-100 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#F0B429]/15 flex items-center justify-center text-[#B7791F] mb-4 group-hover:bg-[#F0B429] group-hover:text-[#1B2A55] transition-colors">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#1B2A55] group-hover:text-[#B7791F] transition-colors">
                Pagos y Facturas
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ver historial y comprobantes AFIP
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1B2A55] group-hover:text-[#B7791F]">
              <span>Ver recibos</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

        </div>
      </div>

      {/* Featured classes section snippet */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-[#1B2A55] font-outfit">Clases destacadas de hoy</h3>
            <p className="text-xs text-slate-500">Cupos en tiempo real para tu sede</p>
          </div>
          <button
            onClick={() => navigate('classes')}
            className="text-xs font-bold text-[#1B2A55] hover:text-[#F26D6D] hover:underline"
          >
            Ver todas →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {classes.slice(0, 3).map((cls) => (
            <div
              key={cls.id}
              onClick={() => navigate('class-detail', { classItem: cls })}
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-[#1B2A55] text-sm">{cls.title}</h4>
                  <p className="text-xs text-slate-500">{cls.time} · {cls.instructor}</p>
                </div>
                {cls.status === 'PROGRAMADA' && <Badge variant="green-soft">PROGRAMADA</Badge>}
                {cls.status === 'COMPLETA' && <Badge variant="gold-soft">COMPLETA</Badge>}
                {cls.status === 'CANCELADA' && <Badge variant="red-soft">CANCELADA</Badge>}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs pt-2 border-t border-slate-200/50">
                <span className="text-slate-500">
                  Cupo: <strong className="text-[#1B2A55]">{cls.enrolledCount} / {cls.maxCapacity}</strong>
                </span>
                <span className="text-[#1B2A55] font-bold">Ver clase →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
