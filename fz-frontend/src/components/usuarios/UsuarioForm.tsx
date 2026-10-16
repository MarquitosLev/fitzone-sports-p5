import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Hash, Image, Shield, Building2, UserPlus, Save } from 'lucide-react';
import { TextField, Select, Button, Alert } from '../ui';
import type { SelectOption } from '../ui';
import { useSede } from '../../context/SedeContext';
import type { UsuarioDTO, UsuarioFormData, TipoUsuario, SedeDTO } from '../../types';
import { AppError } from '../../services/httpClient';

export interface UsuarioFormProps {
  modo: 'alta' | 'edicion';
  valoresIniciales?: Partial<UsuarioDTO> | null;
  onSubmit: (datos: UsuarioFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
  sedesDisponibles?: SedeDTO[];
  className?: string;
}

const ROLES_OPTIONS: SelectOption[] = [
  { value: 'SOCIO', label: 'Socio (Cliente con membresía)' },
  { value: 'EXTERNO', label: 'Externo (Invitado / Reserva de canchas)' },
  { value: 'RECEPCIONISTA', label: 'Recepcionista (Operador de sede)' },
  { value: 'GERENTE', label: 'Gerente (Administrador general)' },
];

/**
 * Formulario unificado de alta y edición de usuarios (RF-01).
 * Implementa la regla de negocio que muestra el selector de sede únicamente
 * cuando el rol seleccionado es RECEPCIONISTA o GERENTE.
 */
export function UsuarioForm({
  modo,
  valoresIniciales,
  onSubmit,
  onCancel,
  loading = false,
  sedesDisponibles,
  className = '',
}: UsuarioFormProps) {
  const { sedeActiva, sedes: sedesContexto } = useSede();
  const sedesList = sedesDisponibles || sedesContexto || [];

  // Estado del formulario
  const [formData, setFormData] = useState<UsuarioFormData>({
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fotoUrl: '',
    tipoUsuario: 'SOCIO',
    idSede: sedeActiva?.idSede ?? 1,
  });

  // Errores por campo
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Error general del backend
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Inicializar o actualizar estado al recibir valoresIniciales
  useEffect(() => {
    if (valoresIniciales) {
      setFormData({
        dni: valoresIniciales.dni || '',
        nombre: valoresIniciales.nombre || '',
        apellido: valoresIniciales.apellido || '',
        email: valoresIniciales.email || '',
        telefono: valoresIniciales.telefono || '',
        fotoUrl: valoresIniciales.fotoUrl || '',
        tipoUsuario: valoresIniciales.tipoUsuario || 'SOCIO',
        idSede: valoresIniciales.idSede ?? (sedeActiva?.idSede || 1),
      });
    } else {
      setFormData({
        dni: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        fotoUrl: '',
        tipoUsuario: 'SOCIO',
        idSede: sedeActiva?.idSede || 1,
      });
    }
    setErrors({});
    setGeneralError(null);
  }, [valoresIniciales, sedeActiva?.idSede]);

  // Regla de Negocio: Mostrar asignación de sede ÚNICAMENTE para RECEPCIONISTA o GERENTE
  const requiereAsignacionSede =
    formData.tipoUsuario === 'RECEPCIONISTA' || formData.tipoUsuario === 'GERENTE';

  // Opciones de sedes para el Select
  const sedesOptions: SelectOption[] = sedesList.map((s) => ({
    value: s.idSede,
    label: s.nombre,
  }));

  // Handlers de cambio
  const handleChange = (campo: keyof UsuarioFormData, valor: any) => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    // Limpiar error del campo modificado
    if (errors[campo]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[campo];
        return next;
      });
    }
    if (generalError) setGeneralError(null);
  };

  // Validación local del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es obligatorio';
    } else if (!/^\d{6,10}$/.test(formData.dni.trim())) {
      newErrors.dni = 'El DNI debe contener entre 6 y 10 dígitos numéricos';
    }

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

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Ingrese un formato de email válido';
    }

    if (requiereAsignacionSede && !formData.idSede) {
      newErrors.idSede = 'Debe seleccionar una sede asignada para este rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) return;

    try {
      // Aseguramos que si no requiere selector de sede, use la sede activa actual o por defecto
      const payload: UsuarioFormData = {
        ...formData,
        idSede: requiereAsignacionSede
          ? Number(formData.idSede)
          : Number(formData.idSede || sedeActiva?.idSede || 1),
      };

      await onSubmit(payload);
    } catch (err: unknown) {
      if (err instanceof AppError) {
        // Mapeo granular de errores de negocio del backend
        if (err.backendResponse?.detalles) {
          const detalles = err.backendResponse.detalles;
          if (typeof detalles === 'object' && !Array.isArray(detalles)) {
            setErrors((prev) => ({ ...prev, ...(detalles as Record<string, string>) }));
          }
        }

        // Detección heurística de unicidad para DNI y Email
        const msg = err.message.toLowerCase();
        if (msg.includes('dni')) {
          setErrors((prev) => ({ ...prev, dni: err.message }));
        } else if (msg.includes('email') || msg.includes('correo')) {
          setErrors((prev) => ({ ...prev, email: err.message }));
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError('Ocurrió un error inesperado al guardar el usuario.');
      }
    }
  };

  const sedeActivaNombre =
    sedesList.find((s) => s.idSede === formData.idSede)?.nombre ||
    sedeActiva?.nombre ||
    'Sede activa';

  return (
    <form onSubmit={handleSubmit} noValidate className={`space-y-5 ${className}`}>
      {/* Alerta de Error General si ocurrió */}
      {generalError && (
        <Alert
          type="error"
          title="Error al procesar usuario"
          message={generalError}
        />
      )}

      {/* Grid de Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
        <TextField
          id="usuario-nombre"
          label="Nombre"
          placeholder="Ej: Lucas"
          value={formData.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          error={errors.nombre}
          leftIcon={User}
          required
          disabled={loading}
        />

        {/* Apellido */}
        <TextField
          id="usuario-apellido"
          label="Apellido"
          placeholder="Ej: Martínez"
          value={formData.apellido}
          onChange={(e) => handleChange('apellido', e.target.value)}
          error={errors.apellido}
          leftIcon={User}
          required
          disabled={loading}
        />

        {/* DNI */}
        <TextField
          id="usuario-dni"
          label="DNI / Documento"
          placeholder="Ej: 30123456"
          value={formData.dni}
          onChange={(e) => handleChange('dni', e.target.value.replace(/\D/g, ''))}
          error={errors.dni}
          leftIcon={Hash}
          required
          disabled={loading}
          helperText="Sólo números sin puntos ni guiones"
        />

        {/* Email */}
        <TextField
          id="usuario-email"
          label="Correo Electrónico"
          type="email"
          placeholder="Ej: lucas.martinez@email.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          leftIcon={Mail}
          required
          disabled={loading}
        />

        {/* Teléfono */}
        <TextField
          id="usuario-telefono"
          label="Teléfono de Contacto"
          type="tel"
          placeholder="Ej: 11-4567-8901"
          value={formData.telefono}
          onChange={(e) => handleChange('telefono', e.target.value)}
          error={errors.telefono}
          leftIcon={Phone}
          disabled={loading}
        />

        {/* Rol / Tipo de Usuario */}
        <Select
          id="usuario-tipo"
          label="Rol en el Sistema"
          options={ROLES_OPTIONS}
          value={formData.tipoUsuario}
          onChange={(e) => handleChange('tipoUsuario', e.target.value as TipoUsuario)}
          error={errors.tipoUsuario}
          leftIcon={Shield}
          required
          disabled={loading}
        />

        {/* Campo de Selector de Sede: SOLO visible si el rol es RECEPCIONISTA o GERENTE */}
        {requiereAsignacionSede ? (
          <div className="sm:col-span-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 animate-fade-in">
            <Select
              id="usuario-sede"
              label="Asignación de Sede Operativa"
              options={sedesOptions}
              value={formData.idSede}
              onChange={(e) => handleChange('idSede', Number(e.target.value))}
              error={errors.idSede}
              leftIcon={Building2}
              required
              disabled={loading}
              helperText="El personal administrativo debe tener una sede física asignada para el control de operaciones."
            />
          </div>
        ) : (
          /* Aviso informativo de pertenencia a sede para socios y externos */
          <div className="sm:col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Usuario asociado a la sede actual:{' '}
              <strong className="text-[#1B2A55] font-semibold">{sedeActivaNombre}</strong>
            </span>
          </div>
        )}

        {/* Foto de Perfil URL (opcional) */}
        <div className="sm:col-span-2">
          <TextField
            id="usuario-fotoUrl"
            label="URL de Foto de Perfil (Opcional)"
            placeholder="https://ejemplo.com/foto.jpg"
            value={formData.fotoUrl || ''}
            onChange={(e) => handleChange('fotoUrl', e.target.value)}
            error={errors.fotoUrl}
            leftIcon={Image}
            disabled={loading}
            helperText="Si no se ingresa foto, se generará un avatar con las iniciales del usuario."
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          leftIcon={modo === 'alta' ? UserPlus : Save}
        >
          {modo === 'alta' ? 'Dar de Alta Usuario' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
