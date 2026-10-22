import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../components/auth';
import { Modal, Button, Alert } from '../components/ui';
import type { LoginCredentialsDTO } from '../types';

/**
 * Pantalla completa de Inicio de Sesión (SCRUM-89).
 * Renderizada fuera de AppLayout. Conecta con AuthContext y redirige al rol correspondiente.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const { login, usuario, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Si el usuario ya está autenticado, lo redirige automáticamente a la pantalla de su rol
  useEffect(() => {
    if (isAuthenticated && usuario) {
      navigate(`/rol/${usuario.tipoUsuario.toLowerCase()}`, { replace: true });
    }
  }, [isAuthenticated, usuario, navigate]);

  const handleLogin = async (credentials: LoginCredentialsDTO) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await login(credentials);
      navigate(`/rol/${res.usuario.tipoUsuario.toLowerCase()}`, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-fitzone-navy relative overflow-hidden font-manrope">
      {/* Resplandor decorativo de fondo */}
      <div className="absolute -top-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-fitzone-coral/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-fitzone-green/15 rounded-full blur-3xl pointer-events-none" />

      {/* Tarjeta de Login */}
      <div className="w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 border border-white/20">
        {/* Cabecera de Marca FitZone Sports */}
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
              FitZone
            </h1>
            <span className="text-[11px] font-black text-fitzone-coral tracking-[0.25em] block">
              SPORTS
            </span>
          </div>
        </div>

        {/* Formulario de Login */}
        <LoginForm
          onSubmit={handleLogin}
          isLoading={loading}
          errorMessage={errorMessage}
          onForgotPassword={() => setShowForgotModal(true)}
          onNavigateToRegister={() => navigate('/registro')}
          showQuickRoles={true}
        />
      </div>

      {/* Modal informativo para recuperación de contraseña */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Recuperación de Contraseña"
        size="sm"
      >
        <div className="space-y-4">
          <Alert
            type="info"
            title="Gestión de Claves"
            message="Por motivos de seguridad, la recuperación de contraseña se realiza a través del enlace de verificación enviado a tu correo o de forma presencial en la recepción de tu sede."
          />
          <p className="text-xs text-slate-500 leading-relaxed">
            Si tenés una cuenta activa y no recordás tu clave, podés solicitar el reenvío de invitación comunicándote con el personal de mostrador.
          </p>
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowForgotModal(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LoginPage;
