import React, { useState } from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { Camera, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export function RegisterPage() {
  const { navigate, switchRole, triggerConfetti } = useApp();
  const [step, setStep] = useState('form'); // 'form', 'verifying', 'success'
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    dni: '',
    phone: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep('verifying');

    // Simula paso de verificación de identidad
    setTimeout(() => {
      setStep('success');
      triggerConfetti();
    }, 2200);
  };

  const handleFinish = () => {
    switchRole(ROLES.SOCIO_ACTIVO);
  };

  return (
    <div className="min-h-[calc(100vh-105px)] flex items-center justify-center p-4 bg-[#1B2A55] relative overflow-hidden">
      <div className="w-full max-w-[480px] bg-white rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 border border-white/20 animate-slide-up">
        
        {step === 'form' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-[#1B2A55] font-outfit">Crear cuenta</h2>
              <p className="text-xs text-slate-500 mt-1">
                Registrate para acceder a canchas, clases y membresías.
              </p>
            </div>

            {/* Photo Avatar Upload placeholder */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-[#1B2A55] hover:border-[#1B2A55] cursor-pointer transition-colors group">
                <Camera className="w-6 h-6 transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-bold mt-1">Subir foto</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">


              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1B2A55]">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Martín"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1B2A55]">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="García"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#1B2A55]">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1B2A55]">DNI *</label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="32.845.761"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1B2A55]">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Registrarse</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                ¿Ya tenés cuenta?{' '}
                <button
                  onClick={() => navigate('login')}
                  className="font-bold text-[#F26D6D] hover:underline"
                >
                  Iniciá sesión
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Verifying Screen State */}
        {step === 'verifying' && (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#1B2A55]/10 flex items-center justify-center text-[#1B2A55]">
              <Loader2 className="w-10 h-10 animate-spin text-[#F26D6D]" />
            </div>
            <h3 className="text-xl font-bold text-[#1B2A55] font-outfit">
              Verificando información...
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Estamos validando tus datos en el sistema central de FitZone Sports.
            </p>
          </div>
        )}

        {/* Success Screen State */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-5 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#EAF7EE] flex items-center justify-center text-[#2E9E5B]">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1B2A55] font-outfit">
                ¡Cuenta Creada con Éxito!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                Tu cuenta ha sido creada exitosamente. Ya podés comenzar a reservar canchas, consultar clases y acceder a tu perfil.
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="w-full h-12 bg-[#2E9E5B] hover:bg-[#26864d] text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ingresar a FitZone Sports</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
