/**
 * AccesoPage.tsx — Control de Acceso, Aforo en Tiempo Real y Pase Digital (SCRUM-82, SCRUM-85, RF-04, RF-05).
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
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  ShieldAlert,
  DoorOpen,
  RefreshCw,
  UserCheck,
  Smartphone,
  ExternalLink,
  ListFilter,
  ShieldCheck,
  Sparkles,
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
  obtenerQrSocio,
  listarAccesos,
  obtenerAforo,
  listarAccesosActivos,
  validarIngreso,
  registrarEgreso,
} from '../services/accesoService';
import { obtenerMembresiaPorUsuario } from '../services/membresiasService';
import { httpClient } from '../services/httpClient';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { USE_MOCK } from '../config';
import type {
  MembresiaDTO,
  UsuarioDTO,
  AccesoDTO,
  QrTokenDTO,
  AforoSedeDTO,
  ResultadoValidacionDTO,
} from '../types';
import { formatearFechaHora } from '../utils/formatters';

function useOptionalUsuarioAuth(): UsuarioDTO | null {
  try {
    return useAuth().usuario;
  } catch {
    return null;
  }
}

// Lista de socios para selección rápida en modo socio/demostración
const SOCIOS_EJEMPLO: UsuarioDTO[] = [
  {
    idUsuario: 2,
    authId: 'uuid-socio-2',
    dni: '28456789',
    nombre: 'Valentina',
    apellido: 'García',
    email: 'vgarcia@email.com',
    telefono: '11-5432-1098',
    fotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  {
    idUsuario: 6,
    authId: 'uuid-socio-3',
    dni: '32845761',
    nombre: 'Mateo',
    apellido: 'Fernández',
    email: 'mateo.f@email.com',
    telefono: '11-8765-4321',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  {
    idUsuario: 1,
    authId: 'uuid-socio-1',
    dni: '30123456',
    nombre: 'Lucas',
    apellido: 'Martínez',
    email: 'lucas.martinez@email.com',
    telefono: '11-4567-8901',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  {
    idUsuario: 7,
    authId: null,
    dni: '39123890',
    nombre: 'Camila',
    apellido: 'Torres',
    email: 'camila.torres@email.com',
    telefono: '11-1234-5678',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  {
    idUsuario: 3,
    authId: null,
    dni: '35789012',
    nombre: 'Martín',
    apellido: 'López',
    email: 'mlopez@email.com',
    telefono: '11-6789-0123',
    fotoUrl: null,
    tipoUsuario: 'EXTERNO',
    idSede: 1,
  },
];

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
  const { sedeActiva } = useSede();
  const { addToast } = useToast();
  const usuarioAuth = useOptionalUsuarioAuth();
  const esSocio = usuarioAuth?.tipoUsuario === 'SOCIO';
  const esPersonal =
    !usuarioAuth ||
    usuarioAuth.tipoUsuario === 'RECEPCIONISTA' ||
    usuarioAuth.tipoUsuario === 'GERENTE';

  // Pestaña activa: 'mi-qr' (Socio), 'control-aforo' (Recepción SCRUM-82), o 'historial'
  const [vistaActiva, setVistaActiva] = useState<VistaAcceso>('mi-qr');

  // ── Estado Vista 1: Pase QR Socio (SCRUM-85) ────────────────────────────────
  const [sociosDisponibles, setSociosDisponibles] = useState<UsuarioDTO[]>(SOCIOS_EJEMPLO);
  const [socioSeleccionado, setSocioSeleccionado] = useState<UsuarioDTO>(
    esSocio && usuarioAuth ? usuarioAuth : SOCIOS_EJEMPLO[0]
  );
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

  // Cargar socios reales desde el backend cuando USE_MOCK === false
  useEffect(() => {
    if (esSocio && usuarioAuth) {
      setSocioSeleccionado(usuarioAuth);
      return;
    }
    if (USE_MOCK) return;

    let cancelado = false;
    httpClient
      .get<UsuarioDTO[]>('/v1/usuarios?tipo=SOCIO')
      .then((lista) => {
        if (cancelado || !Array.isArray(lista) || lista.length === 0) return;
        setSociosDisponibles(lista);
        setSocioSeleccionado((prev) =>
          lista.some((u) => u.idUsuario === prev.idUsuario) ? prev : lista[0]
        );
      })
      .catch(() => {
        // Fallback silencioso si no hay sesión o permisos para listar
      });

    return () => {
      cancelado = true;
    };
  }, [esSocio, usuarioAuth]);

  // ── Lógica Socio: Solicitar Token QR Dinámico ────────────────────────────────
  const solicitarNuevoToken = useCallback(
    async (idUsuario: number) => {
      setCargandoQr(true);
      setErrorQr(null);
      try {
        const tokenResp = await obtenerQrSocio(idUsuario);
        setSocioSeleccionado((current) => {
          if (current.idUsuario === idUsuario) {
            setQrTokenData(tokenResp);
          }
          return current;
        });
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
    [addToast]
  );

  // Efecto cuando cambia el socio seleccionado
  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargandoMembresia(true);
      setQrTokenData(null);
      setErrorQr(null);
      try {
        const m = await obtenerMembresiaPorUsuario(socioSeleccionado.idUsuario);
        if (cancelado) return;
        setMembresia(m);

        // REGLA DE NEGOCIO: Solo si la membresía está ACTIVA solicitamos el token QR
        if (m && m.estado === 'ACTIVO') {
          void solicitarNuevoToken(socioSeleccionado.idUsuario);
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
  }, [socioSeleccionado, solicitarNuevoToken, addToast]);

  // ── Lógica Recepción: Cargar Aforo en tiempo real ─────────────────────────────
  const cargarAforo = useCallback(async () => {
    if (!sedeActiva) return;
    try {
      const datosAforo = await obtenerAforo(sedeActiva.idSede);
      setAforo(datosAforo);
    } catch (err: unknown) {
      console.error('Error al actualizar aforo:', err);
    }
  }, [sedeActiva]);

  // ── Lógica Recepción: Cargar Accesos Activos de la sede ────────────────────────
  const cargarAccesosActivos = useCallback(async () => {
    if (!sedeActiva) return;
    setLoadingAccesos(true);
    try {
      const activos = await listarAccesosActivos(sedeActiva.idSede);
      setAccesosActivos(activos);
    } catch (err: unknown) {
      setErrorOperativo(err instanceof Error ? err.message : 'Error al cargar personas en sede');
    } finally {
      setLoadingAccesos(false);
    }
  }, [sedeActiva]);

  // Al montar o cambiar de sede, se actualizan los datos de recepción
  useEffect(() => {
    setResultadoValidacion(null);
    setErrorOperativo(null);

    if (sedeActiva) {
      setLoadingAforo(true);
      void Promise.all([cargarAforo(), cargarAccesosActivos()]).finally(() => {
        setLoadingAforo(false);
      });
    }
  }, [sedeActiva, cargarAforo, cargarAccesosActivos]);

  // ── Lógica Recepción: Historial de accesos ────────────────────────────────────
  useEffect(() => {
    if (vistaActiva !== 'historial' || !sedeActiva) return;

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
  }, [vistaActiva, sedeActiva]);

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
      const res = await validarIngreso({
        token,
        idSede: sedeActiva.idSede,
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
    navigate('/membresias');
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
              Control de acceso físico, aforo en tiempo real y pase QR para socios (SCRUM-82, SCRUM-85)
            </p>
          </div>
        </div>

        {/* Switcher de vistas */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto flex-wrap">
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
          {esPersonal && (
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
      {vistaActiva === 'mi-qr' && (
        <div className="space-y-6">
          {/* Selector de Socio de Prueba / Simulación de Estado (oculto para un SOCIO real) */}
          {(!esSocio || USE_MOCK) && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-fitzone-coral" />
                  Simular Socio / Caso de Negocio:
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Cambia el socio para evaluar las reglas
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {sociosDisponibles.map((s) => {
                  const esSeleccionado = socioSeleccionado.idUsuario === s.idUsuario;
                  return (
                    <button
                      key={s.idUsuario}
                      type="button"
                      onClick={() => setSocioSeleccionado(s)}
                      data-testid={`btn-socio-${s.idUsuario}`}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        esSeleccionado
                          ? 'bg-fitzone-navy text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.nombre} {s.apellido}
                      {USE_MOCK && s.idUsuario === 2 && ' (Activo)'}
                      {USE_MOCK && s.idUsuario === 6 && ' (Por vencer)'}
                      {USE_MOCK && s.idUsuario === 1 && ' (Vencido)'}
                      {USE_MOCK && s.idUsuario === 7 && ' (Suspendido)'}
                      {USE_MOCK && s.idUsuario === 3 && ' (Sin Membresía)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                  socio={socioSeleccionado}
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
                      onSolicitarNuevoToken={() => solicitarNuevoToken(socioSeleccionado.idUsuario)}
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
                          Regularizar en Membresías
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
                          Ir a Gestión de Membresías
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
      {vistaActiva === 'control-aforo' && (
        <div className="space-y-6">
          {/* Header Operativo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  RECEPCIÓN Y MOSTRADOR
                </span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[10px] font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Molinetes Sincronizados</span>
                </div>
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

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-fitzone-green" />
                <span>Reglas RN-01 & RF-05 activas</span>
              </div>
            </div>
          </div>

          {/* Banner de Modo Mock */}
          {USE_MOCK && (
            <div
              data-testid="banner-mock-mode"
              className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                  Modo Mock
                </span>
                <span>
                  Simulación de accesos físicos en memoria para <strong>{sedeActiva?.nombre || 'la sede'}</strong> (BUG-09 resuelto). Podés usar los botones rápidos de prueba para validar cada caso.
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-amber-700 font-mono shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VITE_USE_MOCK=true</span>
              </div>
            </div>
          )}

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

              <ValidadorIngreso
                onValidar={handleValidarIngreso}
                loading={validando}
                disabled={!sedeActiva}
              />
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
      {vistaActiva === 'historial' && (
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
