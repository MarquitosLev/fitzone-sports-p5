import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { Alert, Spinner } from '../components/ui';
import { ResumenPago, ResultadoPago } from '../components/pagos';
import { obtenerReservaInvitado } from '../services/canchasService';
import {
  pagarReservaInvitado,
  descargarComprobanteInvitado,
  descargarBlobEnNavegador,
} from '../services/pagosService';
import { useToast } from '../context/ToastContext';
import { AppError } from '../services/httpClient';
import type { ReservaInvitadoDTO, ResultadoPagoDTO, DetalleItemPago } from '../types';

/** Checkout público del invitado: el código de la URL es lo que da acceso a la reserva. */
export function CheckoutInvitadoPage() {
  const { codigo = '' } = useParams<{ codigo: string }>();
  const { addToast } = useToast();

  const [reserva, setReserva] = useState<ReservaInvitadoDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPagoDTO | null>(null);

  useEffect(() => {
    let cancelado = false;
    obtenerReservaInvitado(codigo)
      .then((r) => !cancelado && setReserva(r))
      .catch((err: unknown) => !cancelado && setError(err instanceof Error ? err.message : 'No encontramos la reserva'))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [codigo]);

  const pagar = async () => {
    setProcesando(true);
    try {
      const res = await pagarReservaInvitado(codigo);
      setResultado(res);
      if (res.aprobado) setReserva((r) => (r ? { ...r, pagada: true } : r));
    } catch (err: unknown) {
      if (!(err instanceof AppError)) {
        addToast({ type: 'error', title: 'Error de pago', message: err instanceof Error ? err.message : 'No se pudo pagar' });
      }
    } finally {
      setProcesando(false);
    }
  };

  const descargarPdf = async () => {
    try {
      const blob = await descargarComprobanteInvitado(codigo);
      descargarBlobEnNavegador(blob, `comprobante-${resultado?.comprobante?.numeroFactura ?? codigo.slice(0, 8)}.pdf`);
    } catch (err: unknown) {
      addToast({ type: 'error', title: 'Error de descarga', message: err instanceof Error ? err.message : 'No se pudo descargar el PDF' });
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !reserva) {
    return (
      <div className="max-w-xl mx-auto">
        <Alert
          type="error"
          title="Reserva no encontrada"
          message={error ?? 'Revisá el link o el código de tu reserva.'}
          action={<Link to="/canchas" className="font-bold underline">Volver a Canchas</Link>}
        />
      </div>
    );
  }

  const detalle: DetalleItemPago = {
    tipo: 'CANCHA',
    titulo: `Turno · ${reserva.cancha}`,
    subtitulo: reserva.sede,
    canchaNombre: reserva.cancha,
    deporte: reserva.tipoCancha ?? undefined,
    fecha: reserva.fechaHoraInicio.slice(0, 10),
    horario: `${reserva.fechaHoraInicio.slice(11, 16)} a ${reserva.fechaHoraFin.slice(11, 16)} hs`,
    cotizacion: reserva.cotizacion ?? undefined,
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      <div className="bg-fitzone-navy text-white rounded-3xl p-5 flex items-center gap-4">
        <Ticket className="w-8 h-8 text-fitzone-gold shrink-0" />
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-fitzone-gold block">Código de reserva</span>
          <span className="font-mono font-bold text-sm sm:text-base break-all" data-testid="codigo-reserva">
            {reserva.codigoReserva}
          </span>
          <p className="text-[11px] text-slate-300 mt-1">
            Guardá este link: con el código pagás, descargás el comprobante y presentás el turno en la sede.
          </p>
        </div>
      </div>

      {resultado ? (
        <ResultadoPago
          transaccion={resultado.transaccion}
          comprobante={resultado.comprobante}
          errorMotivo={resultado.mensaje}
          onReintentar={() => void pagar()}
          onDescargarPdf={descargarPdf}
        />
      ) : reserva.pagada ? (
        <Alert
          type="success"
          title="Turno pagado"
          message="Tu reserva ya está paga."
          action={
            <button type="button" className="font-bold underline cursor-pointer" onClick={() => void descargarPdf()}>
              Descargar comprobante
            </button>
          }
        />
      ) : (
        <ResumenPago detalle={detalle} montoTotal={reserva.precioFinal} isProcessing={procesando} onConfirmarPago={pagar} />
      )}
    </div>
  );
}
