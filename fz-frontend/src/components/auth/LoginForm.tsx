import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { TextField, Button, Alert } from '../ui';
import { TipoUsuarioBadge } from '../usuarios';
import type { LoginCredentialsDTO, TipoUsuario } from '../../types';

export interface LoginFormProps {
  /** Callback invocado al enviar las credenciales validadas */
  onSubmit: (credentials: LoginCredentialsDTO) => Promise<void> | void;
  /** Estado de carga durante el procesamiento de la petición */
  isLoading?: boolean;
  /** Mensaje de error a mostrar en un banner Alert */
  errorMessage?: string | null;
  /** Callback para el enlace de recuperación de contraseña */
  onForgotPassword?: () => void;
  /** Callback para navegar hacia la vista de registro */
  onNavigateToRegister?: () => void;
  /** Si debe mostrar la barra de autocompletado rápido por rol (desarrollo/mock) */
  showQuickRoles?: boolean;
}

const QUICK_ROLES: Array<{
  tipo: TipoUsuario;
  label: string;
  email: string;
  password: string;
}> = [
  { tipo: 'SOCIO', label: 'Socio', email: 'socio@fitzone.com', password: 'password123' },
  { tipo: 'EXTERNO', label: 'Externo', email: 'externo@fitzone.com', password: 'password123' },
  { tipo: 'RECEPCIONISTA', label: 'Recepcionista', email: 'recepcionista@fitzone.com', password: 'password123' },
  { tipo: 'GERENTE', label: 'Gerente', email: 'gerente@fitzone.com', password: 'password123' },
];

/**
 * Formulario reutilizable de inicio de sesión (SCRUM-89).
 * No realiza peticiones directas: delega el envío a través de props tipadas.
 */
export function LoginForm({
  onSubmit,
  isLoading = false,
  errorMessage = null,
  onForgotPassword,
  onNavigateToRegister,
  showQuickRoles = true,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Ingrese un formato de correo válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    await onSubmit({
      email: email.trim(),
      password,
    });
  };

  const handleQuickFill = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 w-full">
      {/* Banner de error si la autenticación falló */}
      {errorMessage && (
        <Alert
          type="error"
          title="Error de inicio de sesión"
          message={errorMessage}
          className="mb-2"
        />
      )}

      {/* Barra de autocompletado rápido por rol (Modo Mock / Dev) */}
      {showQuickRoles && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Acceso rápido de prueba por rol
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_ROLES.map((item) => (
              <button
                key={item.tipo}
                type="button"
                onClick={() => handleQuickFill(item.email, item.password)}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-fitzone-navy hover:bg-slate-100/70 transition-all text-left cursor-pointer group"
              >
                <TipoUsuarioBadge tipo={item.tipo} size="xs" />
                <span className="text-[10px] text-slate-400 group-hover:text-fitzone-navy font-mono">
                  Llenar
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Campo: Correo Electrónico */}
      <TextField
        id="login-email"
        label="Correo Electrónico"
        type="email"
        placeholder="ejemplo@fitzone.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        leftIcon={Mail}
        error={errors.email}
        disabled={isLoading}
        required
      />

      {/* Campo: Contraseña con toggle */}
      <div className="space-y-1.5">
        <TextField
          id="login-password"
          label="Contraseña"
          type="password"
          placeholder="Ingrese su contraseña"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          leftIcon={Lock}
          error={errors.password}
          disabled={isLoading}
          showPasswordToggle
          required
        />
        {onForgotPassword && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-bold text-fitzone-coral hover:text-[#d95353] hover:underline cursor-pointer transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
      </div>

      {/* Botón primario de envío */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
        className="h-12 text-sm sm:text-base font-bold shadow-md"
      >
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>

      {/* Enlace hacia el flujo de registro */}
      {onNavigateToRegister && (
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-600">
            ¿No tenés una cuenta todavía?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-fitzone-coral hover:underline cursor-pointer"
            >
              Registrate acá
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
