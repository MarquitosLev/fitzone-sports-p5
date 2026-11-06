import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ChevronRight, 
  Layers, 
  CreditCard,
  Plus
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioMyReservationsPage() {
  const { courtBookings, cancelCourtBooking, navigate } = useApp();
  const [activeFilter, setActiveFilter] = useState('Todas'); // 'Todas', 'Próximas', 'Historial'

  const nextConfirmed = courtBookings.find(b => b.status === 'CONFIRMADA');

  const filteredBookings = courtBookings.filter(b => {
    if (activeFilter === 'Próximas') {
      return b.status === 'CONFIRMADA' || b.status === 'PENDIENTE_PAGO';
    }
    if (activeFilter === 'Historial') {
      return b.status === 'FINALIZADA' || b.status === 'CANCELADA';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            CANCHAS DEPORTIVAS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit mt-0.5">
            Mis reservas de cancha
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrá tus próximos turnos y consultá tu historial de juego
          </p>
        </div>

        <button
          onClick={() => navigate('courts')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-xs rounded-xl shadow transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva reserva</span>
        </button>
      </div>

      {/* Featured Next Confirmed Booking Banner */}
      {nextConfirmed && (
        <div className="bg-gradient-to-r from-[#1B2A55] to-[#263B72] text-white rounded-3xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-[#F0B429] tracking-wider">
                TU PRÓXIMO TURNO CONFIRMADO
              </span>
              <Badge variant="green">CONFIRMADA</Badge>
            </div>
            <h3 className="text-2xl font-black font-outfit">
              {nextConfirmed.courtName}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {nextConfirmed.date} · {nextConfirmed.time} · {nextConfirmed.sede}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-[#F0B429]">
              ${nextConfirmed.totalPrice?.toLocaleString('es-AR')}
            </span>
            <button
              onClick={() => navigate('qr')}
              className="px-4 py-2.5 bg-[#F26D6D] hover:bg-[#e05959] text-white font-extrabold text-xs rounded-xl shadow transition-all"
            >
              Ver Pase QR
            </button>
          </div>
        </div>
      )}

      {/* Tabs selector: Todas (4) | Próximas (2) | Historial (2) */}
      <div className="flex bg-slate-100 p-1 rounded-2xl self-start max-w-fit">
        {['Todas', 'Próximas', 'Historial'].map((tab) => {
          const count = courtBookings.filter(b => {
            if (tab === 'Próximas') return b.status === 'CONFIRMADA' || b.status === 'PENDIENTE_PAGO';
            if (tab === 'Historial') return b.status === 'FINALIZADA' || b.status === 'CANCELADA';
            return true;
          }).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === tab
                  ? 'bg-white text-[#1B2A55] shadow-sm'
                  : 'text-slate-600 hover:text-[#1B2A55]'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((b) => {
          const isPending = b.status === 'PENDIENTE_PAGO';
          const isConfirmed = b.status === 'CONFIRMADA';
          const isCancelled = b.status === 'CANCELADA';
          const isFinished = b.status === 'FINALIZADA';

          return (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-card-hover transition-all"
            >
              {/* Left Column: Court & Date details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-[#F26D6D] tracking-wider">
                    {b.sport || 'Paddle'}
                  </span>
                  <span className="text-base font-extrabold text-[#1B2A55]">
                    {b.courtName}
                  </span>
                  <span className="text-xs font-mono text-slate-400">· {b.id}</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-[#1B2A55]">
                    <Calendar className="w-3.5 h-3.5 text-[#1B2A55]" />
                    <span>{b.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-[#F26D6D]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{b.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.sede}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  {isPending && <span className="text-[#B7791F] font-bold">Falta confirmar el pago</span>}
                  {isConfirmed && <span className="text-[#2E9E5B] font-bold">Pago confirmado · Turno reservado</span>}
                  {isCancelled && <span className="text-[#E5484D] font-bold">Reserva cancelada</span>}
                  {isFinished && <span className="text-slate-400 font-bold">Turno finalizado</span>}
                </div>
              </div>

              {/* Right Column: Status Badge, Total & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                <div className="text-left sm:text-right">
                  <div className="mb-1">
                    {isPending && <Badge variant="gold-soft">PENDIENTE_PAGO</Badge>}
                    {isConfirmed && <Badge variant="green-soft">CONFIRMADA</Badge>}
                    {isCancelled && <Badge variant="red-soft">CANCELADA</Badge>}
                    {isFinished && <Badge variant="default">FINALIZADA</Badge>}
                  </div>
                  <span className="text-lg font-black text-[#1B2A55]">
                    ${b.totalPrice?.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isPending && (
                    <>
                      <button
                        onClick={() => navigate('court-confirm', { booking: b })}
                        className="px-4 py-2.5 bg-[#1B2A55] hover:bg-[#111A36] text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
                      >
                        Continuar al pago
                      </button>
                      <button
                        onClick={() => cancelCourtBooking(b.id)}
                        className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#E5484D] font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </>
                  )}

                  {isConfirmed && (
                    <button
                      onClick={() => navigate('history')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Ver recibo
                    </button>
                  )}

                  {(isCancelled || isFinished) && (
                    <span className="text-xs text-slate-400 font-medium px-2 py-1">
                      Sin acciones
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 border border-slate-200/70">
        Las reservas con estado <strong>PENDIENTE_PAGO</strong> todavía no están aseguradas en el sistema. Podés cancelar las reservas vigentes desde su tarjeta.
      </div>

    </div>
  );
}
