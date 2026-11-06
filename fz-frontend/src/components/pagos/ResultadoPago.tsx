import { CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, FileText, Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Alert, Button, StatusBadge } from '../ui';
import { BotonDescargaPdf } from './BotonDescargaPdf';
import type { TransaccionDTO, ComprobanteDTO } from '../../types';
import { formatearMonto, formatearFechaHora } from '../../utils/formatters';

export interface ResultadoPagoProps {
  /** Transacción resultante del procesamiento */
  transaccion: TransaccionDTO;
  /** Comprobante legal emitido si el pago fue aprobado */
  comprobante?: ComprobanteDTO | null;
  /** Motivo explícito de rechazo para mostrar en caso de fallo */
  errorMotivo?: string | null;
  /** Callback para reintentar el pago sobre el mismo ítem (prevención de BUG-03) */
  onReintentar?: () => void;
  /** Callback para volver al catálogo o listado principal */
  onVolver?: () => void;
  /** Callback personalizado para descarga de comprobante */
  onDescargarPdf?: () => Promise<void> | void;
  /** Clases CSS adicionales */
  className?: string;
}

export function ResultadoPago({
  transaccion,
  comprobante,
  errorMotivo,
  onReintentar,
  onVolver,
  onDescargarPdf,
  className = '',
}: ResultadoPagoProps) {
  const esAprobado = transaccion.estadoPago === 'CONFIRMADO';
  const esRechazado = transaccion.estadoPago === 'RECHAZADO';

  const motivoRechazoFinal =
    errorMotivo ||
    transaccion.motivoRechazo ||
    'La entidad bancaria o pasarela emisora rechazó la operación (límite excedido o fondos insuficientes). Por favor, verificá tus fondos o reintentá la transacción.';

  return (
    <Card className={`overflow-hidden border-slate-200 shadow-card ${className}`}>
      {/* Banner de estado superior */}
      <CardHeader
        className={`pb-5 border-b ${
          esAprobado
            ? 'bg-[#EAF7EE] border-[#2E9E5B]/20'
            : 'bg-[#FDECEE] border-[#E5484D]/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                esAprobado
                  ? 'bg-[#2E9E5B] text-white'
                  : 'bg-[#E5484D] text-white'
              }`}
            >
              {esAprobado ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            <div>
              <CardTitle className="text-xl sm:text-2xl font-black text-fitzone-navy font-outfit">
                {esAprobado ? '¡Pago Confirmado!' : 'Pago Rechazado'}
              </CardTitle>
              <p className="text-xs text-slate-600 mt-0.5">
                {esAprobado
                  ? 'La operación fue acreditada exitosamente y tu comprobante está listo.'
                  : 'No pudimos procesar el cobro en la pasarela de pagos.'}
              </p>
            </div>
          </div>

          <StatusBadge status={transaccion.estadoPago} size="md" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Caso Rechazado: Alert con motivo claro y acción directa */}
        {esRechazado && (
          <div className="space-y-4">
            <Alert
              type="error"
              title="Operación no procesada"
              message={motivoRechazoFinal}
            />

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-700 block">Detalles del cobro original:</span>
              <div className="flex justify-between">
                <span>Concepto:</span>
                <span className="font-semibold text-fitzone-navy">
                  {transaccion.descripcion || transaccion.concepto.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Monto a debitar:</span>
                <span className="font-bold text-fitzone-navy font-outfit">
                  {formatearMonto(transaccion.monto)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fecha y hora:</span>
                <span>{formatearFechaHora(transaccion.fechaHoraCreacion)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Caso Aprobado: Detalles fiscales del comprobante y resumen */}
        {esAprobado && (
          <div className="space-y-4">
            {/* Tarjeta de comprobante fiscal AFIP */}
            <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-fitzone-navy" />
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Comprobante Legal
                    </span>
                    <span className="text-base font-black text-fitzone-navy font-outfit">
                      {comprobante?.numeroFactura || 'FAC-0001-00000123'}
                    </span>
                  </div>
                </div>

                {comprobante?.tipoComprobante && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase bg-fitzone-navy text-white self-start sm:self-auto">
                    {comprobante.tipoComprobante.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Titular</span>
                  <span className="font-bold text-fitzone-navy text-sm">
                    {transaccion.usuario.nombre} {transaccion.usuario.apellido}
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">DNI: {transaccion.usuario.dni}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Sede de Emisión</span>
                  <span className="font-bold text-fitzone-navy text-sm flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {transaccion.sede.nombre}
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    {transaccion.fechaHoraConfirmacion
                      ? formatearFechaHora(transaccion.fechaHoraConfirmacion)
                      : formatearFechaHora(transaccion.fechaHoraCreacion)}
                  </span>
                </div>
              </div>

              {comprobante?.cae && (
                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                  <span><strong>CAE:</strong> {comprobante.cae}</span>
                  {comprobante.fechaVencimientoCae && (
                    <span><strong>Vto. CAE:</strong> {comprobante.fechaVencimientoCae}</span>
                  )}
                </div>
              )}
            </div>

            {/* Resumen de Monto Abonado */}
            <div className="flex justify-between items-center px-4 py-3 bg-white rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-600">Total Abonado</span>
              <span className="text-xl font-black text-fitzone-navy font-outfit">
                {formatearMonto(transaccion.monto)}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
        {onVolver ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onVolver}
            className="w-full sm:w-auto inline-flex items-center gap-2 cursor-pointer font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
        ) : (
          <div />
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {/* Si fue rechazado: Botón para reintentar manteniendo el mismo concepto (BUG-03 prevenido) */}
          {esRechazado && onReintentar && (
            <Button
              type="button"
              variant="coral"
              size="md"
              onClick={onReintentar}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 cursor-pointer font-extrabold shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar pago</span>
            </Button>
          )}

          {/* Si fue aprobado: Botón para descargar el PDF */}
          {esAprobado && (
            <BotonDescargaPdf
              numeroFactura={comprobante?.numeroFactura || '0001-00000123'}
              urlPdf={comprobante?.urlDescargaPdf}
              idComprobante={comprobante?.idComprobante}
              onDescargar={onDescargarPdf}
              variant="primary"
              size="md"
              className="w-full sm:w-auto bg-[#1B2A55] hover:bg-[#111A36] text-white shadow-sm"
            />
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
