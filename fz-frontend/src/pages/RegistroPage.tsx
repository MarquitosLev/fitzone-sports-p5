import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RegistroForm } from '../components/auth';
import type { RegistroUsuarioDTO } from '../types';

/**
 * Pantalla completa de Registro Público (SCRUM-89).
 * Renderizada fuera de AppLayout. Permite el alta pública de un usuario EXTERNO.
 */
export function RegistroPage() {
  const navigate = useNavigate();
  const { register, usuario, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Si el usuario ya está autenticado, lo redirige automáticamente a su rol
  useEffect(() => {
    if (isAuthenticated && usuario) {
      navigate(`/rol/${usuario.tipoUsuario.toLowerCase()}`, { replace: true });
    }
  }, [isAuthenticated, usuario, navigate]);

  const handleRegister = async (datos: RegistroUsuarioDTO) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await register(datos);
      navigate(`/rol/${res.usuario.tipoUsuario.toLowerCase()}`, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el usuario';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-fitzone-navy relative overflow-hidden font-manrope">
      {/* Resplandor decorativo de fondo */}
      <div className="absolute -top-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-fitzone-coral/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-fitzone-gold/15 rounded-full blur-3xl pointer-events-none" />

      {/* Tarjeta de Registro */}
      <div className="w-full max-w-[560px] bg-white rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 border border-white/20 my-8">
        {/* Cabecera */}
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
              Crear Cuenta
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Registrate para reservar canchas y acceder a las actividades de FitZone Sports.
            </p>
          </div>
        </div>

        {/* Formulario de Registro */}
        <RegistroForm
          onSubmit={handleRegister}
          isLoading={loading}
          errorMessage={errorMessage}
          onNavigateToLogin={() => navigate('/login')}
        />
      </div>
    </div>
  );
}

export default RegistroPage;
