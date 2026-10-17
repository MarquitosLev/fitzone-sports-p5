/**
 * CanchaForm.tsx — Formulario de alta y edición de canchas (RF-09).
 * Utiliza TextField, Select y Button de la librería base.
 */

import React, { useState, useEffect } from 'react';
import { Layers, DollarSign, Activity } from 'lucide-react';
import { TextField, Select, Button, Alert } from '../ui';
import type { SelectOption } from '../ui';
import type { CanchaDTO, CanchaFormData, TipoCancha } from '../../types';

export type CanchaFormModo = 'alta' | 'edicion';

export interface CanchaFormProps {
  modo: CanchaFormModo;
  valoresIniciales?: Partial<CanchaDTO>;
  onSubmit: (datos: CanchaFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
  errorNegocio?: string | null;
}

const OPCIONES_TIPO: SelectOption[] = [
  { value: 'PADEL', label: 'Pádel' },
  { value: 'FUTBOL_5', label: 'Fútbol 5' },
  { value: 'FUTBOL_7', label: 'Fútbol 7' },
  { value: 'TENIS', label: 'Tenis' },
  { value: 'BASQUET', label: 'Básquetbol' },
  { value: 'OTRO', label: 'Otro deporte' },
];

export function CanchaForm({
  modo,
  valoresIniciales,
  onSubmit,
  onCancel,
  loading = false,
  errorNegocio,
}: CanchaFormProps) {
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? '');
  const [tipo, setTipo] = useState<TipoCancha>(valoresIniciales?.tipo ?? 'PADEL');
  const [precioBaseHora, setPrecioBaseHora] = useState(
    valoresIniciales?.precioBaseHora ? String(valoresIniciales.precioBaseHora) : ''
  );

  const [errors, setErrors] = useState<{
    nombre?: string;
    tipo?: string;
    precioBaseHora?: string;
  }>({});

  useEffect(() => {
    if (valoresIniciales) {
      setNombre(valoresIniciales.nombre ?? '');
      setTipo(valoresIniciales.tipo ?? 'PADEL');
      setPrecioBaseHora(
        valoresIniciales.precioBaseHora !== undefined ? String(valoresIniciales.precioBaseHora) : ''
      );
    }
  }, [valoresIniciales]);

  const validate = (): boolean => {
    const errs: typeof errors = {};

    if (!nombre.trim()) {
      errs.nombre = 'El nombre de la cancha es obligatorio';
    } else if (nombre.trim().length < 3) {
      errs.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!tipo) {
      errs.tipo = 'Debe seleccionar el tipo de cancha';
    }

    const precioNum = Number(precioBaseHora);
    if (!precioBaseHora || isNaN(precioNum) || precioNum <= 0) {
      errs.precioBaseHora = 'El precio base por hora debe ser mayor a 0';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      nombre: nombre.trim(),
      tipo,
      precioBaseHora: Number(precioBaseHora),
      enMantenimiento: valoresIniciales?.enMantenimiento ?? false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errorNegocio && (
        <Alert
          type="error"
          title="Error en la operación"
          message={errorNegocio}
          className="mb-4"
        />
      )}

      {/* Nombre de la cancha */}
      <TextField
        id="cancha-nombre"
        name="nombre"
        label="Nombre de la cancha"
        placeholder="Ej: Cancha 1 — Pádel Panorámica"
        required
        value={nombre}
        onChange={(e) => {
          setNombre(e.target.value);
          if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }));
        }}
        error={errors.nombre}
        leftIcon={Layers}
        disabled={loading}
      />

      {/* Tipo de deporte / Cancha */}
      <Select
        id="cancha-tipo"
        name="tipo"
        label="Tipo de deporte / Superficie"
        required
        options={OPCIONES_TIPO}
        value={tipo}
        onChange={(e) => {
          setTipo(e.target.value as TipoCancha);
          if (errors.tipo) setErrors((prev) => ({ ...prev, tipo: undefined }));
        }}
        error={errors.tipo}
        leftIcon={Activity}
        disabled={loading}
      />

      {/* Precio base por hora */}
      <TextField
        id="cancha-precio"
        name="precioBaseHora"
        type="number"
        label="Precio base por hora (ARS)"
        placeholder="Ej: 12000"
        required
        min={1}
        step={100}
        value={precioBaseHora}
        onChange={(e) => {
          setPrecioBaseHora(e.target.value);
          if (errors.precioBaseHora) {
            setErrors((prev) => ({ ...prev, precioBaseHora: undefined }));
          }
        }}
        error={errors.precioBaseHora}
        helperText="Precio de lista para reservas sin descuentos especiales aplicados"
        leftIcon={DollarSign}
        disabled={loading}
      />

      {/* Acciones */}
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
          variant="coral"
          isLoading={loading}
        >
          {modo === 'alta' ? 'Crear Cancha' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
