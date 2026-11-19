import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { Alert, Spinner } from '../components/ui';
import { DesglosePrecio } from '../components/canchas';
import { obtenerReservaInvitado } from '../services/canchasService';
import { descargarComprobanteInvitado, descargarBlobEnNavegador } from '../services/pagosService';
import { useToast } from '../context/ToastContext';
import type { ReservaInvitadoDTO } from '../types';

/**
 * Comprobante público del invitado: el código de la URL es lo que da acceso a la reserva.
 * La reserva ya llega pagada (ADR-018); solo las anteriores al cambio pueden figurar sin pagar.
 */
export function CheckoutInvitadoPage() {
  const { codigo = '' } = useParams<{ codigo: string }>();
  const { addToast } = useToast();

  const [reserva, setReserva] = useState<ReservaInvitadoDTO | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const descargarPdf = async () => {
    try {
      const blob = await descargarComprobanteInvitado(codigo);
      descargarBlobEnNavegador(blob, `comprobante-${reserva?.numeroFactura ?? codigo.slice(0, 8)}.pdf`);
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
            Guardá este link: con el código descargás el comprobante y presentás el turno en la sede.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-1">
        <h2 className="text-base font-black text-fitzone-navy font-outfit">{reserva.cancha}</h2>
        <p className="text-xs text-slate-500">{reserva.sede}</p>
        <p className="text-sm font-bold text-fitzone-navy">
          {reserva.fechaHoraInicio.slice(0, 10)} · {reserva.fechaHoraInicio.slice(11, 16)} a{' '}
          {reserva.fechaHoraFin.slice(11, 16)} hs
        </p>
      </div>

      {reserva.cotizacion && <DesglosePrecio cotizacion={reserva.cotizacion} titulo="Detalle del pago" variant="card" />}

      {reserva.pagada ? (
        <Alert
          type="success"
          title="Turno pagado"
          message={
            reserva.numeroFactura
              ? `Tu reserva está paga. Comprobante ${reserva.numeroFactura}.`
              : 'Tu reserva está paga.'
          }
          action={
            <button type="button" className="font-bold underline cursor-pointer" onClick={() => void descargarPdf()}>
              Descargar comprobante
            </button>
          }
        />
      ) : (
        <Alert
          type="warning"
          title="Reserva sin pagar"
          message="Esta reserva es anterior al pago en un paso y no registra pago. Consultá en la recepción de la sede."
        />
      )}
    </div>
  );
}
