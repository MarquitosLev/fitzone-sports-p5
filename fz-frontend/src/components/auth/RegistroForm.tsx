import React, { useState } from 'react';
import { User, Mail, Phone, Lock, CreditCard } from 'lucide-react';
import { TextField, Button, Alert } from '../ui';
import type { RegistroUsuarioDTO } from '../../types';

export interface RegistroFormProps {
  /** Callback invocado al enviar los datos de registro validados */
  onSubmit: (datos: RegistroUsuarioDTO) => Promise<void> | void;
  /** Estado de carga durante el procesamiento de la petición */
  isLoading?: boolean;
  /** Mensaje de error a mostrar en un banner Alert */
  errorMessage?: string | null;
  /** Callback para regresar hacia la vista de inicio de sesión */
  onNavigateToLogin?: () => void;
}

interface FormState {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  password: string;
  confirmarPassword: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

/**
 * Formulario reutilizable de registro público (SCRUM-89).
 * Regla de negocio estricta: No contiene selectores de rol; asigna fijamente
 * tipoUsuario = 'EXTERNO' e idSede = null.
 */
export function RegistroForm({
  onSubmit,
  isLoading = false,
  errorMessage = null,
  onNavigateToLogin,
}: RegistroFormProps) {
  const [formData, setFormData] = useState<FormState>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    password: '',
    confirmarPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: keyof FormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es obligatorio';
    } else if (formData.apellido.trim().length < 2) {
      newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
    }

    const dniClean = formData.dni.trim().replace(/\D/g, '');
    if (!dniClean) {
      newErrors.dni = 'El DNI es obligatorio';
    } else if (dniClean.length < 7 || dniClean.length > 8) {
      newErrors.dni = 'El DNI debe tener 7 u 8 dígitos numéricos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Ingrese un formato de correo electrónico válido';
    }

    const telClean = formData.telefono.trim().replace(/\D/g, '');
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono de contacto es obligatorio';
    } else if (telClean.length < 8) {
      newErrors.telefono = 'Ingrese un teléfono válido con código de área (mínimo 8 dígitos)';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe contener al menos 6 caracteres';
    }

    if (!formData.confirmarPassword) {
      newErrors.confirmarPassword = 'Debe confirmar su contraseña';
    } else if (formData.password !== formData.confirmarPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    await onSubmit({
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      dni: formData.dni.trim().replace(/\D/g, ''),
      email: formData.email.trim().toLowerCase(),
      telefono: formData.telefono.trim(),
      password: formData.password,
      tipoUsuario: 'EXTERNO',
      idSede: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 w-full">
      {errorMessage && (
        <Alert
          type="error"
          title="Error de registro"
          message={errorMessage}
          className="mb-2"
        />
      )}

      {/* Nombre y Apellido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          id="registro-nombre"
          label="Nombre"
          placeholder="Ej: Martín"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          leftIcon={User}
          error={errors.nombre}
          disabled={isLoading}
          required
        />
        <TextField
          id="registro-apellido"
          label="Apellido"
          placeholder="Ej: García"
          value={formData.apellido}
          onChange={(e) => handleChange('apellido', e.target.value)}
          leftIcon={User}
          error={errors.apellido}
          disabled={isLoading}
          required
        />
      </div>

      {/* DNI y Teléfono */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          id="registro-dni"
          label="DNI"
          placeholder="Sin puntos (ej: 35123456)"
          value={formData.dni}
          onChange={(e) => handleChange('dni', e.target.value)}
          leftIcon={CreditCard}
          error={errors.dni}
          disabled={isLoading}
          required
        />
        <TextField
          id="registro-telefono"
          label="Teléfono"
          placeholder="Ej: 1144556677"
          value={formData.telefono}
          onChange={(e) => handleChange('telefono', e.target.value)}
          leftIcon={Phone}
          error={errors.telefono}
          disabled={isLoading}
          required
        />
      </div>

      {/* Email */}
      <TextField
        id="registro-email"
        label="Correo Electrónico"
        type="email"
        placeholder="ejemplo@fitzone.com"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        leftIcon={Mail}
        error={errors.email}
        disabled={isLoading}
        required
      />

      {/* Contraseña y Confirmación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          id="registro-password"
          label="Contraseña"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          leftIcon={Lock}
          error={errors.password}
          disabled={isLoading}
          showPasswordToggle
          required
        />
        <TextField
          id="registro-confirmar-password"
          label="Confirmar Contraseña"
          type="password"
          placeholder="Repita su contraseña"
          value={formData.confirmarPassword}
          onChange={(e) => handleChange('confirmarPassword', e.target.value)}
          leftIcon={Lock}
          error={errors.confirmarPassword}
          disabled={isLoading}
          showPasswordToggle
          required
        />
      </div>

      {/* Botón primario de registro */}
      <Button
        type="submit"
        variant="coral"
        size="md"
        fullWidth
        isLoading={isLoading}
        disabled={isLoading}
        className="h-12 text-sm sm:text-base font-bold shadow-md mt-2"
      >
        {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
      </Button>

      {/* Enlace para volver a Iniciar Sesión */}
      {onNavigateToLogin && (
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs sm:text-sm text-slate-600">
            ¿Ya tenés una cuenta registrada?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-fitzone-navy hover:underline cursor-pointer"
            >
              Iniciá sesión acá
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
