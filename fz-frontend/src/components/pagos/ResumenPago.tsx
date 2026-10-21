import { useState, useId } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, Calendar, Clock, MapPin, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Badge } from '../ui';
import { DesglosePrecio } from '../canchas/DesglosePrecio';
import type { DetalleItemPago } from '../../types';
import { formatearMonto } from '../../utils/formatters';

export interface ResumenPagoProps {
  /** Información detallada del ítem que se va a pagar (cancha o membresía) */
  detalle: DetalleItemPago;
  /** Monto final a cobrar */
  montoTotal: number;
  /** Indica si la operación está siendo procesada en la pasarela */
  isProcessing?: boolean;
  /** Callback al presionar el botón "Pagar", recibe el token generado por la pasarela simulada */
  onConfirmarPago: (tokenPasarela: string) => void | Promise<void>;
  /** Mensaje de error general si falló la invocación */
  error?: string | null;
  /** Habilita selector para simular aprobación o rechazo en modo demo */
  permitirSimularRechazo?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
}

export function ResumenPago({
  detalle,
  montoTotal,
  isProcessing = false,
  onConfirmarPago,
  error = null,
  permitirSimularRechazo = true,
  className = '',
}: ResumenPagoProps) {
  const radioGroupName = useId();
  // En cumplimiento de RNF-02, la pasarela es simulada y solo maneja tokens de resultado
  const [tokenSimulado, setTokenSimulado] = useState<'tok_mock_aprobado' | 'tok_mock_rechazado'>('tok_mock_aprobado');

  const esCancha = detalle.tipo === 'CANCHA';

  const handlePagar = async () => {
    if (isProcessing) return;
    await onConfirmarPago(tokenSimulado);
  };

  return (
    <Card className={`overflow-hidden border-slate-200 shadow-sm ${className}`}>
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-fitzone-coral">
                {esCancha ? 'Reserva de Cancha' : 'Membresía FitZone'}
              </span>
              <Badge variant="default">Checkout Seguro</Badge>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-fitzone-navy font-outfit mt-1">
              {detalle.titulo}
            </CardTitle>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#2E9E5B] bg-[#EAF7EE] px-3 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5" />
            <span>Datos Protegidos</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Detalle informativo del ítem */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
          {esCancha ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-fitzone-navy shrink-0" />
                <span className="font-semibold">{detalle.subtitulo || 'Sede FitZone'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-fitzone-navy shrink-0" />
                <span className="font-semibold">{detalle.fecha || 'Fecha programada'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-fitzone-coral shrink-0" />
                <span className="font-semibold">{detalle.horario || 'Turno seleccionado'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-medium text-slate-500">Plan contratado:</span>
                <span className="font-extrabold text-fitzone-navy">{detalle.planNombre || detalle.titulo}</span>
              </div>
              {detalle.duracionMeses && (
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium text-slate-500">Período de cobertura:</span>
                  <span className="font-bold">{detalle.duracionMeses} {detalle.duracionMeses === 1 ? 'mes' : 'meses'}</span>
                </div>
              )}
              {detalle.fechaVencimiento && (
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium text-slate-500">Válido hasta:</span>
                  <span className="font-bold text-fitzone-navy">{detalle.fechaVencimiento}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desglose de precios: integra DesglosePrecio si es Cancha o resumen de abono si es Membresía */}
        {esCancha && detalle.cotizacion ? (
          <DesglosePrecio
            cotizacion={detalle.cotizacion}
            total={montoTotal}
            variant="card"
            titulo="Desglose del Turno"
          />
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <span className="text-xs font-black text-fitzone-navy uppercase tracking-wider font-outfit">
                Resumen del Arancel
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-[#2E9E5B] bg-[#EAF7EE] px-2 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3 text-[#2E9E5B]" />
                Acceso Total
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Cuota membresía ({detalle.planNombre || 'Socio'})</span>
              <span className="font-extrabold text-fitzone-navy font-outfit">{formatearMonto(montoTotal)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-sm sm:text-base font-black text-fitzone-navy">
              <span>Total final a debitar</span>
              <span className="text-xl sm:text-2xl font-black text-fitzone-navy font-outfit">
                {formatearMonto(montoTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Notificación de seguridad RNF-02 */}
        <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-start gap-2.5 border border-slate-100">
          <ShieldCheck className="w-4 h-4 text-[#2E9E5B] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-slate-700">Pasarela de pagos protegida:</strong> FitZone no solicita ni almacena números de tarjeta ni datos bancarios sensibles (RNF-02).
          </p>
        </div>

        {/* Selector de simulación para pruebas en desarrollo/mock */}
        {permitirSimularRechazo && (
          <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
              Simulación de Pasarela (Modo Pruebas):
            </span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="radio"
                  name={radioGroupName}
                  value="tok_mock_aprobado"
                  checked={tokenSimulado === 'tok_mock_aprobado'}
                  onChange={() => setTokenSimulado('tok_mock_aprobado')}
                  disabled={isProcessing}
                  className="text-fitzone-navy focus:ring-fitzone-navy"
                />
                <span>Simular Aprobado (Exitoso)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="radio"
                  name={radioGroupName}
                  value="tok_mock_rechazado"
                  checked={tokenSimulado === 'tok_mock_rechazado'}
                  onChange={() => setTokenSimulado('tok_mock_rechazado')}
                  disabled={isProcessing}
                  className="text-fitzone-coral focus:ring-fitzone-coral"
                />
                <span className="text-fitzone-coral font-bold">Simular Rechazo (Límite excedido)</span>
              </label>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
        <div className="text-center sm:text-left">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Monto a pagar</span>
          <span className="text-2xl font-black text-fitzone-navy font-outfit">
            {formatearMonto(montoTotal)}
          </span>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isProcessing}
          onClick={() => void handlePagar()}
          className="w-full sm:w-auto px-8 py-3 bg-[#2E9E5B] hover:bg-[#26864d] text-white font-black text-sm rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <span>Procesando pago seguro...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>Pagar · {formatearMonto(montoTotal)}</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
