import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSede } from '../context/SedeContext';
import { useToast } from '../context/ToastContext';
import { RegistroForm } from '../components/auth';
import { PlanCard } from '../components/membresias';
import { ResumenPago } from '../components/pagos';
import { Alert, Button, Spinner, TextField } from '../components/ui';
import { listarPlanes } from '../services/membresiasService';
import { guardarAltaPendiente, limpiarAltaPendiente, obtenerAltaPendiente } from '../services/authService';
import type { AltaPendienteGuardada } from '../services/authService';
import { INICIO_POR_ROL } from '../components/layout/navegacion';
import type { AltaSocioResultadoDTO, PlanDTO, RegistroUsuarioDTO } from '../types';

type Paso = 'datos' | 'pago' | 'pendiente';

/**
 * "Hacete socio": datos y plan, checkout de la suscripción y cuenta creada.
 * Sin pago aprobado no hay cuenta. Renderizada fuera de AppLayout, como el login.
 */
export function RegistroPage() {
  const navigate = useNavigate();
  const { register, reintentarCuenta, usuario, isAuthenticated } = useAuth();
  const { sedeActiva } = useSede();
  const { addToast } = useToast();

  const [pendiente, setPendiente] = useState<AltaPendienteGuardada | null>(() => obtenerAltaPendiente());
  const [paso, setPaso] = useState<Paso>(() => (obtenerAltaPendiente() ? 'pendiente' : 'datos'));
  const [planes, setPlanes] = useState<PlanDTO[] | null>(null);
  const [plan, setPlan] = useState<PlanDTO | null>(null);
  const [datos, setDatos] = useState<RegistroUsuarioDTO | null>(null);
  const [passwordReintento, setPasswordReintento] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && usuario) {
      navigate(INICIO_POR_ROL[usuario.tipoUsuario], { replace: true });
    }
  }, [isAuthenticated, usuario, navigate]);

  useEffect(() => {
    listarPlanes()
      .then((lista) => {
        setPlanes(lista);
        setPlan((actual) => actual ?? lista.find((p) => p.destacado) ?? lista[0] ?? null);
      })
      .catch(() => setPlanes([]));
  }, []);

  const handleDatos = (completados: RegistroUsuarioDTO) => {
    if (!plan) {
      setErrorMessage('Elegí un plan para continuar');
      return;
    }
    setErrorMessage(null);
    setDatos(completados);
    setPaso('pago');
  };

  const terminar = (resultado: AltaSocioResultadoDTO) => {
    if (resultado.cuentaPendiente && resultado.codigoReintento && resultado.numeroFactura) {
      const alta: AltaPendienteGuardada = {
        dni: resultado.usuario.dni,
        email: resultado.usuario.email,
        numeroFactura: resultado.numeroFactura,
        codigoReintento: resultado.codigoReintento,
        mensaje: resultado.mensaje ?? 'No pudimos crear tu acceso.',
      };
      guardarAltaPendiente(alta);
      setPendiente(alta);
      setPaso('pendiente');
    } else if (resultado.token) {
      limpiarAltaPendiente();
      navigate(INICIO_POR_ROL.SOCIO, { replace: true });
    } else {
      limpiarAltaPendiente();
      addToast({ type: 'success', title: 'Cuenta creada', message: resultado.mensaje ?? 'Iniciá sesión con tu email y contraseña.' });
      navigate('/login', { replace: true });
    }
  };

  const handlePagar = async () => {
    if (!datos || !plan) return;
    if (!sedeActiva) {
      setErrorMessage('No hay sedes disponibles para registrar el cobro. Probá más tarde.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      terminar(await register({ ...datos, idPlan: plan.idPlan, idSede: sedeActiva.idSede }));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo completar el alta');
    } finally {
      setLoading(false);
    }
  };

  const handleReintentarCuenta = async () => {
    const password = datos?.password ?? passwordReintento;
    if (!pendiente || !password) {
      setErrorMessage('Ingresá la contraseña que elegiste para tu cuenta');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      terminar(await reintentarCuenta({
        dni: pendiente.dni,
        email: pendiente.email,
        password,
        codigoReintento: pendiente.codigoReintento,
      }));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo crear tu acceso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-fitzone-navy relative overflow-hidden font-manrope">
      <div className="absolute -top-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-fitzone-coral/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-fitzone-gold/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[560px] bg-white rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 border border-white/20 my-8">
        <div className="flex flex-col items-center gap-2 text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-fitzone-navy flex items-center justify-center shadow-md">
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect width="64" height="64" rx="16" fill="#1B2A55" />
              <path
                d="M19.5 17H44.5C45.9 17 47 18.1 47 19.5V44.5C47 45.9 45.9 47 44.5 47H19.5C18.1 47 17 45.9 17 44.5V19.5C17 18.1 18.1 17 19.5 17Z"
                stroke="#F26D6D"
                strokeWidth="4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-fitzone-navy font-outfit tracking-tight">
              Hacete socio
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Elegí tu plan y pagalo online: tu cuenta se crea con el pago aprobado.
            </p>
          </div>
        </div>

        {paso === 'datos' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Elegí tu plan</span>
              {planes === null ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : planes.length === 0 ? (
                <Alert type="warning" message="Todavía no hay planes disponibles. Probá más tarde." />
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {planes.map((p) => (
                    <PlanCard
                      key={p.idPlan}
                      plan={p}
                      selected={plan?.idPlan === p.idPlan}
                      onSeleccionar={setPlan}
                      actionLabel="Elegir"
                    />
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">2. Tus datos</span>
            <RegistroForm
              onSubmit={handleDatos}
              valoresIniciales={datos}
              isLoading={loading}
              errorMessage={errorMessage}
              onNavigateToLogin={() => navigate('/login')}
            />
          </div>
        )}

        {paso === 'pago' && plan && (
          <div className="space-y-3">
            {errorMessage && <Alert type="error" title="No se pudo completar el alta" message={errorMessage} />}
            <ResumenPago
              detalle={{
                tipo: 'MEMBRESIA',
                titulo: `Alta de socio · ${plan.nombre}`,
                planNombre: plan.nombre,
                duracionMeses: plan.duracionMeses,
              }}
              montoTotal={Number(plan.precioBase)}
              isProcessing={loading}
              onConfirmarPago={handlePagar}
            />
            <Button variant="secondary" fullWidth disabled={loading} onClick={() => setPaso('datos')}>
              Volver a mis datos
            </Button>
          </div>
        )}

        {paso === 'pendiente' && pendiente && (
          <div className="space-y-3">
            <Alert type="warning" title="Tu pago quedó registrado" message={pendiente.mensaje} />
            <p className="text-xs text-slate-600">
              Comprobante: <strong>{pendiente.numeroFactura}</strong>. Si cerrás esta pestaña antes de crear tu acceso,
              acercate a una sede con este número.
            </p>
            {!datos && (
              <TextField
                label="Contraseña de tu cuenta"
                type="password"
                value={passwordReintento}
                onChange={(e) => setPasswordReintento(e.target.value)}
                placeholder="La que elegiste al registrarte"
                disabled={loading}
              />
            )}
            {errorMessage && <Alert type="error" message={errorMessage} />}
            <Button variant="coral" fullWidth isLoading={loading} onClick={() => void handleReintentarCuenta()}>
              Reintentar crear mi acceso
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
