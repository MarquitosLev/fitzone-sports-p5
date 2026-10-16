/**
 * ClaseForm.tsx — Formulario de alta y edición de Clases Grupales (RF-06).
 * Valida los campos requeridos antes de llamar a onSubmit.
 */

import { useState } from 'react';
import { Dumbbell, Clock, Users, AlertCircle } from 'lucide-react';
import { TextField, DateTimeField, Button, Alert } from '../ui';
import type { ClaseGrupalDTO } from '../../types';

export type ClaseFormModo = 'alta' | 'edicion';

/** Payload que emite el formulario hacia el padre */
export interface ClaseFormPayload extends Omit<ClaseGrupalDTO, 'sede'> {
  sede?: ClaseGrupalDTO['sede'];
}

export interface ClaseFormProps {
  modo: ClaseFormModo;
  /** Valores iniciales para el modo edición */
  valoresIniciales?: Partial<ClaseGrupalDTO>;
  onSubmit: (payload: ClaseFormPayload) => Promise<void> | void;
  loading?: boolean;
  /** Error de negocio a mostrar encima del formulario (ej. cupo inválido) */
  errorNegocio?: string | null;
}

interface FormErrors {
  nombreActividad?: string;
  fechaHoraInicio?: string;
  duracionMinutos?: string;
  cupoMaximo?: string;
}

export function ClaseForm({
  modo,
  valoresIniciales,
  onSubmit,
  loading = false,
  errorNegocio,
}: ClaseFormProps) {
  const [nombreActividad, setNombreActividad] = useState(
    valoresIniciales?.nombreActividad ?? ''
  );
  const [fechaHoraInicio, setFechaHoraInicio] = useState(
    valoresIniciales?.fechaHoraInicio
      ? valoresIniciales.fechaHoraInicio.substring(0, 16) // trim to "YYYY-MM-DDTHH:mm"
      : ''
  );
  const [duracionMinutos, setDuracionMinutos] = useState(
    valoresIniciales?.duracionMinutos?.toString() ?? '60'
  );
  const [cupoMaximo, setCupoMaximo] = useState(
    valoresIniciales?.cupoMaximo?.toString() ?? '20'
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!nombreActividad.trim()) {
      newErrors.nombreActividad = 'El nombre de la actividad es obligatorio';
    }
    if (!fechaHoraInicio) {
      newErrors.fechaHoraInicio = 'La fecha y hora de inicio son obligatorias';
    }
    const duracion = parseInt(duracionMinutos, 10);
    if (!duracionMinutos || isNaN(duracion) || duracion < 1) {
      newErrors.duracionMinutos = 'La duración debe ser al menos 1 minuto';
    }
    const cupo = parseInt(cupoMaximo, 10);
    if (!cupoMaximo || isNaN(cupo) || cupo < 1) {
      newErrors.cupoMaximo = 'El cupo máximo debe ser al menos 1 persona';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cupo = parseInt(cupoMaximo, 10);
    const duracion = parseInt(duracionMinutos, 10);

    const payload: ClaseFormPayload = {
      idClase: valoresIniciales?.idClase ?? 0,
      nombreActividad: nombreActividad.trim(),
      fechaHoraInicio,
      duracionMinutos: duracion,
      cupoMaximo: cupo,
      // cupoDisponible: keep original if editing, else equals cupoMaximo
      cupoDisponible: valoresIniciales?.cupoDisponible ?? cupo,
      sede: valoresIniciales?.sede ?? { idSede: 0, nombre: '', aforoMaximo: 0 },
    };

    await onSubmit(payload);
  };

  const isEdicion = modo === 'edicion';

  return (
    <form
      id="clase-form"
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-label={isEdicion ? 'Formulario de edición de clase' : 'Formulario de nueva clase'}
      noValidate
    >
      {/* Business-logic error banner */}
      {errorNegocio && (
        <Alert
          type="error"
          title="Error de validación"
          message={errorNegocio}
        />
      )}

      {/* Nombre de Actividad */}
      <TextField
        id="clase-form-nombre"
        name="nombreActividad"
        label="Nombre de Actividad"
        placeholder="Ej: Spinning, CrossFit, Yoga…"
        value={nombreActividad}
        onChange={(e) => {
          setNombreActividad(e.target.value);
          if (errors.nombreActividad) setErrors((prev) => ({ ...prev, nombreActividad: undefined }));
        }}
        required
        leftIcon={Dumbbell}
        error={errors.nombreActividad}
        disabled={loading}
      />

      {/* Fecha y Hora de Inicio */}
      <DateTimeField
        id="clase-form-fecha"
        name="fechaHoraInicio"
        label="Fecha y Hora de Inicio"
        type="datetime-local"
        value={fechaHoraInicio}
        onChange={(e) => {
          setFechaHoraInicio(e.target.value);
          if (errors.fechaHoraInicio) setErrors((prev) => ({ ...prev, fechaHoraInicio: undefined }));
        }}
        required
        error={errors.fechaHoraInicio}
        disabled={loading}
        helperText="Fecha y hora exacta de inicio de la clase"
      />

      {/* Duración + Cupo Máximo side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="clase-form-duracion"
          name="duracionMinutos"
          label="Duración (minutos)"
          type="number"
          placeholder="Ej: 60"
          value={duracionMinutos}
          onChange={(e) => {
            setDuracionMinutos(e.target.value);
            if (errors.duracionMinutos) setErrors((prev) => ({ ...prev, duracionMinutos: undefined }));
          }}
          required
          leftIcon={Clock}
          error={errors.duracionMinutos}
          disabled={loading}
          helperText="Duración total de la sesión"
          min={1}
          max={480}
        />

        <TextField
          id="clase-form-cupo"
          name="cupoMaximo"
          label="Cupo Máximo"
          type="number"
          placeholder="Ej: 20"
          value={cupoMaximo}
          onChange={(e) => {
            setCupoMaximo(e.target.value);
            if (errors.cupoMaximo) setErrors((prev) => ({ ...prev, cupoMaximo: undefined }));
          }}
          required
          leftIcon={Users}
          error={errors.cupoMaximo}
          disabled={loading}
          helperText={
            isEdicion && valoresIniciales?.cupoDisponible !== undefined
              ? `Reservas confirmadas: ${valoresIniciales.cupoMaximo! - valoresIniciales.cupoDisponible}`
              : 'Número máximo de participantes'
          }
          min={isEdicion ? valoresIniciales?.cupoMaximo! - (valoresIniciales?.cupoDisponible ?? 0) : 1}
        />
      </div>

      {/* Validation summary for screen readers */}
      {Object.values(errors).some(Boolean) && (
        <div role="alert" className="flex items-start gap-2 text-xs text-fitzone-red font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Corregí los campos marcados antes de continuar.</span>
        </div>
      )}

      {/* Submit */}
      <div className="pt-2 flex justify-end gap-3">
        <Button
          type="submit"
          variant="coral"
          isLoading={loading}
          loadingText={isEdicion ? 'Guardando…' : 'Programando…'}
          fullWidth
          id="clase-form-submit"
        >
          {isEdicion ? 'Guardar Cambios' : 'Programar Clase'}
        </Button>
      </div>
    </form>
  );
}
