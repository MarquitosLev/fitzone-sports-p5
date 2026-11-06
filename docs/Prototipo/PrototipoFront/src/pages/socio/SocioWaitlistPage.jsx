import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Users, 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export function SocioWaitlistPage() {
  const { routeParams, classes, currentUser, toggleWaitlist, navigate, addToast } = useApp();
  
  const classItem = classes.find(c => c.id === routeParams?.classItem?.id) || classes[1]; // default to Spinning
  const [notificationChannel, setNotificationChannel] = useState('Push');

  const waitlistCount = classItem?.waitlist?.length || 3;
  const userPosition = 3; // Position 3 in demo

  const handleSavePreference = () => {
    addToast('Preferencia Guardada', `Te notificaremos vía ${notificationChannel} cuando se libere un cupo.`, 'success');
  };

  const handleLeaveWaitlist = () => {
    toggleWaitlist(classItem.id);
    navigate('classes');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-12">
      
      {/* Back button */}
      <button
        onClick={() => navigate('classes')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1B2A55] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la agenda</span>
      </button>

      {/* Main Waitlist Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              LISTA DE ESPERA · CLASES GRUPALES
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1B2A55] font-outfit">
                {classItem.title}
              </h1>
              <Badge variant="gold-soft">EN ESPERA</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {classItem.date} · {classItem.time} · {classItem.instructor}
            </p>
          </div>
        </div>

        {/* Position in Queue Box */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1B2A55] to-[#111A36] text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F0B429]">
              Tu posición en la cola
            </span>
            <span className="text-xs text-slate-300">Anotado el 28 Sep · 09:30</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black font-outfit text-white">
              #{userPosition}
            </span>
            <span className="text-xs text-slate-300">
              en la lista de espera · 2 personas antes que vos ({waitlistCount} en total)
            </span>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-slate-300">
            <AlertCircle className="w-4 h-4 text-[#F0B429] shrink-0" />
            <span>Tu lugar en la lista no garantiza reserva hasta que se libere un cupo.</span>
          </div>
        </div>

        {/* Class Details summary */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Cupo disponible / máximo</span>
            <span className="font-extrabold text-[#1B2A55]">0 / {classItem.maxCapacity} (COMPLETA)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Duración y sala</span>
            <span className="font-bold text-[#1B2A55]">{classItem.duration} · {classItem.room}</span>
          </div>
        </div>

        {/* Notification Channel selector */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-extrabold text-[#1B2A55] uppercase tracking-wider">
            ¿Cómo querés que te avisemos?
          </h3>
          <p className="text-xs text-slate-500">
            Elegí dónde querés recibir el aviso instantáneo cuando haya un lugar libre.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label 
              onClick={() => setNotificationChannel('Push')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                notificationChannel === 'Push'
                  ? 'border-[#1B2A55] bg-[#1B2A55]/5 ring-1 ring-[#1B2A55]'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <Smartphone className={`w-5 h-5 shrink-0 ${notificationChannel === 'Push' ? 'text-[#1B2A55]' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-xs text-[#1B2A55] block">Push Notification</span>
                <span className="text-[11px] text-slate-500">Aviso inmediato en tu celular</span>
              </div>
            </label>

            <label 
              onClick={() => setNotificationChannel('Email')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                notificationChannel === 'Email'
                  ? 'border-[#1B2A55] bg-[#1B2A55]/5 ring-1 ring-[#1B2A55]'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <Mail className={`w-5 h-5 shrink-0 ${notificationChannel === 'Email' ? 'text-[#1B2A55]' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-xs text-[#1B2A55] block">Correo Electrónico</span>
                <span className="text-[11px] text-slate-500 truncate">{currentUser.email}</span>
              </div>
            </label>
          </div>

          <button
            onClick={handleSavePreference}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1B2A55] font-bold text-xs rounded-xl transition-colors"
          >
            Guardar preferencia de notificación
          </button>
        </div>

        {/* Leave waitlist button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400">
            Respetamos el orden de llegada. Si salís y volvés a anotarte, irás al final de la cola.
          </p>
          <button
            onClick={handleLeaveWaitlist}
            className="text-xs font-bold text-[#E5484D] hover:underline flex items-center gap-1.5 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir de la lista de espera</span>
          </button>
        </div>

      </div>
    </div>
  );
}
