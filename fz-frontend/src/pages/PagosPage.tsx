import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  LayoutList,
  Table as TableIcon,
  CheckCircle2,
} from 'lucide-react';
import {
  DataTable,
  Spinner,
  Alert,
  StatusBadge,
  Button,
} from '../components/ui';
import type { Column } from '../components/ui';
import {
  ResumenPago,
  ResultadoPago,
  PagoItem,
  BotonDescargaPdf,
} from '../components/pagos';
import {
  listarPagos,
  procesarPago,
  reintentarPago,
  obtenerComprobantePorTransaccion,
  descargarComprobantePdf,
  descargarBlobEnNavegador,
} from '../services/pagosService';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import type {
  TransaccionDTO,
  ComprobanteDTO,
  DetalleItemPago,
  ProcesarPagoPayload,
  ResultadoPagoDTO,
} from '../types';
import { formatearFechaHora, formatearMonto } from '../utils/formatters';

interface ItemCobroDemo {
  id: string;
  detalle: DetalleItemPago;
  monto: number;
  concepto: 'RESERVA_SOCIO' | 'MEMBRESIA_SOCIO';
  idReservaCancha?: number;
  idMembresia?: number;
}

const ITEMS_COBRO_DEMO: ItemCobroDemo[] = [
  {
    id: 'cancha-padel-1',
    monto: 6800,
    concepto: 'RESERVA_SOCIO',
    idReservaCancha: 101,
    detalle: {
      tipo: 'CANCHA',
      titulo: 'Pádel · Cancha 1 — Horario Pico',
      subtitulo: 'Sede FitZone Palermo',
      canchaNombre: 'Cancha 1 (Pádel Cristal)',
      deporte: 'Padel',
      fecha: '20/10/2026',
      horario: '19:00 a 20:00 hs',
      cotizacion: {
        precioBase: 6667,
        esPico: true,
        recargoPico: 1333,
        porcentajeRecargoPico: 20,
        descuentoSocio: 1200,
        porcentajeDescuentoSocio: 15,
        esSocio: true,
        total: 6800,
      },
    },
  },
  {
    id: 'membresia-trimestral',
    monto: 38000,
    concepto: 'MEMBRESIA_SOCIO',
    idMembresia: 201,
    detalle: {
      tipo: 'MEMBRESIA',
      titulo: 'Renovación Membresía · Plan Trimestral',
      subtitulo: 'Acceso Total Multi-Sede',
      planNombre: 'Plan Trimestral FitZone',
      duracionMeses: 3,
      fechaInicio: '01/11/2026',
      fechaVencimiento: '31/01/2027',
    },
  },
  {
    id: 'cancha-futbol-5',
    monto: 13600,
    concepto: 'RESERVA_SOCIO',
    idReservaCancha: 102,
    detalle: {
      tipo: 'CANCHA',
      titulo: 'Fútbol 5 · Cancha Techada',
      subtitulo: 'Sede FitZone Belgrano',
      canchaNombre: 'Cancha Central Sintética',
      deporte: 'Futbol 5',
      fecha: '22/10/2026',
      horario: '21:00 a 22:00 hs',
      cotizacion: {
        precioBase: 16000,
        esPico: false,
        recargoPico: 0,
        porcentajeRecargoPico: 0,
        descuentoSocio: 2400,
        porcentajeDescuentoSocio: 15,
        esSocio: true,
        total: 13600,
      },
    },
  },
];

export function PagosPage() {
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  // Control de pestañas principales: 'checkout' o 'historial'
  const [activeTab, setActiveTab] = useState<'checkout' | 'historial'>('checkout');

  // Estado del flujo de checkout
  const [selectedDemoItem, setSelectedDemoItem] = useState<ItemCobroDemo>(ITEMS_COBRO_DEMO[0]!);
  const [checkoutStep, setCheckoutStep] = useState<'formulario' | 'resultado'>('formulario');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultadoPago, setResultadoPago] = useState<ResultadoPagoDTO | null>(null);

  // Estado del listado de transacciones
  const [transacciones, setTransacciones] = useState<TransaccionDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'CONFIRMADO' | 'PENDIENTE' | 'RECHAZADO'>('TODOS');
  const [vistaModo, setVistaModo] = useState<'tarjetas' | 'tabla'>('tarjetas');
  const [comprobantesMap, setComprobantesMap] = useState<Record<number, ComprobanteDTO>>({});

  // Carga de transacciones por sede
  const cargarTransacciones = async () => {
    if (!sedeActiva) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listarPagos(sedeActiva.idSede);
      setTransacciones(data);

      // Precargamos comprobantes para las confirmadas
      const confirmadas = data.filter((t) => t.estadoPago === 'CONFIRMADO');
      const comps: Record<number, ComprobanteDTO> = {};
      await Promise.all(
        confirmadas.map(async (t) => {
          const comp = await obtenerComprobantePorTransaccion(t.idTransaccion);
          if (comp) comps[t.idTransaccion] = comp;
        })
      );
      setComprobantesMap(comps);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarTransacciones();
  }, [sedeActiva]);

  // Manejo de confirmación de pago en checkout
  const handleConfirmarPago = async (tokenPasarela: string) => {
    if (!sedeActiva) return;
    setIsProcessing(true);
    try {
      const payload: ProcesarPagoPayload = {
        idSede: sedeActiva.idSede,
        idUsuario: 1, // Lucas Martínez (Socio)
        concepto: selectedDemoItem.concepto,
        monto: selectedDemoItem.monto,
        tokenTransaccionPasarela: tokenPasarela,
        idReservaCancha: selectedDemoItem.idReservaCancha,
        idMembresia: selectedDemoItem.idMembresia,
        tipoComprobante: 'FACTURA_B',
        detalleItem: selectedDemoItem.detalle,
      };

      const res = await procesarPago(payload);
      setResultadoPago(res);
      setCheckoutStep('resultado');

      if (res.aprobado) {
        addToast({
          type: 'success',
          title: 'Pago Acreditado',
          message: 'La transacción fue aprobada y se emitió la factura.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Pago Rechazado',
          message: 'La pasarela denegó la operación. Podés reintentarla con un solo clic.',
        });
      }

      // Refrescamos el historial en segundo plano
      void cargarTransacciones();
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error de Procesamiento',
        message: err instanceof Error ? err.message : 'No se pudo comunicar con la pasarela.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Reintento de pago (Resuelve BUG-03)
  const handleReintentarPago = async (transaccionId?: number) => {
    const idToRetry = transaccionId ?? resultadoPago?.transaccion.idTransaccion;
    if (!idToRetry) return;

    setIsProcessing(true);
    try {
      const res = await reintentarPago(idToRetry, 'tok_mock_aprobado');
      setResultadoPago(res);
      setCheckoutStep('resultado');

      addToast({
        type: 'success',
        title: 'Reintento Exitoso',
        message: `Se confirmó el cobro original de ${formatearMonto(res.transaccion.monto)} sin alteraciones.`,
      });

      void cargarTransacciones();
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Fallo al Reintentar',
        message: err instanceof Error ? err.message : 'No se pudo reintentar el pago.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Descarga de comprobante PDF
  const handleDescargarPdf = async (transaccion: TransaccionDTO) => {
    try {
      const comp = comprobantesMap[transaccion.idTransaccion];
      const idComp = comp?.idComprobante || transaccion.idTransaccion;
      const numFactura = comp?.numeroFactura || `FAC-0001-${transaccion.idTransaccion}`;

      const blob = await descargarComprobantePdf(idComp);
      descargarBlobEnNavegador(blob, `comprobante-${numFactura}.pdf`);

      addToast({
        type: 'info',
        title: 'Descarga Iniciada',
        message: `Descargando comprobante ${numFactura} en PDF.`,
      });
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error de Descarga',
        message: err instanceof Error ? err.message : 'No se pudo generar el archivo PDF.',
      });
    }
  };

  // Métricas financieras calculadas
  const metricas = useMemo(() => {
    const confirmadas = transacciones.filter((t) => t.estadoPago === 'CONFIRMADO');
    const totalAbonado = confirmadas.reduce((acc, curr) => acc + curr.monto, 0);
    const rechazadas = transacciones.filter((t) => t.estadoPago === 'RECHAZADO').length;
    const comprobantesEmitidos = Object.keys(comprobantesMap).length || confirmadas.length;

    return { totalAbonado, rechazadas, comprobantesEmitidos };
  }, [transacciones, comprobantesMap]);

  // Transacciones filtradas para el historial
  const transaccionesFiltradas = useMemo(() => {
    if (filtroEstado === 'TODOS') return transacciones;
    return transacciones.filter((t) => t.estadoPago === filtroEstado);
  }, [transacciones, filtroEstado]);

  // Columnas para DataTable
  const COLUMNS: Column<TransaccionDTO>[] = [
    { key: 'idTransaccion', header: 'ID', width: 70, align: 'center' },
    {
      header: 'Concepto / Ítem',
      render: (row) => (
        <div>
          <span className="font-extrabold text-fitzone-navy block">
            {row.descripcion || row.concepto.replace(/_/g, ' ')}
          </span>
          <span className="text-[11px] text-slate-400">
            {row.usuario.nombre} {row.usuario.apellido} (DNI {row.usuario.dni})
          </span>
        </div>
      ),
    },
    {
      header: 'Monto',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-fitzone-navy font-outfit">{formatearMonto(row.monto)}</span>
      ),
    },
    {
      header: 'Estado',
      align: 'center',
      render: (row) => <StatusBadge status={row.estadoPago} size="xs" showDot={true} />,
    },
    {
      header: 'Fecha',
      render: (row) => formatearFechaHora(row.fechaHoraCreacion),
    },
    {
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.estadoPago === 'CONFIRMADO' && (
            <BotonDescargaPdf
              size="xs"
              variant="outline"
              texto="PDF"
              numeroFactura={comprobantesMap[row.idTransaccion]?.numeroFactura || `FAC-${row.idTransaccion}`}
              onDescargar={() => handleDescargarPdf(row)}
            />
          )}
          {row.estadoPago === 'RECHAZADO' && (
            <Button
              size="xs"
              variant="coral"
              onClick={() => handleReintentarPago(row.idTransaccion)}
              className="cursor-pointer font-bold"
            >
              Reintentar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-fitzone-coral tracking-widest block">
            Módulo de Pagos & Facturación (RF-13, RF-14)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-fitzone-navy font-outfit mt-0.5 flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-fitzone-coral" />
            <span>Gestión de Pagos y Comprobantes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Realizá el checkout seguro de tus reservas y membresías, o consultá tu historial oficial con facturas AFIP.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 self-start sm:self-auto border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('checkout')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'checkout'
                ? 'bg-white text-fitzone-navy shadow-xs'
                : 'text-slate-600 hover:text-fitzone-navy'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Checkout / Pagar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'historial'
                ? 'bg-white text-fitzone-navy shadow-xs'
                : 'text-slate-600 hover:text-fitzone-navy'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Historial ({transacciones.length})</span>
          </button>
        </div>
      </div>

      {/* ─── PESTAÑA 1: CHECKOUT / PAGAR ───────────────────────────────────── */}
      {activeTab === 'checkout' && (
        <div className="space-y-6 animate-fade-in">
          {checkoutStep === 'formulario' ? (
            <div className="space-y-6">
              {/* Selector de ítem pendiente de pago */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  1. Seleccioná el ítem que deseás abonar:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {ITEMS_COBRO_DEMO.map((item) => {
                    const isSelected = selectedDemoItem.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedDemoItem(item)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-fitzone-navy bg-fitzone-navy/5 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-fitzone-coral">
                            {item.detalle.tipo === 'CANCHA' ? 'Turno Cancha' : 'Membresía'}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-fitzone-navy" />}
                        </div>
                        <h4 className="font-extrabold text-sm text-fitzone-navy leading-tight">
                          {item.detalle.titulo}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">{item.detalle.subtitulo}</p>
                        <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-baseline">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                          <span className="font-black text-base text-fitzone-navy font-outfit">
                            {formatearMonto(item.monto)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Componente ResumenPago con DesglosePrecio integrado */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  2. Revisá el resumen y confirmá el arancel:
                </span>
                <ResumenPago
                  detalle={selectedDemoItem.detalle}
                  montoTotal={selectedDemoItem.monto}
                  isProcessing={isProcessing}
                  onConfirmarPago={handleConfirmarPago}
                  permitirSimularRechazo={true}
                />
              </div>
            </div>
          ) : (
            // Componente ResultadoPago tras procesar
            resultadoPago && (
              <div className="space-y-4">
                <ResultadoPago
                  transaccion={resultadoPago.transaccion}
                  comprobante={resultadoPago.comprobante}
                  errorMotivo={resultadoPago.mensaje}
                  onReintentar={() => void handleReintentarPago()}
                  onVolver={() => setCheckoutStep('formulario')}
                  onDescargarPdf={() => handleDescargarPdf(resultadoPago.transaccion)}
                />
              </div>
            )
          )}
        </div>
      )}

      {/* ─── PESTAÑA 2: HISTORIAL DE PAGOS Y COMPROBANTES ───────────────────── */}
      {activeTab === 'historial' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tarjetas de Métricas Superiores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Abonado
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-fitzone-navy font-outfit mt-1">
                  {formatearMonto(metricas.totalAbonado)}
                </h3>
                <span className="text-[11px] text-[#2E9E5B] font-bold block mt-0.5">Operaciones acreditadas</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#2E9E5B]/10 text-[#2E9E5B] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Comprobantes AFIP
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-fitzone-navy font-outfit mt-1">
                  {metricas.comprobantesEmitidos}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Facturas electrónicas oficiales</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-fitzone-navy/10 text-fitzone-navy flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Rechazados / A Revisar
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-fitzone-coral font-outfit mt-1">
                  {metricas.rechazadas}
                </h3>
                <span className="text-[11px] text-fitzone-coral font-bold block mt-0.5">Reintentos disponibles</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-fitzone-coral/10 text-fitzone-coral flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Modo de Vista */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              {(['TODOS', 'CONFIRMADO', 'PENDIENTE', 'RECHAZADO'] as const).map((filtro) => (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => setFiltroEstado(filtro)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filtroEstado === filtro
                      ? 'bg-white text-fitzone-navy shadow-xs'
                      : 'text-slate-600 hover:text-fitzone-navy'
                  }`}
                >
                  {filtro === 'TODOS'
                    ? 'Todos'
                    : filtro === 'CONFIRMADO'
                    ? 'Confirmados'
                    : filtro === 'PENDIENTE'
                    ? 'Pendientes'
                    : 'Rechazados'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setVistaModo('tarjetas')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  vistaModo === 'tarjetas' ? 'bg-white text-fitzone-navy shadow-xs' : 'text-slate-500'
                }`}
                title="Vista en Tarjetas (PagoItem)"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setVistaModo('tabla')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  vistaModo === 'tabla' ? 'bg-white text-fitzone-navy shadow-xs' : 'text-slate-500'
                }`}
                title="Vista en Tabla (DataTable)"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && <Alert type="error" title="Error" message={error} />}

          {loading && (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          )}

          {!loading && transaccionesFiltradas.length === 0 && (
            <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200/70 text-slate-500 text-xs">
              No se encontraron pagos con el filtro seleccionado.
            </div>
          )}

          {!loading && transaccionesFiltradas.length > 0 && (
            <>
              {vistaModo === 'tarjetas' ? (
                <div className="space-y-3">
                  {transaccionesFiltradas.map((transaccion) => (
                    <PagoItem
                      key={transaccion.idTransaccion}
                      transaccion={transaccion}
                      comprobante={comprobantesMap[transaccion.idTransaccion]}
                      onReintentar={() => void handleReintentarPago(transaccion.idTransaccion)}
                      onDescargarPdf={() => handleDescargarPdf(transaccion)}
                    />
                  ))}
                </div>
              ) : (
                <DataTable<TransaccionDTO>
                  columns={COLUMNS}
                  data={transaccionesFiltradas}
                  keyExtractor={(row) => row.idTransaccion}
                  emptyTitle="Sin transacciones registradas"
                  emptyMessage="No hay pagos que coincidan con la búsqueda."
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
