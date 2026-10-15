import React, { useState } from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { navigate, switchRole, addToast } = useApp();
  const [email, setEmail] = useState('martin@email.com');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setHasError(true);
      return;
    }

    if (email.includes('laura')) {
      switchRole(ROLES.EXTERNO);
    } else if (email.includes('lucia') || email.includes('admin')) {
      switchRole(ROLES.RECEPCION);
    } else if (email.includes('gerente') || email.includes('vidal')) {
      switchRole(ROLES.GERENTE_CENTRAL);
    } else {
      switchRole(ROLES.SOCIO_ACTIVO);
    }
  };

  const handleQuickDemo = (role) => {
    switchRole(role);
  };

  return (
    <div className="min-h-[calc(100vh-105px)] flex items-center justify-center p-4 bg-[#1B2A55] relative overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#F26D6D]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#2E9E5B]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] bg-white rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 border border-white/20 animate-slide-up">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1B2A55] flex items-center justify-center shadow-lg">
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="#1B2A55"/>
              <path d="M19.5 17H44.5C45.9 17 47 18.1 47 19.5V44.5C47 45.9 45.9 47 44.5 47H19.5C18.1 47 17 45.9 17 44.5V19.5C17 18.1 18.1 17 19.5 17Z" stroke="#F26D6D" strokeWidth="4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#1B2A55] font-outfit tracking-tight">
              FitZone
            </h1>
            <span className="text-xs font-black text-[#F26D6D] tracking-[0.25em]">
              SPORTS
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1B2A55] uppercase tracking-wider">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setHasError(false);
              }}
              placeholder="martin@email.com"
              className="w-full h-12 px-4 rounded-xl border border-[#1B2A55] text-sm text-[#1B2A55] font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2A55] focus:border-transparent transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1B2A55] uppercase tracking-wider">
                Contraseña
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setHasError(false);
                }}
                placeholder="••••••••"
                className={`w-full h-12 px-4 pr-11 rounded-xl border text-sm text-[#1B2A55] font-medium placeholder-slate-400 focus:outline-none transition-all ${
                  hasError 
                    ? 'border-[#E5484D] ring-1 ring-[#E5484D]' 
                    : 'border-[#1B2A55] focus:ring-2 focus:ring-[#1B2A55]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {hasError && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E5484D] mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Contraseña incorrecta o campos incompletos</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-12 bg-[#1B2A55] hover:bg-[#111A36] text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => addToast('Recuperar Clave', 'Se envió un enlace a tu casilla de correo.', 'info')}
              className="text-xs font-bold text-[#F26D6D] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            ¿No tenés cuenta?{' '}
            <button
              onClick={() => navigate('register')}
              className="font-bold text-[#F26D6D] hover:underline"
            >
              Registrate
            </button>
          </p>
        </div>

        {/* Quick Demo Logins Box */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-center mb-2">
            ACCESOS RÁPIDOS DE DEMOSTRACIÓN
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo(ROLES.SOCIO_ACTIVO)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-left border border-slate-200 transition-colors"
            >
              Socio Activo
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo(ROLES.EXTERNO)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-left border border-slate-200 transition-colors"
            >
              Cliente Externo
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo(ROLES.RECEPCION)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-left border border-slate-200 transition-colors"
            >
              Recepcionista
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo(ROLES.GERENTE_CENTRAL)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-left border border-slate-200 transition-colors"
            >
              Gerente Central
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
