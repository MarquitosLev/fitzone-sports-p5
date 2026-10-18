import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { CuentaRegresiva } from './CuentaRegresiva';
import { Button, Spinner } from '../ui';

export interface QrDinamicoProps {
  /** Token firmado o string a codificar en el QR */
  token: string;
  /** Duración de vigencia del token antes del refresco (en segundos, por defecto 60) */
  duracionSegundos?: number;
  /** Callback invocado automáticamente cuando el contador llega a cero para solicitar nuevo token */
  onSolicitarNuevoToken?: () => void | Promise<void>;
  /** Estado de carga mientras se solicita un nuevo token */
  cargando?: boolean;
  /** Mensaje de error si la solicitud falló */
  error?: string | null;
  /** Tamaño del QR en píxeles (default 220) */
  tamano?: number;
  /** Mostrar la cuenta regresiva integrada (default true) */
  mostrarContador?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * QrDinamico — Componente de Código QR de Acceso Dinámico (SCRUM-85).
 * Renderiza el código QR mediante qrcode.react a partir del token recibido.
 * Mantiene un ciclo de cuenta regresiva (60s) y solicita automáticamente
 * un nuevo token cuando llega a cero.
 */
export function QrDinamico({
  token,
  duracionSegundos = 60,
  onSolicitarNuevoToken,
  cargando = false,
  error = null,
  tamano = 220,
  mostrarContador = true,
  className = '',
}: QrDinamicoProps) {
  const [segundosRestantes, setSegundosRestantes] = useState<number>(duracionSegundos);

  // Referencia al callback para evitar recrear el intervalo si la función cambia
  const onSolicitarRef = useRef(onSolicitarNuevoToken);
  useEffect(() => {
    onSolicitarRef.current = onSolicitarNuevoToken;
  }, [onSolicitarNuevoToken]);

  // Cada vez que cambia el token entrante, reseteamos el contador al valor inicial
  useEffect(() => {
    setSegundosRestantes(duracionSegundos);
  }, [token, duracionSegundos]);

  // Intervalo de cuenta regresiva por segundo
  useEffect(() => {
    // Si no hay token o está cargando, pausar el decremento
    if (!token || cargando) return;

    const timer = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          // Llegó a cero: solicitar nuevo token automáticamente
          if (onSolicitarRef.current) {
            void onSolicitarRef.current();
          }
          return duracionSegundos;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [token, duracionSegundos, cargando]);

  const handleActualizarManual = () => {
    if (cargando) return;
    setSegundosRestantes(duracionSegundos);
    if (onSolicitarRef.current) {
      void onSolicitarRef.current();
    }
  };

  return (
    <div
      data-testid="qr-dinamico"
      className={`flex flex-col items-center bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card text-center transition-all ${className}`}
    >
      {/* Contenedor del código QR */}
      <div
        data-testid="contenedor-qr"
        className="relative flex items-center justify-center p-5 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner my-2"
        style={{ minWidth: tamano + 40, minHeight: tamano + 40 }}
      >
        {cargando ? (
          <div
            data-testid="qr-cargando"
            className="flex flex-col items-center justify-center gap-3 p-6"
            style={{ width: tamano, height: tamano }}
          >
            <Spinner size="lg" />
            <p className="text-xs font-bold text-fitzone-navy font-outfit animate-pulse">
              Generando nuevo token...
            </p>
          </div>
        ) : error ? (
          <div
            data-testid="qr-error"
            className="flex flex-col items-center justify-center text-center p-4 max-w-[220px]"
            style={{ width: tamano, height: tamano }}
          >
            <AlertCircle className="w-10 h-10 text-fitzone-coral mb-2" />
            <span className="text-xs font-black text-fitzone-navy">Error al generar código</span>
            <span className="text-[11px] text-slate-500 mt-1">{error}</span>
            <Button
              size="xs"
              variant="coral"
              onClick={handleActualizarManual}
              className="mt-3"
              leftIcon={RefreshCw}
            >
              Reintentar
            </Button>
          </div>
        ) : token ? (
          <div className="relative inline-block transition-transform duration-200">
            <div data-testid="qr-svg" className="p-2 bg-white rounded-xl shadow-xs">
              <QRCodeSVG
                value={token}
                size={tamano}
                fgColor="#1B2A55"
                bgColor="#FFFFFF"
                level="M"
                aria-label={`Código QR de acceso con token ${token}`}
              />
            </div>
            {/* Marco decorativo sutil institucional */}
            <div className="absolute inset-0 border border-fitzone-coral/20 rounded-xl pointer-events-none" />
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center text-center p-4 text-slate-400"
            style={{ width: tamano, height: tamano }}
          >
            <p className="text-xs font-medium">Esperando emisión del token de acceso...</p>
          </div>
        )}
      </div>

      {/* Cuenta regresiva antes del próximo refresco */}
      {mostrarContador && !error && (
        <div className="w-full max-w-[280px] mt-4">
          <CuentaRegresiva
            segundosRestantes={segundosRestantes}
            totalSegundos={duracionSegundos}
          />
        </div>
      )}

      {/* Botón de actualización manual opcional */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <Button
          type="button"
          size="xs"
          variant="secondary"
          onClick={handleActualizarManual}
          disabled={cargando}
          leftIcon={RefreshCw}
          data-testid="btn-actualizar-qr"
          className="text-xs"
        >
          {cargando ? 'Actualizando...' : 'Actualizar ahora'}
        </Button>
      </div>

      {/* Badge de seguridad */}
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Token dinámico encriptado. Protege contra copias y capturas.</span>
      </div>
    </div>
  );
}
