import React from 'react';
import { useApp, ROLES } from '../../context/AppContext';
import { QRCodePass } from '../../components/ui/QRCodePass';
import { ArrowLeft, ShieldCheck, MapPin, AlertCircle, RefreshCw } from 'lucide-react';

export function SocioAccessQRPage() {
  const { currentUser, currentRole, selectedSede, navigate } = useApp();
  const isExpired = currentRole === ROLES.SOCIO_VENCIDO || currentUser.membershipStatus === 'VENCIDA';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate('home')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1B2A55] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio</span>
      </button>

      {/* Main QR Component */}
      <QRCodePass 
        user={currentUser} 
        sede={selectedSede} 
        isExpired={isExpired} 
      />

      {/* Access instructions & warnings */}
      {isExpired ? (
        <div className="bg-[#FDECEE] border border-[#E5484D]/30 rounded-2xl p-5 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-[#E5484D] font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Membresía Vencida</span>
          </div>
          <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
            Tu QR digital no permitirá el ingreso en molinetes hasta que regularices tu cuota pendiente.
          </p>
          <button
            onClick={() => navigate('profile')}
            className="px-6 py-2.5 bg-[#E5484D] hover:bg-[#c93b40] text-white font-bold text-xs rounded-xl shadow transition-all"
          >
            Regularizar y Renovar ($15.000)
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h4 className="font-extrabold text-sm text-[#1B2A55] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2E9E5B]" />
            <span>¿Cómo funciona tu pase digital?</span>
          </h4>
          <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
            <li>Acercá la pantalla de tu teléfono al lector óptico ubicado en los molinetes de entrada.</li>
            <li>El código se actualiza automáticamente cada 60 segundos por seguridad anti-duplicación.</li>
            <li>Si no contás con conexión a internet, el sistema funciona en modo offline con tokens cifrados.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
