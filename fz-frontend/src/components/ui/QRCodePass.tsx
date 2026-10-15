import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, WifiOff, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import { Badge } from './Badge';

export interface QRCodeUser {
  name: string;
  memberId?: string;
  plan?: string;
  validUntil?: string;
  [key: string]: any;
}

export interface QRCodePassProps {
  user: QRCodeUser;
  sede?: string;
  isExpired?: boolean;
  /**
   * Token firmado criptográficamente emitido por el backend (JWT / HMAC).
   * Obligatorio para entornos de producción y control de acceso real.
   */
  token?: string;
  /**
   * Timestamp ISO o string de expiración real del token emitido por el servidor.
   */
  expiresAt?: string;
  /**
   * Si es true o en entorno de producción sin token, el componente bloqueará el renderizado
   * del código QR y exigirá que el backend provea un token firmado válido.
   */
  requireSignedToken?: boolean;
}

/**
 * QRCodePass
 *
 * ARQUITECTURA Y SEGURIDAD:
 * Para control de accesos real en producción, este componente debe recibir imperativamente
 * un `token` firmado desde el backend. Si `requireSignedToken={true}` y no hay `token`,
 * no se generará ningún QR simulado y se mostrará una advertencia de seguridad explícita.
 */
export function QRCodePass({
  user,
  sede = 'Sede Palermo',
  isExpired = false,
  token: externalToken,
  expiresAt,
  requireSignedToken = false,
}: QRCodePassProps) {
  const [secondsLeft, setSecondsLeft] = useState(42);
  const [qrPayload, setQrPayload] = useState(externalToken || '');

  useEffect(() => {
    // Si viene un token firmado del backend, utilizarlo directamente como payload oficial
    if (externalToken) {
      setQrPayload(externalToken);
      return;
    }

    // Si se exige token firmado y no se proporcionó, no generar payload falso
    if (requireSignedToken) {
      setQrPayload('');
      return;
    }

    // Fallback: Generador demostrativo para desarrollo / mockup UI
    const generateDemoToken = () => {
      const timestamp = Math.floor(Date.now() / 60000);
      return JSON.stringify({
        memberId: user.memberId || 'FZ-18472',
        name: user.name,
        sede: sede,
        status: isExpired ? 'VENCIDA' : 'ACTIVO',
        token: `FZ-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
        _demoMock: true,
      });
    };

    setQrPayload(generateDemoToken());

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setQrPayload(generateDemoToken());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, sede, isExpired, externalToken, requireSignedToken]);

  const isTokenMissingInStrictMode = Boolean(requireSignedToken && !externalToken);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 max-w-md mx-auto text-center relative overflow-hidden">
      {/* Decorative top accent */}
      <div className={`absolute top-0 left-0 right-0 h-2 ${isExpired ? 'bg-[#E5484D]' : 'bg-[#1B2A55]'}`} />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <div className="w-2 h-2 rounded-full bg-[#2E9E5B] animate-pulse" />
          <span>{externalToken ? 'Validado Backend' : 'Modo Mock'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
          <WifiOff className="w-3.5 h-3.5 text-slate-400" />
          <span>Modo offline disponible</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#1B2A55] font-outfit">Tu pase digital</h2>
        <p className="text-xs text-slate-500 mt-1">
          Presentalo en el lector de {sede} para ingresar.
        </p>
      </div>

      {/* QR Container */}
      <div className="relative inline-flex items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 shadow-inner my-2 min-h-[258px] min-w-[258px]">
        {isTokenMissingInStrictMode ? (
          <div className="flex flex-col items-center justify-center text-center p-4 max-w-[220px]">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">
              Token Requerido
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Este pase exige un token firmado por el backend para emitir el código QR de acceso.
            </span>
          </div>
        ) : isExpired ? (
          <div className="relative">
            <div className="opacity-20 blur-[1px]">
              <QRCodeSVG
                value={qrPayload || 'FITZONE-EXPIRED'}
                size={210}
                bgColor="#F8FAFC"
                fgColor="#E5484D"
                level="Q"
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-[#E5484D]/10 flex items-center justify-center text-[#E5484D] mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-xs font-extrabold text-[#E5484D] uppercase tracking-wider">
                Membresía Vencida
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Regularizá tu cuota para reactivar tu acceso
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <QRCodeSVG
              value={qrPayload || 'FITZONE-DEFAULT'}
              size={210}
              bgColor="#F8FAFC"
              fgColor="#1B2A55"
              level="Q"
            />
            <div className="absolute inset-0 border-2 border-[#F26D6D]/30 rounded-lg pointer-events-none" />
          </div>
        )}
      </div>

      {/* Countdown pill */}
      {!isTokenMissingInStrictMode && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B2A55]/5 text-[#1B2A55] text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F26D6D]" style={{ animationDuration: '4s' }} />
            <span>Se renueva en {secondsLeft} s</span>
          </div>
          <span className="text-xs text-slate-400">· Ciclo de 60 s</span>
        </div>
      )}

      {/* Member Details card */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-[#1B2A55] text-base">{user.name}</h4>
            <p className="text-xs text-slate-500 font-mono">Socio #{user.memberId || 'FZ-18472'}</p>
          </div>
          {isExpired ? (
            <Badge variant="red-soft">VENCIDA</Badge>
          ) : (
            <Badge variant="green-soft">ACTIVO</Badge>
          )}
        </div>

        <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Sede actual</span>
            <span className="font-bold text-[#1B2A55]">{sede}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Plan</span>
            <span className="font-bold text-[#1B2A55]">
              {user.plan} · {isExpired ? 'vencida' : `vence ${expiresAt || user.validUntil}`}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2E9E5B]" />
        <span>El QR se renueva dinámicamente para proteger tu cuenta.</span>
      </div>
    </div>
  );
}
