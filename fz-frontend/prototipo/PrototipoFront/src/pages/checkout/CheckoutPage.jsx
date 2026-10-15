import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  RefreshCw,
  Building2,
  Lock,
  Wallet
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function CheckoutPage() {
  const { routeParams, processPayment, navigate } = useApp();

  const booking = routeParams?.booking;
  const concept = routeParams?.concept;

  const isCourtBooking = !!booking;
  const rawAmount = isCourtBooking ? booking.totalPrice : (concept?.amount || 15000);
  const title = isCourtBooking ? `${booking.sport} · ${booking.courtName}` : (concept?.title || 'Membresía · Plan Premium');

  const [paymentMethod, setPaymentMethod] = useState('Tarjeta de crédito'); // 'Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia'
  const [voucherType, setVoucherType] = useState('Factura B'); // 'Ticket', 'Factura B', 'Factura A'
  const [cuit, setCuit] = useState('30-71234567-8');
  const [paymentState, setPaymentState] = useState('pending'); // 'pending', 'processing', 'rejected'
  const [rejectReason, setRejectReason] = useState('Límite diario excedido. El banco emisor rechazó la operación. Verificá tu límite o elegí otro medio de pago.');

  const handleConfirmPay = () => {
    setPaymentState('processing');
    setTimeout(() => {
      // If user chose debit and wants to test rejection, can toggle, or proceed to success
      const payload = isCourtBooking ? booking : { amount: rawAmount, title, ...concept };
      processPayment(payload, paymentMethod, voucherType, voucherType === 'Factura A' ? cuit : '');
    }, 1200);
  };

  const simulateRejection = () => {
    setPaymentState('processing');
    setTimeout(() => {
      setPaymentState('rejected');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      
      {/* Back button */}
      <button
        onClick={() => navigate('courts')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1B2A55] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la selección</span>
      </button>

      {/* Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between text-xs font-extrabold">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">1</span>
          <span>Revisá</span>
        </div>
        <div className="w-12 h-0.5 bg-[#1B2A55]" />
        <div className="flex items-center gap-2 text-[#1B2A55]">
          <span className="w-6 h-6 rounded-full bg-[#1B2A55] text-white flex items-center justify-center text-xs">2</span>
          <span>Pagá</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200" />
        <div className="flex items-center gap-2 text-slate-400">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">3</span>
          <span>Confirmación</span>
        </div>
      </div>

      {/* Main Checkout Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 cols: Payment methods & Invoicing form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1B2A55] font-outfit">
                Medio de pago
              </h3>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#2E9E5B] bg-[#EAF7EE] px-2.5 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                <span>DATOS PROTEGIDOS</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'Tarjeta de crédito', title: 'Tarjeta de crédito', subtitle: 'Procesamiento seguro externo (Visa, Mastercard, Amex)', icon: CreditCard },
                { id: 'Tarjeta de débito', title: 'Tarjeta de débito', subtitle: 'Débito inmediato desde cuenta bancaria', icon: Wallet },
                { id: 'Transferencia', title: 'Transferencia bancaria / CVU', subtitle: 'Acreditación automática instantánea', icon: Building2 },
              ].map((m) => (
                <label
                  key={m.id}
                  onClick={() => {
                    setPaymentMethod(m.id);
                    if (paymentState === 'rejected') setPaymentState('pending');
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    paymentMethod === m.id
                      ? 'border-[#1B2A55] bg-[#1B2A55]/5 ring-1 ring-[#1B2A55]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <m.icon className={`w-5 h-5 shrink-0 mt-0.5 ${paymentMethod === m.id ? 'text-[#1B2A55]' : 'text-slate-400'}`} />
                  <div className="flex-1">
                    <span className="font-extrabold text-sm text-[#1B2A55] block">{m.title}</span>
                    <span className="text-xs text-slate-500">{m.subtitle}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-start gap-2 border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-[#2E9E5B] shrink-0 mt-0.5" />
              <span>FitZone nunca solicita ni almacena número de tarjeta, código de seguridad (CVV) o datos bancarios equivalentes.</span>
            </div>
          </div>

          {/* Invoicing / Comprobante AFIP Selector */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-4">
            <h3 className="text-base font-black text-[#1B2A55] font-outfit">
              Tipo de comprobante
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {['Ticket', 'Factura B', 'Factura A'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVoucherType(type)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    voucherType === type
                      ? 'bg-[#1B2A55] text-white border-[#1B2A55] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {voucherType === 'Factura A' && (
              <div className="space-y-1.5 pt-2 animate-fade-in">
                <label className="block text-xs font-bold text-[#1B2A55]">
                  CUIT de la Empresa o Profesional *
                </label>
                <input
                  type="text"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                  placeholder="30-71234567-8"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-xs text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Se utilizará para emitir la Factura A con IVA discriminado.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right 5 cols: Order summary and Payment CTA */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#1B2A55] font-outfit">
                Resumen del pago
              </h3>
              {paymentState === 'rejected' ? (
                <Badge variant="red-soft">RECHAZADO</Badge>
              ) : (
                <Badge variant="gold-soft">PENDIENTE</Badge>
              )}
            </div>

            {/* Concept details */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F26D6D]">
                {isCourtBooking ? 'RESERVA DE CANCHA' : 'CONTRATACIÓN DE MEMBRESÍA'}
              </span>
              <h4 className="font-extrabold text-[#1B2A55] text-base">{title}</h4>
              <p className="text-xs text-slate-500">
                {isCourtBooking ? `${booking.date} · ${booking.time} · ${booking.sede}` : 'Renovación mensual FitZone Sports'}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              {isCourtBooking ? (
                <>
                  <div className="flex justify-between">
                    <span>Precio base · 1 hora</span>
                    <span className="font-bold">${booking.basePrice?.toLocaleString('es-AR') || '10.000'}</span>
                  </div>
                  {booking.peakSurge > 0 && (
                    <div className="flex justify-between">
                      <span>Horario pico</span>
                      <span className="font-bold text-[#F26D6D]">+${booking.peakSurge?.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  {booking.memberDiscount < 0 && (
                    <div className="flex justify-between text-[#2E9E5B] font-bold">
                      <span>Beneficio socio · −15%</span>
                      <span>−${Math.abs(booking.memberDiscount)?.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between">
                  <span>Cuota Plan Premium mensual</span>
                  <span className="font-bold">${rawAmount.toLocaleString('es-AR')}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-[#1B2A55]">
                <span className="font-extrabold text-sm">Total a pagar</span>
                <div className="flex items-baseline gap-2">
                  {isCourtBooking && booking?.memberDiscount < 0 && (
                    <span className="text-sm font-bold text-slate-400 line-through">
                      ${((booking.basePrice || 10000) + (booking.peakSurge || 0)).toLocaleString('es-AR')}
                    </span>
                  )}
                  <span className="text-2xl font-black">${rawAmount.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            {/* Payment Rejection State Box */}
            {paymentState === 'rejected' && (
              <div className="p-4 rounded-2xl bg-[#FDECEE] border border-[#E5484D]/30 space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-[#E5484D] font-bold text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{rejectReason}</span>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={handleConfirmPay}
                    className="w-full py-2.5 bg-[#E5484D] hover:bg-[#c93b40] text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Reintentar pago
                  </button>
                  <button
                    onClick={() => setPaymentState('pending')}
                    className="w-full py-2 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-200 hover:bg-slate-50"
                  >
                    Cambiar medio de pago
                  </button>
                </div>
              </div>
            )}

            {/* Pending State Button */}
            {paymentState === 'pending' && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleConfirmPay}
                  className="w-full py-4 bg-[#2E9E5B] hover:bg-[#26864d] text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirmar pago · ${rawAmount.toLocaleString('es-AR')}</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>¿Probar caso de rechazo?</span>
                  <button
                    onClick={simulateRejection}
                    className="text-[#E5484D] font-bold hover:underline"
                  >
                    Simular límite excedido
                  </button>
                </div>
              </div>
            )}

            {paymentState === 'processing' && (
              <div className="py-6 text-center space-y-2">
                <RefreshCw className="w-8 h-8 text-[#1B2A55] animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#1B2A55]">Procesando transacción segura...</p>
              </div>
            )}

            <p className="text-[11px] text-slate-400 text-center">
              La reserva continúa pendiente hasta que se confirme el pago.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
