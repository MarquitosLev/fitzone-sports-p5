/**
 * AccesoPage.tsx — Control de Acceso, Aforo en Tiempo Real y Pase Digital (SCRUM-82, SCRUM-85, SCRUM-101, RF-04, RF-05).
 *
 * Integra en una sola pantalla:
 *   1. Vista Socio ('mi-qr'): Pase digital móvil con <QrDinamico /> (rotación de token de 60s),
 *      cabecera de membresía (<MembresiaEstadoCard />) y bloqueo crítico si la membresía está inactiva (SCRUM-85).
 *   2. Vista Recepción ('control-aforo'): Control operativo de aforo en tiempo real con polling,
 *      validador de QR con los 4 motivos de rechazo, detalle de resolución y listado de personas
 *      en sede con egreso inmediato (SCRUM-82, RF-04, RF-05, BUG-09).
 *   3. Vista Historial ('historial'): Registro y auditoría de accesos físicos pasados en la sede.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  QrCode,
  ShieldAlert,
  DoorOpen,
  RefreshCw,
  Smartphone,
  ExternalLink,
  ListFilter,
  ShieldCheck,
} from 'lucide-react';
import { Card, Spinner, Alert, Button, DataTable } from '../components/ui';
import type { Column } from '../components/ui';
import { MembresiaEstadoCard } from '../components/membresias';
import {
  QrDinamico,
  AforoIndicador,
  ValidadorIngreso,
  ResultadoValidacion,
  PersonasAdentroList,
} from '../components/acceso';
import {
  obtenerMiQr,
  listarAccesos,
  obtenerAforo,
  listarAccesosActivos,
  validarIngreso,
  registrarEgreso,
} from '../services/accesoService';
import { obtenerMembresiaPorUsuario } from '../services/membresiasService';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTienePrestacion } from '../hooks/usePrestaciones';
import type {
  MembresiaDTO,
  AccesoDTO,
  QrTokenDTO,
  AforoSedeDTO,
  ResultadoValidacionDTO,
} from '../types';
import { formatearFechaHora } from '../utils/formatters';

const COLUMNAS_ACCESOS: Column<AccesoDTO>[] = [
  { key: 'idAcceso', header: 'ID', width: 60, align: 'center' },
  {
    header: 'Usuario',
    render: (row) => `${row.usuario.nombre} ${row.usuario.apellido}`,
  },
  {
    header: 'Ingreso',
    render: (row) => formatearFechaHora(row.fechaHoraIngreso),
  },
  {
    header: 'Egreso',
    render: (row) => (row.fechaHoraEgreso ? formatearFechaHora(row.fechaHoraEgreso) : '— (en sede)'),
  },
];

type VistaAcceso = 'mi-qr' | 'control-aforo' | 'historial';

export function AccesoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sedeActiva, sedes, setSedeActiva } = useSede();
  const { addToast } = useToast();
  const { usuario: usuarioAuth } = useAuth();
  const esSocio = usuarioAuth?.tipoUsuario === 'SOCIO';
  const tienePrestacionAforo = useTienePrestacion('ACCESO_AFORO_VIEW');
  const tienePrestacionEscanear = useTienePrestacion('ACCESO_ESCANEAR');
  const tienePrestacionMiQr = useTienePrestacion('ACCESO_MI_QR');

  const puedeVerAforo = !usuarioAuth || tienePrestacionAforo;
  const puedeEscanear = !usuarioAuth || tienePrestacionEscanear;
  const puedeVerMiQr = !usuarioAuth || tienePrestacionMiQr;

  // Sincronizar la sede activa con la sede asignada del recepcionista/gerente autenticado (SCRUM-96, SCRUM-101)
  useEffect(() => {
    if (
      usuarioAuth?.idSede &&
      (usuarioAuth.tipoUsuario === 'RECEPCIONISTA' || usuarioAuth.tipoUsuario === 'GERENTE') &&
      sedeActiva?.idSede !== usuarioAuth.idSede
    ) {
      const sedeDelOperador = sedes.find((s) => s.idSede === usuarioAuth.idSede);
      if (sedeDelOperador) {
        setSedeActiva(sedeDelOperador);
      }
    }
  }, [usuarioAuth, sedeActiva, sedes, setSedeActiva]);

  // Pestaña activa: 'mi-qr' (Socio), 'control-aforo' (Recepción SCRUM-82), o 'historial'
  // Se basa en prestaciones atómicas (SCRUM-107) y en la ruta actual (/mi-qr vs /acceso).
  const [vistaActiva, setVistaActiva] = useState<VistaAcceso>(() => {
    if (location.pathname.includes('/mi-qr')) {
      return 'mi-qr';
    }
    if (usuarioAuth && (tienePrestacionAforo || !tienePrestacionMiQr)) {
      return 'control-aforo';
    }
    return 'mi-qr';
  });

  // Sincronizar pestaña activa cuando el usuario navega desde el Sidebar entre /mi-qr y /acceso
  useEffect(() => {
    if (location.pathname.includes('/mi-qr') && puedeVerMiQr) {
      setVistaActiva('mi-qr');
    } else if (
      location.pathname.includes('/acceso') &&
      usuarioAuth &&
      (tienePrestacionAforo || !tienePrestacionMiQr)
    ) {
      setVistaActiva('control-aforo');
    }
  }, [location.pathname, usuarioAuth, puedeVerMiQr, tienePrestacionAforo, tienePrestacionMiQr]);

  // ── Estado Vista 1: Pase QR Socio (SCRUM-85) ────────────────────────────────
  // El pase es personal: solo lo ve el socio logueado
  const socioQr = esSocio ? usuarioAuth : null;
  const [membresia, setMembresia] = useState<MembresiaDTO | null>(null);
  const [cargandoMembresia, setCargandoMembresia] = useState<boolean>(true);

  const [qrTokenData, setQrTokenData] = useState<QrTokenDTO | null>(null);
  const [cargandoQr, setCargandoQr] = useState<boolean>(false);
  const [errorQr, setErrorQr] = useState<string | null>(null);

  // ── Estado Vista 2: Control Operativo y Aforo (SCRUM-82) ────────────────────
  const [aforo, setAforo] = useState<AforoSedeDTO | null>(null);
  const [accesosActivos, setAccesosActivos] = useState<AccesoDTO[]>([]);
  const [loadingAforo, setLoadingAforo] = useState(false);
  const [loadingAccesos, setLoadingAccesos] = useState(false);
  const [validando, setValidando] = useState(false);
  const [egresoLoadingId, setEgresoLoadingId] = useState<number | null>(null);
  const [errorOperativo, setErrorOperativo] = useState<string | null>(null);
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacionDTO | null>(null);

  // ── Estado Vista 3: Historial de Accesos ─────────────────────────────────────
  const [accesosSede, setAccesosSede] = useState<AccesoDTO[]>([]);
  const [cargandoAccesos, setCargandoAccesos] = useState<boolean>(false);

  // ── Lógica Socio: Solicitar Token QR Dinámico (SCRUM-96, SCRUM-101) ──────────
  const solicitarNuevoToken = useCallback(
    async (idUsuario: number) => {
      if (!socioQr || socioQr.idUsuario !== idUsuario) return;
      setCargandoQr(true);
      setErrorQr(null);
      try {
        // El socio pide su propio QR: GET /v1/usuarios/me/qr
        setQrTokenData(await obtenerMiQr(idUsuario));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'No se pudo generar el token de acceso.';
        setErrorQr(msg);
        addToast({
          type: 'error',
          title: 'Error de token',
          message: msg,
        });
      } finally {
        setCargandoQr(false);
      }
    },
    [addToast, socioQr]
  );

  // Efecto cuando cambia el socio seleccionado (solo cuando la vista 'mi-qr' está activa)
  useEffect(() => {
    if (vistaActiva !== 'mi-qr' || !puedeVerMiQr || !socioQr) {
      return;
    }

    let cancelado = false;

    const cargar = async () => {
      setCargandoMembresia(true);
      setQrTokenData(null);
      setErrorQr(null);
      try {
        const m = await obtenerMembresiaPorUsuario(socioQr.idUsuario);
        if (cancelado) return;
        setMembresia(m);

        // REGLA DE NEGOCIO: Solo si la membresía está ACTIVA solicitamos el token QR
        if (m && m.estado === 'ACTIVO') {
          void solicitarNuevoToken(socioQr.idUsuario);
        }
      } catch (err: unknown) {
        if (cancelado) return;
        const msg = err instanceof Error ? err.message : 'Error al consultar membresía del socio.';
        setMembresia(null);
        addToast({
          type: 'error',
          title: 'Error de membresía',
          message: msg,
        });
      } finally {
        if (!cancelado) {
          setCargandoMembresia(false);
        }
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [vistaActiva, puedeVerMiQr, socioQr, solicitarNuevoToken, addToast]);

  // ── Lógica Recepción: Cargar Aforo en tiempo real ─────────────────────────────
  const cargarAforo = useCallback(async () => {
    if (!sedeActiva || !puedeVerAforo) return;
    try {
      const datosAforo = await obtenerAforo(sedeActiva.idSede);
      setAforo(datosAforo);
    } catch (err: unknown) {
      console.error('Error al actualizar aforo:', err);
    }
  }, [sedeActiva, puedeVerAforo]);

  // ── Lógica Recepción: Cargar Accesos Activos de la sede ────────────────────────
  const cargarAccesosActivos = useCallback(async () => {
    if (!sedeActiva || !puedeVerAforo) return;
    setLoadingAccesos(true);
    try {
      const activos = await listarAccesosActivos(sedeActiva.idSede);
      setAccesosActivos(activos);
    } catch (err: unknown) {
      setErrorOperativo(err instanceof Error ? err.message : 'Error al cargar personas en sede');
    } finally {
      setLoadingAccesos(false);
    }
  }, [sedeActiva, puedeVerAforo]);

  // Al montar o cambiar de sede, se actualizan los datos de recepción (solo si tiene permiso ACCESO_AFORO_VIEW)
  useEffect(() => {
    setResultadoValidacion(null);
    setErrorOperativo(null);

    if (sedeActiva && puedeVerAforo) {
      setLoadingAforo(true);
      void Promise.all([cargarAforo(), cargarAccesosActivos()]).finally(() => {
        setLoadingAforo(false);
      });
    }
  }, [sedeActiva, puedeVerAforo, cargarAforo, cargarAccesosActivos]);

  // ── Lógica Recepción: Historial de accesos ────────────────────────────────────
  useEffect(() => {
    if (vistaActiva !== 'historial' || !sedeActiva || !puedeVerAforo) return;

    let cancelado = false;
    const cargar = async () => {
      setCargandoAccesos(true);
      try {
        const registros = await listarAccesos(sedeActiva.idSede);
        if (!cancelado) setAccesosSede(registros);
      } catch {
        // Silencioso
      } finally {
        if (!cancelado) setCargandoAccesos(false);
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [vistaActiva, sedeActiva, puedeVerAforo]);

  // ── Lógica Recepción: Validación de Ingreso ──────────────────────────────────
  const handleValidarIngreso = async (token: string) => {
    if (!sedeActiva) {
      addToast({
        type: 'warning',
        title: 'Sede requerida',
        message: 'Seleccioná una sede activa antes de validar un acceso.',
      });
      return;
    }

    setValidando(true);
    try {
      // Si el operador tiene sede asignada, el backend la toma de la sesión y no se envía idSede
      const omitirIdSedeEnBody = Boolean(usuarioAuth?.idSede);
      const res = await validarIngreso({
        token,
        ...(omitirIdSedeEnBody ? {} : { idSede: sedeActiva.idSede }),
      });

      setResultadoValidacion(res);

      if (res.aprobado) {
        addToast({
          type: 'success',
          title: 'Acceso Permitido',
          message: res.mensaje || 'Molinete habilitado.',
        });
        // Refrescar lista de adentro y aforo
        void Promise.all([cargarAforo(), cargarAccesosActivos()]);
      } else {
        addToast({
          type: 'error',
          title: 'Acceso Denegado',
          message: res.mensaje || `Motivo: ${res.motivoRechazo}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fallo en la comunicación con el molinete';
      setErrorOperativo(msg);
      addToast({
        type: 'error',
        title: 'Error de validación',
        message: msg,
      });
    } finally {
      setValidando(false);
    }
  };

  // ── Lógica Recepción: Registro de Egreso ─────────────────────────────────────
  const handleRegistrarEgreso = async (idAcceso: number) => {
    setEgresoLoadingId(idAcceso);
    try {
      const egresado = await registrarEgreso(idAcceso);
      addToast({
        type: 'info',
        title: 'Egreso registrado',
        message: `Salida registrada para ${egresado.usuario.nombre} ${egresado.usuario.apellido}. Aforo liberado.`,
      });

      // Refrescar indicadores
      await Promise.all([cargarAforo(), cargarAccesosActivos()]);
    } catch (err: unknown) {
      addToast({
        type: 'error',
        title: 'Error al registrar egreso',
        message: err instanceof Error ? err.message : 'No se pudo procesar la salida.',
      });
    } finally {
      setEgresoLoadingId(null);
    }
  };

  const handleRenovar = () => {
    navigate('/pagos?item=membresia');
  };

  const tieneAccesoHabilitado = membresia !== null && membresia.estado === 'ACTIVO';

  const obtenerMotivoBloqueo = () => {
    if (!membresia) {
      return {
        titulo: 'Acceso Denegado · Sin Membresía Registrada',
        mensaje:
          'No poseés un plan de membresía activo asignado. Para ingresar a las instalaciones debés suscribirte a un plan.',
        tipo: 'warning' as const,
      };
    }

    switch (membresia.estado) {
      case 'VENCIDO':
        return {
          titulo: 'Ingreso Bloqueado · Membresía Vencida',
          mensaje:
            'Tu membresía ha caducado. El molinete denegará tu acceso físico hasta que regularices el pago o renovación de tu cuota.',
          tipo: 'error' as const,
        };
      case 'SUSPENDIDO':
        return {
          titulo: 'Ingreso Inhabilitado · Membresía Suspendida',
          mensaje:
            'Tu membresía se encuentra pausada temporalmente. Acercate a la recepción o contactá al personal para reactivar tu ingreso.',
          tipo: 'warning' as const,
        };
      case 'CANCELADO':
        return {
          titulo: 'Acceso No Autorizado · Membresía Cancelada',
          mensaje:
            'Tu plan fue dado de baja definitiva. Es necesario dar de alta una nueva membresía para ingresar nuevamente al club.',
          tipo: 'error' as const,
        };
      default:
        return {
          titulo: 'Ingreso No Permitido',
          mensaje: 'Tu membresía no se encuentra en estado activo.',
        tipo: 'warning' as const,
        };
    }
  };

  const motivoBloqueo = obtenerMotivoBloqueo();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* ── Cabecera Superior y Switcher de Vistas ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-fitzone-navy text-fitzone-coral flex items-center justify-center shrink-0 shadow-xs">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-fitzone-navy font-outfit">
              Pase Digital de Acceso
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Control de acceso físico, aforo en tiempo real y pase QR para socios
            </p>
          </div>
        </div>

        {/* Switcher de vistas */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto flex-wrap">
          {puedeVerMiQr && (
            <button
              type="button"
              onClick={() => setVistaActiva('mi-qr')}
              data-testid="tab-mi-qr"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                vistaActiva === 'mi-qr'
                  ? 'bg-white text-fitzone-navy shadow-xs'
                  : 'text-slate-500 hover:text-fitzone-navy'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mi QR (Socio)</span>
            </button>
          )}
          {puedeVerAforo && (
            <>
              <button
                type="button"
                onClick={() => setVistaActiva('control-aforo')}
                data-testid="tab-control-aforo"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vistaActiva === 'control-aforo'
                    ? 'bg-white text-fitzone-navy shadow-xs'
                    : 'text-slate-500 hover:text-fitzone-navy'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-fitzone-coral" />
                <span>Control y Aforo (Recepción)</span>
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva('historial')}
                data-testid="tab-historial"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vistaActiva === 'historial'
                    ? 'bg-white text-fitzone-navy shadow-xs'
                    : 'text-slate-500 hover:text-fitzone-navy'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Molinete Recepción</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── VISTA 1: MI CÓDIGO QR (SOCIO - SCRUM-85) ─────────────────────────── */}
      {vistaActiva === 'mi-qr' && puedeVerMiQr && !socioQr && (
        <Alert
          type="info"
          title="Pase personal"
          message="El pase QR lo ve cada socio desde su cuenta."
        />
      )}

      {vistaActiva === 'mi-qr' && puedeVerMiQr && socioQr && (
        <div className="space-y-6">
          {/* Contenedor principal responsive y centrado optimizado para mobile */}
          <div className="max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
            {/* 1. Componente de Estado de Membresía en la parte superior */}
            {cargandoMembresia ? (
              <Card className="p-8 flex items-center justify-center rounded-3xl">
                <Spinner size="md" />
              </Card>
            ) : (
              <div data-testid="seccion-membresia-card">
                <MembresiaEstadoCard
                  membresia={membresia}
                  socio={socioQr}
                  onRenovarClick={handleRenovar}
                />
              </div>
            )}

            {/* 2. REGLA DE NEGOCIO CRÍTICA:
                Si la membresía está ACTIVA: se muestra el código QR dinámico.
                Si NO está activa (VENCIDO, SUSPENDIDO, CANCELADO, etc.):
                NO se muestra el QR y en su lugar se exhibe un banner informando el motivo. */}
            {!cargandoMembresia && (
              <>
                {tieneAccesoHabilitado ? (
                  <div data-testid="seccion-qr-activo" className="space-y-4">
                    <QrDinamico
                      token={qrTokenData?.token || ''}
                      duracionSegundos={qrTokenData?.expiraEnSegundos || 60}
                      cargando={cargandoQr}
                      error={errorQr}
                      onSolicitarNuevoToken={() => solicitarNuevoToken(socioQr.idUsuario)}
                    />

                    {/* Instrucciones de uso en el molinete */}
                    <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-bold text-fitzone-navy">
                        Instrucciones de paso por molinete
                      </p>
                      <p>
                        Alineá la pantalla de tu celular a 15 cm del lector óptico con el brillo al
                        máximo.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Válido exclusivamente para la sede activa: {sedeActiva?.nombre || 'FitZone'}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    data-testid="seccion-qr-bloqueado"
                    className="space-y-4 animate-in fade-in duration-200"
                  >
                    {/* Banner explicativo del motivo por el cual no puede ingresar */}
                    <Alert
                      type={motivoBloqueo.tipo}
                      title={motivoBloqueo.titulo}
                      message={motivoBloqueo.mensaje}
                      action={
                        <Button
                          variant="coral"
                          size="xs"
                          onClick={handleRenovar}
                          leftIcon={RefreshCw}
                        >
                          Regularizar membresía
                        </Button>
                      }
                    />

                    {/* Tarjeta ilustrativa de bloqueo de QR */}
                    <Card
                      variant="flat"
                      className="p-8 text-center bg-rose-50/50 border border-rose-100 rounded-3xl space-y-3"
                    >
                      <div className="w-16 h-16 rounded-full bg-rose-100 text-fitzone-coral flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-black text-fitzone-navy font-outfit">
                        Código QR Inhabilitado
                      </h3>
                      <p className="text-xs text-slate-600 max-w-xs mx-auto">
                        Por motivos de seguridad, el código de ingreso no se generará hasta que tu
                        membresía vuelva a estar en estado{' '}
                        <span className="font-bold text-emerald-700">ACTIVO</span>.
                      </p>
                      <div className="pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleRenovar}
                          rightIcon={ExternalLink}
                        >
                          Ir a Pagos
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── VISTA 2: CONTROL DE ACCESO Y AFORO EN VIVO (RECEPCIÓN - SCRUM-82) ── */}
      {vistaActiva === 'control-aforo' && puedeVerAforo && (
        <div className="space-y-6">
          {/* Header Operativo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  RECEPCIÓN Y MOSTRADOR
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-fitzone-navy font-outfit mt-1 flex items-center gap-2.5">
                <DoorOpen className="w-6 h-6 text-fitzone-coral" />
                <span>Control de Acceso y Aforo en Tiempo Real</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {sedeActiva ? (
                  <>Operando en <strong>{sedeActiva.nombre}</strong> · Capacidad máxima autorizada: <strong>{sedeActiva.aforoMaximo}</strong></>
                ) : (
                  'Ninguna sede seleccionada'
                )}
              </p>
            </div>
          </div>

          {/* Alerta de error operativo si existe */}
          {errorOperativo && (
            <Alert
              type="error"
              title="Fallo en la operación"
              message={errorOperativo}
              onClose={() => setErrorOperativo(null)}
            />
          )}

          {/* Layout en Dos Columnas Operativas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda: Aforo en Tiempo Real + Validador de Pase (5 columnas en LG) */}
            <div className="lg:col-span-5 space-y-6">
              <AforoIndicador
                aforo={aforo}
                loading={loadingAforo}
                onRefresh={cargarAforo}
                pollingIntervalMs={10000}
                nombreSede={sedeActiva?.nombre}
              />

              {puedeEscanear && (
                <ValidadorIngreso
                  onValidar={handleValidarIngreso}
                  loading={validando}
                  disabled={!sedeActiva}
                />
              )}
            </div>

            {/* Columna Derecha: Resultado de Validación + Personas Adentro (7 columnas en LG) */}
            <div className="lg:col-span-7 space-y-6">
              <ResultadoValidacion
                resultado={resultadoValidacion}
                onLimpiar={() => setResultadoValidacion(null)}
              />

              <PersonasAdentroList
                accesos={accesosActivos}
                loading={loadingAccesos}
                onRegistrarEgreso={handleRegistrarEgreso}
                egresoLoadingId={egresoLoadingId}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── VISTA 3: HISTORIAL DE ENTRADAS / MOLINETE RECEPCIÓN ──────────────── */}
      {vistaActiva === 'historial' && puedeVerAforo && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DoorOpen className="w-5 h-5 text-fitzone-coral" />
              <h2 className="text-xl font-black text-fitzone-navy font-outfit">
                Molinete de Acceso Físico · {sedeActiva?.nombre}
              </h2>
            </div>
          </div>

          {cargandoAccesos ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <DataTable<AccesoDTO>
              columns={COLUMNAS_ACCESOS}
              data={accesosSede}
              keyExtractor={(row) => row.idAcceso}
              emptyTitle="Sin registros de acceso físico"
              emptyMessage="No hay ingresos ni egresos registrados recientemente para esta sede."
            />
          )}
        </div>
      )}
    </div>
  );
}
