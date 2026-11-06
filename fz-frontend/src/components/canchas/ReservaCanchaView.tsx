/**
 * ReservaCanchaView.tsx — Pantalla de Reserva de Cancha.
 *
 * Flujo:
 * 1. Elegir cancha (filtro por deporte o selección directa de tarjeta).
 * 2. Elegir fecha (con SelectorFecha: hoy, mañana, días rápidos o datepicker).
 * 3. Elegir turno (con GrillaDisponibilidad: franjas libres, ocupadas, mantenimiento y franja pico 19 a 21 hs).
 * 4. Confirmar reserva con DesglosePrecio y ConfirmDialog.
 *
 * Manejo de errores de negocio:
 * - Si el horario ya fue tomado (409), muestra el mensaje y refresca la grilla automáticamente.
 * - Al confirmar, lleva al checkout de pago (M5) o Mis Reservas.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { CanchaCard } from './CanchaCard';
import { SelectorFecha } from './SelectorFecha';
import { GrillaDisponibilidad } from './GrillaDisponibilidad';
import { etiquetaTipo } from './tiposCancha';
import { DesglosePrecio } from './DesglosePrecio';
import { Button, Alert, Modal } from '../ui';
import {
  listarCanchas,
  obtenerDisponibilidad,
  cotizarTurno,
  crearReserva,
} from '../../services/canchasService';
import { useSede } from '../../context/SedeContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { AppError } from '../../services/httpClient';
import type {
  CanchaDTO,
  FranjaHorariaDTO,
  CotizacionReservaDTO,
  ReservaCanchaDTO,
} from '../../types';

export interface ReservaCanchaViewProps {
  /** Fecha inicial seleccionada (opcional) */
  fechaInicial?: string;
  /** Callback opcional al completar una reserva exitosa */
  onReservaExitosa?: (reserva: ReservaCanchaDTO) => void;
  /** Callback para ir a la pestaña de Mis Reservas */
  onVerMisReservas?: () => void;
  className?: string;
}

export function ReservaCanchaView({
  fechaInicial,
  onReservaExitosa,
  onVerMisReservas,
  className = '',
}: ReservaCanchaViewProps) {
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  // Fecha actual formateada en YYYY-MM-DD
  const hoyIso = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Estados de datos
  const [canchas, setCanchas] = useState<CanchaDTO[]>([]);
  const [loadingCanchas, setLoadingCanchas] = useState(false);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<CanchaDTO | null>(null);

  // Filtro de Deporte
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');

  // Fecha y Turnos
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(fechaInicial ?? hoyIso);
  const [franjas, setFranjas] = useState<FranjaHorariaDTO[]>([]);
  const [loadingFranjas, setLoadingFranjas] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<FranjaHorariaDTO | null>(null);

  // Cotización
  const [cotizacion, setCotizacion] = useState<CotizacionReservaDTO | null>(null);
  const [loadingCotizacion, setLoadingCotizacion] = useState(false);

  // Perfil del usuario: sale de la sesión (el backend aplica el descuento)
  const { usuario } = useAuth();
  const esSocio = usuario?.tipoUsuario === 'SOCIO';
  // Reservan socios y externos con sesión; el personal no reserva a su nombre
  const puedeReservar = usuario?.tipoUsuario === 'SOCIO' || usuario?.tipoUsuario === 'EXTERNO';

  // Modal de Confirmación
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [errorConflicto, setErrorConflicto] = useState<string | null>(null);

  // Cargar Canchas de la Sede
  const cargarCanchas = useCallback(async () => {
    if (!sedeActiva) return;
    setLoadingCanchas(true);
    try {
      const data = await listarCanchas(sedeActiva.idSede);
      setCanchas(data);

      // Si no hay cancha seleccionada o la actual ya no está, elegir la primera disponible
      if (data.length > 0) {
        const primeraDisponible = data.find((c) => !c.enMantenimiento) || data[0];
        setCanchaSeleccionada((prev) => {
          if (!prev) return primeraDisponible;
          const sigueExistiendo = data.find((c) => c.idCancha === prev.idCancha);
          return sigueExistiendo || primeraDisponible;
        });
      } else {
        setCanchaSeleccionada(null);
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error de carga',
        message: 'No se pudieron cargar las canchas de la sede activa.',
      });
    } finally {
      setLoadingCanchas(false);
    }
  }, [sedeActiva, addToast]);

  useEffect(() => {
    void cargarCanchas();
  }, [cargarCanchas]);

  // Cargar Disponibilidad cuando cambia cancha o fecha
  const cargarDisponibilidad = useCallback(async () => {
    if (!canchaSeleccionada) {
      setFranjas([]);
      return;
    }
    setLoadingFranjas(true);
    try {
      const data = await obtenerDisponibilidad(canchaSeleccionada.idCancha, fechaSeleccionada);
      setFranjas(data);

      // Si el turno previamente seleccionado ya no está libre en la nueva disponibilidad, deseleccionar
      setTurnoSeleccionado((prev) => {
        if (!prev) return null;
        const sigueLibre = data.find((f) => f.id === prev.id && f.estado === 'LIBRE');
        return sigueLibre || null;
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Error de disponibilidad',
        message: 'No se pudo obtener la disponibilidad para la fecha seleccionada.',
      });
    } finally {
      setLoadingFranjas(false);
    }
  }, [canchaSeleccionada, fechaSeleccionada, addToast]);

  useEffect(() => {
    void cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  // Calcular cotización cuando se selecciona un turno o cambia el tipo de usuario (socio/externo)
  useEffect(() => {
    if (!canchaSeleccionada || !turnoSeleccionado) {
      setCotizacion(null);
      return;
    }

    let cancelado = false;
    const actualizarCotizacion = async () => {
      setLoadingCotizacion(true);
      try {
        const coti = await cotizarTurno(
          canchaSeleccionada.idCancha,
          turnoSeleccionado.horaInicio,
          esSocio,
          fechaSeleccionada,
          turnoSeleccionado.horaFin
        );
        if (!cancelado) {
          setCotizacion(coti);
        }
      } catch {
        if (cancelado) return;
        // El precio sale solo del servidor: sin cotización no se puede confirmar
        // (el error ya lo avisó httpClient)
        setCotizacion(null);
      } finally {
        if (!cancelado) setLoadingCotizacion(false);
      }
    };

    void actualizarCotizacion();
    return () => {
      cancelado = true;
    };
  }, [canchaSeleccionada, turnoSeleccionado, esSocio, fechaSeleccionada, addToast]);

  // Deportes de las canchas cargadas (el filtro no ofrece deportes sin canchas)
  const tiposDisponibles = useMemo(
    () => Array.from(new Set(canchas.flatMap((c) => (c.tipo ? [c.tipo] : [])))),
    [canchas]
  );

  // Canchas filtradas por deporte
  const canchasFiltradas = useMemo(() => {
    return canchas.filter((c) => {
      if (filtroTipo === 'TODOS') return true;
      return c.tipo === filtroTipo;
    });
  }, [canchas, filtroTipo]);

  // Selección de Cancha
  const handleSelectCancha = (cancha: CanchaDTO) => {
    setCanchaSeleccionada(cancha);
    setTurnoSeleccionado(null);
    setErrorConflicto(null);
  };

  // Selección de Turno
  const handleSelectTurno = (turno: FranjaHorariaDTO) => {
    setTurnoSeleccionado(turno);
    setErrorConflicto(null);
  };

  // Apertura de modal de confirmación
  const handleAbrirConfirmacion = () => {
    if (!canchaSeleccionada || !turnoSeleccionado || !cotizacion) return;
    setErrorConflicto(null);
    setModalConfirmacionOpen(true);
  };

  // Confirmar reserva
  const handleConfirmarReserva = async () => {
    if (!canchaSeleccionada || !turnoSeleccionado) return;

    setConfirmando(true);
    setErrorConflicto(null);

    try {
      const nuevaReserva = await crearReserva(
        {
          idCancha: canchaSeleccionada.idCancha,
          fecha: fechaSeleccionada,
          horaInicio: turnoSeleccionado.horaInicio,
          horaFin: turnoSeleccionado.horaFin,
        }
      );

      setModalConfirmacionOpen(false);
      setTurnoSeleccionado(null);

      addToast({
        type: 'success',
        title: '¡Reserva creada exitosamente!',
        message: `Turno reservado para ${canchaSeleccionada.nombre} (${fechaSeleccionada} ${turnoSeleccionado.textoTurno}). Estado: PENDIENTE_PAGO.`,
      });

      // Refrescar disponibilidad
      await cargarDisponibilidad();

      if (onReservaExitosa) {
        onReservaExitosa(nuevaReserva);
      } else if (onVerMisReservas) {
        onVerMisReservas();
      }
    } catch (err: unknown) {
      const mensaje =
        err instanceof Error
          ? err.message
          : 'El horario seleccionado ya fue tomado por otro usuario.';

      const isConflict =
        (err instanceof AppError && err.status === 409) ||
        (err instanceof Error &&
          (err.message.includes('409') ||
            err.message.toLowerCase().includes('ya fue tomado') ||
            err.message.toLowerCase().includes('conflicto') ||
            err.message.toLowerCase().includes('ocupado')));

      // httpClient ya mostró el mensaje del backend: no se duplica el toast
      const yaAvisado = err instanceof AppError;

      if (isConflict) {
        setErrorConflicto(mensaje);
        setModalConfirmacionOpen(false);

        if (!yaAvisado) {
          addToast({
            type: 'error',
            title: 'Horario no disponible (409)',
            message: mensaje,
          });
        }

        // Si el horario ya fue tomado (409), se muestra el mensaje y se refresca la grilla
        await cargarDisponibilidad();
        setTurnoSeleccionado(null);
      } else if (!yaAvisado) {
        addToast({
          type: 'error',
          title: 'Error al reservar',
          message: mensaje,
        });
      }
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Encabezado y Selector de Perfil Socio / Externo */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-fitzone-coral tracking-wider block">
            RESERVA DE CANCHAS DEPORTIVAS
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-fitzone-navy font-outfit mt-0.5">
            {esSocio ? 'Reservá con tu beneficio de socio' : 'Reservá tu turno como cliente externo'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {esSocio
              ? 'Con la membresía vigente, el descuento de socio se aplica al cotizar el turno.'
              : 'Tarifa general para público sin membresía activa.'}
          </p>
        </div>

        {/* Acceso a Mis Reservas */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {onVerMisReservas && (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={onVerMisReservas}
            >
              Mis Reservas
            </Button>
          )}
      </div>
    </div>

      {!puedeReservar && (
        <Alert
          type="info"
          title={usuario ? 'Las reservas son para socios y clientes' : 'Iniciá sesión para reservar'}
          message={
            usuario
              ? 'Con tu rol podés consultar la disponibilidad, pero el turno se reserva desde la cuenta del socio o cliente.'
              : 'Podés ver turnos y precios sin sesión. Para confirmar un turno, iniciá sesión con tu cuenta.'
          }
        />
      )}

      {/* Alerta de Conflicto 409 si ocurrió */}
      {errorConflicto && (
        <Alert
          type="error"
          title="Conflicto de horario (409)"
          message={errorConflicto}
          action={
            <Button
              size="xs"
              variant="outline"
              leftIcon={RefreshCw}
              onClick={() => void cargarDisponibilidad()}
            >
              Refrescar grilla
            </Button>
          }
        />
      )}

      {/* PASO 1: Elegir Cancha */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-fitzone-navy text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-base font-black text-fitzone-navy font-outfit">
              Elegí tu cancha ({sedeActiva?.nombre ?? 'Sede'})
            </h3>
          </div>

          {/* Filtro por Deporte */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {['TODOS', ...tiposDisponibles].map((tipo) => {
              const label = tipo === 'TODOS' ? 'Todas' : etiquetaTipo(tipo);
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filtroTipo === tipo
                      ? 'bg-fitzone-navy text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Listado de Canchas */}
        {loadingCanchas ? (
          <div className="text-center py-8 text-xs text-slate-500 font-semibold">
            Cargando canchas de la sede...
          </div>
        ) : canchasFiltradas.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
            No hay canchas registradas para el filtro seleccionado en esta sede.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {canchasFiltradas.map((cancha) => (
              <CanchaCard
                key={cancha.idCancha}
                cancha={cancha}
                showAdminControls={false}
                selected={canchaSeleccionada?.idCancha === cancha.idCancha}
                onSelect={handleSelectCancha}
              />
            ))}
          </div>
        )}
      </div>

      {/* PASO 2: Elegir Fecha */}
      {canchaSeleccionada && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-fitzone-navy text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-base font-black text-fitzone-navy font-outfit">
              Elegí la fecha
            </h3>
          </div>

          <SelectorFecha
            fechaSeleccionada={fechaSeleccionada}
            onFechaChange={(nuevaFecha) => {
              setFechaSeleccionada(nuevaFecha);
              setTurnoSeleccionado(null);
            }}
            fechaMinima={hoyIso}
          />
        </div>
      )}

      {/* PASO 3: Elegir Turno (Grilla de Disponibilidad) */}
      {canchaSeleccionada && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-fitzone-navy text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-base font-black text-fitzone-navy font-outfit">
                Seleccioná el turno en {canchaSeleccionada.nombre}
              </h3>
            </div>

            <Button
              size="xs"
              variant="ghost"
              leftIcon={RefreshCw}
              onClick={() => void cargarDisponibilidad()}
              disabled={loadingFranjas}
            >
              Refrescar horarios
            </Button>
          </div>

          <GrillaDisponibilidad
            franjas={franjas}
            cancha={canchaSeleccionada}
            fecha={fechaSeleccionada}
            turnoSeleccionado={turnoSeleccionado}
            onSeleccionarTurno={handleSelectTurno}
            loading={loadingFranjas}
          />
        </div>
      )}

      {/* PASO 4: Resumen de Selección y Barra de Confirmación */}
      {canchaSeleccionada && turnoSeleccionado && cotizacion && (
        <div className="p-6 rounded-3xl bg-fitzone-navy text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 animate-slide-up">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-fitzone-coral tracking-wider block">
              TU TURNO SELECCIONADO
            </span>
            <h4 className="text-xl font-black font-outfit">
              {canchaSeleccionada.nombre}
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-fitzone-coral" />
                {fechaSeleccionada}
              </span>
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-fitzone-coral" />
                {turnoSeleccionado.textoTurno}
              </span>
              <span>· {canchaSeleccionada.sede?.nombre}</span>
              {turnoSeleccionado.esPico && (
                <span className="bg-fitzone-coral/20 text-fitzone-coral px-2 py-0.5 rounded-md text-[10px] font-bold">
                  Horario pico (+20%)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">
                Total a pagar
              </span>
              <div className="flex items-baseline gap-2 justify-end">
                {esSocio && cotizacion.descuentoSocio > 0 && (
                  <span className="text-xs font-bold text-slate-400 line-through">
                    ${(cotizacion.precioBase + cotizacion.recargoPico).toLocaleString('es-AR')}
                  </span>
                )}
                <span className="text-2xl font-black text-[#F0B429] font-outfit">
                  ${cotizacion.total.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="coral"
              size="lg"
              isLoading={loadingCotizacion}
              disabled={!puedeReservar}
              onClick={handleAbrirConfirmacion}
              className="w-full sm:w-auto shadow-md"
            >
              Confirmar turno
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Confirmación y Desglose de Pago */}
      <Modal
        isOpen={modalConfirmacionOpen}
        onClose={() => {
          if (!confirmando) setModalConfirmacionOpen(false);
        }}
        size="md"
        title="Confirmar reserva de cancha"
        subtitle="Verificá los detalles y el precio final antes de continuar"
      >
        <div className="space-y-4">
          {/* Ficha Resumen del Turno */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-fitzone-coral">
                {canchaSeleccionada?.tipo ?? 'Deporte'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {canchaSeleccionada?.sede?.nombre}
              </span>
            </div>
            <h4 className="text-base font-black text-fitzone-navy font-outfit">
              {canchaSeleccionada?.nombre}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-fitzone-navy" />
                <span className="font-bold">{fechaSeleccionada}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-fitzone-coral" />
                <span className="font-bold">{turnoSeleccionado?.textoTurno}</span>
              </div>
            </div>
          </div>

          {/* Desglose de Precio */}
          {cotizacion && (
            <DesglosePrecio
              cotizacion={cotizacion}
              titulo="Detalle del precio"
              variant="card"
              mostrarExplicacion={true}
            />
          )}


          {/* Acciones */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setModalConfirmacionOpen(false)}
              disabled={confirmando}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant="coral"
              fullWidth
              isLoading={confirmando}
              onClick={handleConfirmarReserva}
            >
              Confirmar reserva
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
