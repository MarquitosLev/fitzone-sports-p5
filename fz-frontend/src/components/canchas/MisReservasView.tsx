/**
 * MisReservasView.tsx — Pantalla de Mis Reservas de Cancha (Pantalla 2).
 *
 * Características:
 * - Listado de reservas del usuario socio o cliente externo.
 * - Banner destacado con el próximo turno confirmado.
 * - Filtros rápidos: Todas, Próximas (CONFIRMADA, PENDIENTE_PAGO), Historial (CANCELADA, FINALIZADA).
 * - Cancelación de reservas con ConfirmDialog y actualización inmediata.
 * - Enlace directo al checkout de pago (/pagos) para turnos en PENDIENTE_PAGO.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Plus,
  RefreshCw,
  QrCode,
  FileText,
} from 'lucide-react';
import { Button, StatusBadge, ConfirmDialog, Spinner, EmptyState, Alert } from '../ui';
import { listarMisReservas, cancelarReserva } from '../../services/canchasService';
import { useToast } from '../../context/ToastContext';
import type { ReservaCanchaDTO } from '../../types';
import { formatearMonto } from '../../utils/formatters';

export interface MisReservasViewProps {
  /** Callback para ir a la pestaña o flujo de nueva reserva */
  onNuevaReserva?: () => void;
  className?: string;
}

export function MisReservasView({ onNuevaReserva, className = '' }: MisReservasViewProps) {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [reservas, setReservas] = useState<ReservaCanchaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtro activo: 'Todas' | 'Próximas' | 'Historial'
  const [activeFilter, setActiveFilter] = useState<'Todas' | 'Próximas' | 'Historial'>('Todas');

  // Cancelación modal
  const [reservaACancelar, setReservaACancelar] = useState<ReservaCanchaDTO | null>(null);
  const [cancelando, setCancelando] = useState(false);

  // Cargar reservas
  const cargarReservas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarMisReservas();
      setReservas(data);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar las reservas';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarReservas();
  }, [cargarReservas]);

  // Manejo de cancelación con ConfirmDialog
  const handleConfirmarCancelacion = async () => {
    if (!reservaACancelar) return;
    setCancelando(true);
    try {
      const cancelada = await cancelarReserva(reservaACancelar.idReservaCancha);
      setReservas((prev) =>
        prev.map((r) =>
          r.idReservaCancha === cancelada.idReservaCancha ? cancelada : r
        )
      );
      addToast({
        type: 'success',
        title: 'Reserva cancelada',
        message: `La reserva para ${cancelada.cancha.nombre} fue cancelada y el turno fue liberado.`,
      });
      setReservaACancelar(null);
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo cancelar la reserva';
      addToast({
        type: 'error',
        title: 'Error de cancelación',
        message: mensaje,
      });
    } finally {
      setCancelando(false);
    }
  };

  // Próximo turno confirmado para banner destacado
  const proximoConfirmado = useMemo(() => {
    return reservas.find((r) => r.estado === 'CONFIRMADA');
  }, [reservas]);

  // Filtrado de reservas
  const reservasFiltradas = useMemo(() => {
    return reservas.filter((b) => {
      const st = b.estado ?? 'CONFIRMADA';
      if (activeFilter === 'Próximas') {
        return st === 'CONFIRMADA' || st === 'PENDIENTE_PAGO';
      }
      if (activeFilter === 'Historial') {
        return st === 'FINALIZADA' || st === 'CANCELADA';
      }
      return true;
    });
  }, [reservas, activeFilter]);

  // Contadores para las pestañas
  const counts = useMemo(() => {
    const proximas = reservas.filter(
      (r) => (r.estado ?? 'CONFIRMADA') === 'CONFIRMADA' || r.estado === 'PENDIENTE_PAGO'
    ).length;
    const historial = reservas.filter(
      (r) => r.estado === 'FINALIZADA' || r.estado === 'CANCELADA'
    ).length;
    return {
      Todas: reservas.length,
      Próximas: proximas,
      Historial: historial,
    };
  }, [reservas]);

  // Formato de fecha legible
  const formatearFecha = (iso: string) => {
    try {
      const [fecha] = iso.split('T');
      const [y, m, d] = fecha.split('-').map(Number);
      const obj = new Date(y, m - 1, d);
      const nombresDia = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const nombresMes = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
      ];
      return `${nombresDia[obj.getDay()]} ${d} ${nombresMes[obj.getMonth()]} ${y}`;
    } catch {
      return iso;
    }
  };

  const formatearHoraRango = (inicioIso: string, finIso: string) => {
    try {
      const hIni = inicioIso.split('T')[1].substring(0, 5);
      const hFin = finIso.split('T')[1].substring(0, 5);
      return `${hIni} – ${hFin}`;
    } catch {
      return '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Encabezado y Acción Nueva Reserva */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-black uppercase text-fitzone-coral tracking-wider block">
            CANCHAS DEPORTIVAS
          </span>
          <h2 className="text-2xl font-black text-fitzone-navy font-outfit mt-0.5">
            Mis reservas de cancha
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultá tus próximos partidos, gestioná pagos pendientes e historial de turnos
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={RefreshCw}
            onClick={() => void cargarReservas()}
            disabled={loading}
          >
            Actualizar
          </Button>

          {onNuevaReserva && (
            <Button
              type="button"
              variant="coral"
              leftIcon={Plus}
              onClick={onNuevaReserva}
            >
              Nueva reserva
            </Button>
          )}
        </div>
      </div>

      {/* Featured Next Confirmed Booking Banner */}
      {proximoConfirmado && (
        <div className="bg-gradient-to-r from-fitzone-navy via-[#213469] to-[#2B4380] text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 animate-slide-up">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#F0B429] tracking-wider">
                TU PRÓXIMO TURNO CONFIRMADO
              </span>
              <span className="bg-[#2E9E5B] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                CONFIRMADA
              </span>
            </div>
            <h3 className="text-2xl font-black font-outfit">
              {proximoConfirmado.cancha.nombre}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#F0B429]" />
                {formatearFecha(proximoConfirmado.fechaHoraInicio)}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#F0B429]" />
                {formatearHoraRango(
                  proximoConfirmado.fechaHoraInicio,
                  proximoConfirmado.fechaHoraFin
                )}
              </span>
              <span>· {proximoConfirmado.cancha.sede?.nombre}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-300 block uppercase font-bold">
                Tarifa abonada
              </span>
              <span className="text-2xl font-black text-[#F0B429] font-outfit">
                {formatearMonto(proximoConfirmado.precioFinal)}
              </span>
            </div>

            <Button
              type="button"
              variant="coral"
              size="sm"
              leftIcon={QrCode}
              onClick={() => navigate('/acceso')}
            >
              Ver Pase QR
            </Button>
          </div>
        </div>
      )}

      {/* Filtros: Todas (N) | Próximas (N) | Historial (N) */}
      <div className="flex bg-slate-100 p-1 rounded-2xl self-start max-w-fit text-xs font-bold">
        {(['Todas', 'Próximas', 'Historial'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeFilter === tab
                ? 'bg-white text-fitzone-navy shadow-xs font-black'
                : 'text-slate-600 hover:text-fitzone-navy'
            }`}
          >
            {tab} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Estado de Carga */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="text-xs text-slate-500 font-semibold mt-3">
            Cargando tus reservas...
          </p>
        </div>
      )}

      {/* Error */}
      {error && <Alert type="error" title="Error al cargar reservas" message={error} />}

      {/* Listado de Reservas */}
      {!loading && !error && (
        <div className="space-y-4">
          {reservasFiltradas.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hay reservas en esta sección"
              description={
                reservas.length === 0
                  ? 'Aún no tenés reservas de cancha. Podés consultar los turnos disponibles y reservar el tuyo al instante.'
                  : `No tenés reservas registradas bajo el filtro "${activeFilter}".`
              }
              actionLabel={onNuevaReserva ? 'Reservar turno' : undefined}
              onAction={onNuevaReserva}
            />
          ) : (
            reservasFiltradas.map((b) => {
              const isPending = b.estado === 'PENDIENTE_PAGO';
              const isConfirmed = b.estado === 'CONFIRMADA' || !b.estado;
              const isCancelled = b.estado === 'CANCELADA';
              const isFinished = b.estado === 'FINALIZADA';

              return (
                <div
                  key={b.idReservaCancha}
                  className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-200 transition-all"
                >
                  {/* Detalles del turno */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-fitzone-coral tracking-wider">
                        {b.cancha.tipo ?? 'Cancha'}
                      </span>
                      <span className="text-base font-black text-fitzone-navy font-outfit">
                        {b.cancha.nombre}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        · #{b.idReservaCancha}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-bold text-fitzone-navy">
                        <Calendar className="w-3.5 h-3.5 text-fitzone-navy" />
                        <span>{formatearFecha(b.fechaHoraInicio)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-fitzone-coral">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {formatearHoraRango(b.fechaHoraInicio, b.fechaHoraFin)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.cancha.sede?.nombre}</span>
                      </div>
                    </div>

                    <div className="text-xs">
                      {isPending && (
                        <span className="text-[#B7791F] font-bold">
                          Pendiente de pago · Completá el checkout para confirmar el turno
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="text-[#2E9E5B] font-bold">
                          Pago verificado · Turno reservado
                        </span>
                      )}
                      {isCancelled && (
                        <span className="text-fitzone-red font-bold">
                          Reserva cancelada
                        </span>
                      )}
                      {isFinished && (
                        <span className="text-slate-400 font-semibold">
                          Turno finalizado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estado, Precio y Acciones */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="mb-1">
                        <StatusBadge
                          status={b.estado ?? 'CONFIRMADA'}
                          showDot
                          size="sm"
                        />
                      </div>
                      <span className="text-lg font-black text-fitzone-navy font-outfit">
                        {formatearMonto(b.precioFinal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon={CreditCard}
                            onClick={() => navigate('/pagos')}
                          >
                            Ir a Pagar
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setReservaACancelar(b)}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}

                      {isConfirmed && (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={FileText}
                            onClick={() => navigate('/pagos')}
                          >
                            Ver comprobante
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setReservaACancelar(b)}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}

                      {(isCancelled || isFinished) && (
                        <span className="text-xs text-slate-400 font-medium px-2 py-1">
                          Sin acciones
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ConfirmDialog para Cancelación */}
      <ConfirmDialog
        isOpen={Boolean(reservaACancelar)}
        onClose={() => {
          if (!cancelando) setReservaACancelar(null);
        }}
        onConfirm={handleConfirmarCancelacion}
        variant="danger"
        title="¿Cancelar esta reserva?"
        description={
          reservaACancelar
            ? `Estás por cancelar tu turno en "${reservaACancelar.cancha.nombre}" para el ${formatearFecha(reservaACancelar.fechaHoraInicio)}. El horario quedará libre para otros deportistas.`
            : 'Estás por cancelar tu reserva.'
        }
        confirmText="Sí, cancelar reserva"
        cancelText="Conservar reserva"
        isLoading={cancelando}
      />
    </div>
  );
}
