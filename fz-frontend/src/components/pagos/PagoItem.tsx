import { RefreshCw, Calendar, Tag } from 'lucide-react';
import { StatusBadge, Button } from '../ui';
import { BotonDescargaPdf } from './BotonDescargaPdf';
import type { TransaccionDTO, ComprobanteDTO } from '../../types';
import { formatearMonto, formatearFechaHora } from '../../utils/formatters';

export interface PagoItemProps {
  /** Transacción a exhibir en el historial */
  transaccion: TransaccionDTO;
  /** Comprobante legal asociado si fue emitido */
  comprobante?: ComprobanteDTO | null;
  /** Acción de reintentar si el pago se encuentra en estado RECHAZADO */
  onReintentar?: (transaccion: TransaccionDTO) => void;
  /** Acción de descarga de comprobante */
  onDescargarPdf?: (transaccion: TransaccionDTO) => Promise<void> | void;
  /** Clases CSS adicionales */
  className?: string;
}

export function PagoItem({
  transaccion,
  comprobante,
  onReintentar,
  onDescargarPdf,
  className = '',
}: PagoItemProps) {
  const isConfirmed = transaccion.estadoPago === 'CONFIRMADO';
  const isRejected = transaccion.estadoPago === 'RECHAZADO';
  const isPending = transaccion.estadoPago === 'PENDIENTE';

  const conceptoTexto = transaccion.descripcion || transaccion.concepto.replace(/_/g, ' ');

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      {/* Columna izquierda: Concepto, fecha y detalle */}
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-sm sm:text-base text-fitzone-navy truncate">
            {conceptoTexto}
          </span>
          <StatusBadge status={transaccion.estadoPago} size="xs" showDot={true} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatearFechaHora(transaccion.fechaHoraCreacion)}</span>
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Tag className="w-3.5 h-3.5" />
            <span>ID #{transaccion.idTransaccion}</span>
          </span>
          {comprobante?.numeroFactura && (
            <span className="font-mono text-fitzone-navy font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded">
              N° {comprobante.numeroFactura}
            </span>
          )}
        </div>

        {isRejected && transaccion.motivoRechazo && (
          <p className="text-[11px] text-red-600 font-medium mt-1">
            Motivo: {transaccion.motivoRechazo}
          </p>
        )}
      </div>

      {/* Columna derecha: Monto y Acción Contextual */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Monto</span>
          <span className="text-base sm:text-lg font-black text-fitzone-navy font-outfit">
            {formatearMonto(transaccion.monto)}
          </span>
        </div>

        {/* Acciones */}
        <div className="shrink-0 flex items-center gap-2">
          {isConfirmed && (
            <BotonDescargaPdf
              numeroFactura={comprobante?.numeroFactura || `FAC-${transaccion.idTransaccion}`}
              urlPdf={comprobante?.urlDescargaPdf}
              idComprobante={comprobante?.idComprobante}
              onDescargar={onDescargarPdf ? () => onDescargarPdf(transaccion) : undefined}
              size="xs"
              variant="secondary"
              texto="Comprobante"
            />
          )}

          {isRejected && onReintentar && (
            <Button
              type="button"
              size="xs"
              variant="coral"
              onClick={() => onReintentar(transaccion)}
              className="inline-flex items-center gap-1 cursor-pointer font-bold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reintentar</span>
            </Button>
          )}

          {isPending && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
              En proceso
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
