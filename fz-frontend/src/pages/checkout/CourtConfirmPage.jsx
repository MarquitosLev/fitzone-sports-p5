import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Layers, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function CourtConfirmPage() {
  const { routeParams, courtBookings, navigate } = useApp();
  
  const booking = routeParams?.booking || courtBookings[0];

  const handleProceedToCheckout = () => {
    navigate('checkout', { booking });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      
      {/* Back button */}
      <button
        onClick={() => navigate('courts')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1B2A55] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a los horarios</span>
      </button>

      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between text-xs font-extrabold">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">1</span>
          <span>Elegí tu turno</span>
        </div>
        <div className="w-12 h-0.5 bg-[#1B2A55]" />
        <div className="flex items-center gap-2 text-[#1B2A55]">
          <span className="w-6 h-6 rounded-full bg-[#1B2A55] text-white flex items-center justify-center text-xs">2</span>
          <span>Revisá</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200" />
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">3</span>
          <span>Pagá</span>
        </div>
      </div>

      {/* Main Confirmation Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              CONFIRMACIÓN DE RESERVA
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
              Confirmar reserva
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {booking.user} · {booking.userRole}
            </p>
          </div>
          <Badge variant="gold-soft">PENDIENTE_PAGO</Badge>
        </div>

        {/* Booking Details Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#F26D6D]">
                {booking.sport}
              </span>
              <span className="text-base font-extrabold text-[#1B2A55]">
                {booking.courtName}
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">{booking.sede}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-[#1B2A55]" />
              <span className="font-bold">{booking.dateFull || booking.date}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-[#F26D6D]" />
              <span className="font-bold">{booking.time} ({booking.duration})</span>
            </div>
          </div>
        </div>

        {/* Member & Protection Notices */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#EAF7EE] border border-[#2E9E5B]/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#2E9E5B] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-[#2E9E5B]">Titular de la reserva</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {booking.memberDiscount < 0 ? 'Tu beneficio de membresía (-15%) ya está aplicado.' : 'Tarifa estándar sin membresía activa.'}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#1B2A55] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-[#1B2A55]">Un turno, una reserva</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                La disponibilidad se vuelve a validar antes de confirmar. El turno se reserva mientras completás el pago.
              </p>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
          <h3 className="text-xs font-extrabold text-[#1B2A55] uppercase tracking-wider">
            Resumen del precio
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Precio base · 1 hora</span>
              <span className="font-bold">${booking.basePrice?.toLocaleString('es-AR') || '10.000'}</span>
            </div>

            {booking.peakSurge > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Horario pico · +20%</span>
                <span className="font-bold text-[#F26D6D]">+${booking.peakSurge?.toLocaleString('es-AR')}</span>
              </div>
            )}

            {booking.memberDiscount < 0 && (
              <div className="flex items-center justify-between text-[#2E9E5B] font-bold">
                <span>Beneficio socio activo · −15%</span>
                <span>−${Math.abs(booking.memberDiscount)?.toLocaleString('es-AR')}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-base font-black text-[#1B2A55]">
              <span>Total a pagar</span>
              <div className="flex items-baseline gap-2">
                {booking.memberDiscount < 0 && (
                  <span className="text-sm font-bold text-slate-400 line-through">
                    ${((booking.basePrice || 10000) + (booking.peakSurge || 0)).toLocaleString('es-AR')}
                  </span>
                )}
                <span className="text-xl text-[#1B2A55]">${booking.totalPrice?.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {booking.memberDiscount < 0 && (
            <p className="text-[11px] text-slate-400 italic pt-1">
              El 15% de descuento se calcula sobre ${((booking.basePrice || 10000) + (booking.peakSurge || 0)).toLocaleString('es-AR')} (base + pico).
            </p>
          )}
        </div>

        {/* CTA Actions */}
        <div className="pt-2 space-y-3">
          <button
            onClick={handleProceedToCheckout}
            className="w-full py-4 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-5 h-5 text-[#F26D6D]" />
            <span>Pagar ${booking.totalPrice?.toLocaleString('es-AR')} · Continuar al Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            La reserva continúa PENDIENTE_PAGO. Pasa a CONFIRMADA únicamente cuando se acredite el pago.
          </p>
        </div>

      </div>
    </div>
  );
}
