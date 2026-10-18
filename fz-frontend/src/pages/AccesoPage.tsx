/**
 * AccesoPage.tsx — Pantalla de Código QR de Ingreso para el Socio (SCRUM-85).
 *
 * Requerimientos y Reglas de Negocio:
 *   1. Diseño Responsive: Vista centrada optimizada para dispositivos móviles (pase digital).
 *   2. Membresía en cabecera: Renderiza <MembresiaEstadoCard /> en la parte superior.
 *   3. Regla Crítica: Si la membresía NO está activa (VENCIDO, SUSPENDIDO, CANCELADO, sin membresía),
 *      NO debe mostrar el código QR y en su lugar exhibirá un banner/alerta informando el motivo
 *      por el cual no puede ingresar.
 *   4. Generación Dinámica: Para socios activos, renderiza <QrDinamico /> con cuenta regresiva de 60s
 *      y solicitud automática de nuevo token al expirar.
 *   5. Selector / Demostración: Permite seleccionar o alternar entre distintos socios para comprobar
 *      todos los estados del negocio (Activo, Vencido, Suspendido, Sin membresía).
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ShieldAlert, DoorOpen, RefreshCw, UserCheck, Smartphone, ExternalLink, ListFilter } from 'lucide-react';
import { Card, Spinner, Alert, Button, DataTable } from '../components/ui';
import type { Column } from '../components/ui';
import { MembresiaEstadoCard } from '../components/membresias';
import { QrDinamico } from '../components/acceso';
import { obtenerQrSocio, listarAccesos } from '../services/accesoService';
import { obtenerMembresiaPorUsuario } from '../services/membresiasService';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import type { MembresiaDTO, UsuarioDTO, AccesoDTO, QrTokenDTO } from '../types';
import { formatearFechaHora } from '../utils/formatters';

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

export function AccesoPage() {
  const navigate = useNavigate();
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  // Pestaña activa: 'mi-qr' (Socio) o 'historial' (Recepción)
  const [vistaActiva, setVistaActiva] = useState<'mi-qr' | 'historial'>('mi-qr');

  // Socio seleccionado actualmente para el código QR
  const [socioSeleccionado, setSocioSeleccionado] = useState<UsuarioDTO>(SOCIOS_EJEMPLO[0]);
  const [membresia, setMembresia] = useState<MembresiaDTO | null>(null);
  const [cargandoMembresia, setCargandoMembresia] = useState<boolean>(true);

  // Estado del token QR
  const [qrTokenData, setQrTokenData] = useState<QrTokenDTO | null>(null);
  const [cargandoQr, setCargandoQr] = useState<boolean>(false);
  const [errorQr, setErrorQr] = useState<string | null>(null);

  // Estado de registros de acceso físico para vista de recepción
  const [accesosSede, setAccesosSede] = useState<AccesoDTO[]>([]);
  const [cargandoAccesos, setCargandoAccesos] = useState<boolean>(false);

  // Solicitar nuevo token QR para el socio activo
  const solicitarNuevoToken = useCallback(
    async (idUsuario: number) => {
      setCargandoQr(true);
      setErrorQr(null);
      try {
        const tokenResp = await obtenerQrSocio(idUsuario);
        setQrTokenData(tokenResp);
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

  // Cargar estado de membresía del socio seleccionado
  const cargarEstadoMembresia = useCallback(
    async (usuario: UsuarioDTO) => {
      setCargandoMembresia(true);
      setQrTokenData(null);
      setErrorQr(null);
      try {
        const m = await obtenerMembresiaPorUsuario(usuario.idUsuario);
        setMembresia(m);

        // REGLA DE NEGOCIO: Solo si la membresía está ACTIVA solicitamos el token QR
        if (m && m.estado === 'ACTIVO') {
          void solicitarNuevoToken(usuario.idUsuario);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al consultar membresía del socio.';
        setMembresia(null);
        addToast({
          type: 'error',
          title: 'Error de membresía',
          message: msg,
        });
      } finally {
        setCargandoMembresia(false);
      }
    },
    [solicitarNuevoToken, addToast]
  );

  // Efecto cuando cambia el socio seleccionado
  useEffect(() => {
    void cargarEstadoMembresia(socioSeleccionado);
  }, [socioSeleccionado, cargarEstadoMembresia]);

  // Cargar historial de accesos si se abre la pestaña de recepción
  useEffect(() => {
    if (vistaActiva !== 'historial' || !sedeActiva) return;

    let cancelado = false;
    const cargar = async () => {
      setCargandoAccesos(true);
      try {
        const registros = await listarAccesos(sedeActiva.idSede);
        if (!cancelado) setAccesosSede(registros);
      } catch {
        // Silencioso o con estado vacío
      } finally {
        if (!cancelado) setCargandoAccesos(false);
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [vistaActiva, sedeActiva]);

  // Manejador de renovación o actualización
  const handleRenovar = () => {
    navigate('/membresias');
  };

  // Determinar si la membresía permite ingreso
  const tieneAccesoHabilitado = membresia !== null && membresia.estado === 'ACTIVO';

  // Mensaje descriptivo según el motivo del bloqueo de acceso
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
    <div className="space-y-6 pb-12">
      {/* Selector de modo de vista (Socio / Recepción) */}
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
              Código QR dinámico para ingreso físico a molinetes y control de aforo (SCRUM-85)
            </p>
          </div>
        </div>

        {/* Switcher de vistas */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setVistaActiva('mi-qr')}
            data-testid="tab-mi-qr"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              vistaActiva === 'mi-qr'
                ? 'bg-white text-fitzone-navy shadow-xs'
                : 'text-slate-500 hover:text-fitzone-navy'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mi QR (Socio)</span>
          </button>
          <button
            type="button"
            onClick={() => setVistaActiva('historial')}
            data-testid="tab-historial"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              vistaActiva === 'historial'
                ? 'bg-white text-fitzone-navy shadow-xs'
                : 'text-slate-500 hover:text-fitzone-navy'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Molinete Recepción</span>
          </button>
        </div>
      </div>

      {/* ─── VISTA 1: MI CÓDIGO QR (SOCIO) ─────────────────────────────────── */}
      {vistaActiva === 'mi-qr' && (
        <div className="space-y-6">
          {/* Selector de Socio de Prueba / Simulación de Estado */}
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
              {SOCIOS_EJEMPLO.map((s) => {
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
                    {s.idUsuario === 2 && ' (Activo)'}
                    {s.idUsuario === 6 && ' (Por vencer)'}
                    {s.idUsuario === 1 && ' (Vencido)'}
                    {s.idUsuario === 7 && ' (Suspendido)'}
                    {s.idUsuario === 3 && ' (Sin Membresía)'}
                  </button>
                );
              })}
            </div>
          </div>

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
                NO se muestra el QR y en su lugar se exhibe un banner/mensaje informando el motivo. */}
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

      {/* ─── VISTA 2: HISTORIAL DE ENTRADAS / MOLINETE RECEPCIÓN ────────────── */}
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
