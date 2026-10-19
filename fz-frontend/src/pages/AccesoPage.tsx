/**
 * AccesoPage.tsx — Control de Acceso y Aforo en Tiempo Real (SCRUM-82, RF-04, RF-05).
 * Permite a recepción validar el QR de quien entra y monitorear el aforo de la sede en la misma pantalla.
 */

import { useState, useEffect, useCallback } from 'react';
import { DoorOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import { Alert } from '../components/ui/Alert';
import {
  obtenerAforo,
  listarAccesosActivos,
  validarIngreso,
  registrarEgreso,
} from '../services/accesoService';
import type { AforoSedeDTO, AccesoDTO, ResultadoValidacionDTO } from '../types';
import {
  AforoIndicador,
  ValidadorIngreso,
  ResultadoValidacion,
  PersonasAdentroList,
} from '../components/acceso';

const isMockMode = import.meta.env.VITE_USE_MOCK !== 'false';

export function AccesoPage() {
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  const [aforo, setAforo] = useState<AforoSedeDTO | null>(null);
  const [accesosActivos, setAccesosActivos] = useState<AccesoDTO[]>([]);
  const [loadingAforo, setLoadingAforo] = useState(false);
  const [loadingAccesos, setLoadingAccesos] = useState(false);
  const [validando, setValidando] = useState(false);
  const [egresoLoadingId, setEgresoLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacionDTO | null>(null);

  // ── Cargar Aforo en tiempo real ──────────────────────────────────────────────
  const cargarAforo = useCallback(async () => {
    if (!sedeActiva) return;
    try {
      const datosAforo = await obtenerAforo(sedeActiva.idSede);
      setAforo(datosAforo);
    } catch (err: unknown) {
      // En polling silencioso evitamos pisar alertas mayores salvo fallo continuo
      console.error('Error al actualizar aforo:', err);
    }
  }, [sedeActiva]);

  // ── Cargar Accesos Activos de la sede ─────────────────────────────────────────
  const cargarAccesosActivos = useCallback(async () => {
    if (!sedeActiva) return;
    setLoadingAccesos(true);
    try {
      const activos = await listarAccesosActivos(sedeActiva.idSede);
      setAccesosActivos(activos);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar personas en sede');
    } finally {
      setLoadingAccesos(false);
    }
  }, [sedeActiva]);

  // Al montar o cambiar de sede, se limpian validaciones anteriores y se refresca
  useEffect(() => {
    setResultadoValidacion(null);
    setError(null);

    if (sedeActiva) {
      setLoadingAforo(true);
      void Promise.all([cargarAforo(), cargarAccesosActivos()]).finally(() => {
        setLoadingAforo(false);
      });
    }
  }, [sedeActiva, cargarAforo, cargarAccesosActivos]);

  // ── Validación de Ingreso ───────────────────────────────────────────────────
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
      setError(msg);
      addToast({
        type: 'error',
        title: 'Error de validación',
        message: msg,
      });
    } finally {
      setValidando(false);
    }
  };

  // ── Registro de Egreso ──────────────────────────────────────────────────────
  const handleRegistrarEgreso = async (idAcceso: number) => {
    setEgresoLoadingId(idAcceso);
    try {
      const egresado = await registrarEgreso(idAcceso);
      addToast({
        type: 'info',
        title: 'Egreso registrado',
        message: `Salida registrada para ${egresado.usuario.nombre} ${egresado.usuario.apellido}. Aforo liberado.`,
      });

      // Refrescar
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* ── Header Operativo de Recepción ────────────────────────────────────── */}
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
          <h1 className="text-2xl sm:text-3xl font-black text-fitzone-navy font-outfit mt-1 flex items-center gap-2.5">
            <DoorOpen className="w-7 h-7 text-fitzone-coral" />
            <span>Control de Acceso y Aforo</span>
          </h1>
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

      {/* ── Banner de Modo Mock (visible cuando VITE_USE_MOCK === true) ─────── */}
      {isMockMode && (
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

      {/* ── Alerta de error si existe ───────────────────────────────────────── */}
      {error && (
        <Alert
          type="error"
          title="Fallo en la operación"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* ── Layout en Dos Columnas Operativas ───────────────────────────────── */}
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
  );
}
