import React from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  MapPin, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioClassDetailPage() {
  const { routeParams, classes, currentRole, reserveClass, navigate } = useApp();
  
  // Find current class
  const classItem = classes.find(c => c.id === routeParams?.classItem?.id) || classes[0];
  const isExpired = currentRole === ROLES.SOCIO_VENCIDO;
  const isReserved = classItem?.isReservedByCurrentUser;
  const freeSpots = Math.max(0, (classItem?.maxCapacity || 12) - (classItem?.enrolledCount || 0));

  const handleAction = () => {
    if (isExpired) {
      navigate('profile');
      return;
    }
    reserveClass(classItem.id);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      
      {/* Back button */}
      <button
        onClick={() => navigate('classes')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1B2A55] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la agenda</span>
      </button>

      {/* Main Detail Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-6">
        
        {/* Header with Title and Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                CLASES GRUPALES
              </span>
              {classItem.status === 'PROGRAMADA' && <Badge variant="green-soft">PROGRAMADA</Badge>}
              {classItem.status === 'COMPLETA' && <Badge variant="gold-soft">COMPLETA</Badge>}
              {classItem.status === 'CANCELADA' && <Badge variant="red-soft">CANCELADA</Badge>}
              {classItem.status === 'FINALIZADA' && <Badge variant="default">FINALIZADA</Badge>}
            </div>
            <h1 className="text-3xl font-black text-[#1B2A55] font-outfit">
              {classItem.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {classItem.description || 'Fuerza, movilidad y resistencia en equipo.'}
            </p>
          </div>

          {/* Quick Date Badge */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-left sm:text-right shrink-0">
            <span className="text-[11px] font-bold text-slate-400 block">{classItem.date}</span>
            <span className="text-base font-extrabold text-[#1B2A55]">{classItem.time}</span>
          </div>
        </div>

        {/* Location & Intensity Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl text-[#1B2A55] shadow-xs">
              <MapPin className="w-5 h-5 text-[#F26D6D]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Espacio</span>
              <p className="text-xs font-bold text-[#1B2A55]">{classItem.sede} · {classItem.room}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl text-[#1B2A55] shadow-xs">
              <User className="w-5 h-5 text-[#1B2A55]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Instructor</span>
              <p className="text-xs font-bold text-[#1B2A55]">{classItem.instructor}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl text-[#1B2A55] shadow-xs">
              <Users className="w-5 h-5 text-[#2E9E5B]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Disponibilidad</span>
              <p className="text-xs font-bold text-[#1B2A55]">{freeSpots} de {classItem.maxCapacity} libres</p>
            </div>
          </div>
        </div>

        {/* Tu entrenamiento info */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#1B2A55] uppercase tracking-wider">
            Tu entrenamiento
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
            <p><strong>Duración e intensidad:</strong> {classItem.duration || '60 minutos'} · intensidad {classItem.intensity || 'media'}.</p>
            <p><strong>Cupo disponible / máximo:</strong> {freeSpots} / {classItem.maxCapacity} ({classItem.enrolledCount} socios inscriptos).</p>
            <p><strong>Requisitos:</strong> {classItem.requirements || 'Traé agua, una toalla y ropa cómoda. Llegá 10 minutos antes para prepararte.'}</p>
          </div>
        </div>

        {/* Inclusion Notice */}
        <div className="p-4 rounded-2xl bg-[#EAF7EE] border border-[#2E9E5B]/30 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#2E9E5B] shrink-0" />
          <span className="text-xs font-bold text-[#2E9E5B]">
            Incluida en tu Plan Premium · No tiene costo adicional.
          </span>
        </div>

        {/* Action CTA Card */}
        <div className="p-6 rounded-3xl bg-[#1B2A55] text-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-black font-outfit">
                {isReserved ? 'Tenés tu lugar reservado' : 'Reservá tu lugar'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {isExpired
                  ? 'Tu membresía está vencida. Regularizá tu plan para reservar clases.'
                  : isReserved
                  ? 'Tu reserva está confirmada. ¡Te esperamos 10 minutos antes!'
                  : `Tu membresía está activa. Quedan ${freeSpots} lugares para esta clase.`}
              </p>
            </div>
            {isExpired ? (
              <Badge variant="red-soft">MEMBRESÍA VENCIDA</Badge>
            ) : (
              <Badge variant="green">MEMBRESÍA ACTIVA</Badge>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            {isExpired ? (
              <button
                onClick={() => navigate('profile')}
                className="w-full sm:w-auto px-6 py-3 bg-[#E5484D] hover:bg-[#c93b40] text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                Pagar / Renovar Membresía ($15.000)
              </button>
            ) : isReserved ? (
              <button
                onClick={handleAction}
                className="w-full sm:w-auto px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                Cancelar mi reserva
              </button>
            ) : freeSpots <= 0 ? (
              <button
                onClick={() => navigate('waitlist', { classItem })}
                className="w-full sm:w-auto px-6 py-3 bg-[#F0B429] hover:bg-[#d99f1e] text-[#1B2A55] font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                Anotarme en lista de espera
              </button>
            ) : (
              <button
                onClick={handleAction}
                className="w-full sm:w-auto px-6 py-3 bg-[#2E9E5B] hover:bg-[#26864d] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Confirmar Reserva de Clase
              </button>
            )}
          </div>
        </div>

        {/* Plazos y condiciones */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-extrabold text-[#1B2A55] uppercase tracking-wider">
            Plazos y condiciones
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-[#1B2A55] block">Reserva: hasta 48 h antes</span>
              <span className="text-slate-500 text-[11px]">Podés asegurar tu cupo con anticipación desde la app.</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-[#1B2A55] block">Cancelación: hasta 2 h antes</span>
              <span className="text-slate-500 text-[11px]">Sin penalidad para liberar el lugar al siguiente en lista de espera.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
