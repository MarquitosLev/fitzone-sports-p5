/**
 * ClaseForm.test.tsx — Unit tests for the ClaseForm component (RF-06).
 * Validates rendering, field validation, and submission behavior.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClaseForm } from '../../components/clases/ClaseForm';
import type { ClaseGrupalDTO } from '../../types';

const mockClase: ClaseGrupalDTO = {
  idClase: 1,
  sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
  nombreActividad: 'Spinning',
  fechaHoraInicio: '2026-10-20T08:00:00',
  duracionMinutos: 60,
  cupoMaximo: 20,
  cupoDisponible: 5,
};

describe('ClaseForm Component — Modo Alta', () => {
  it('renders all required fields and submit button', () => {
    render(<ClaseForm modo="alta" onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/nombre de actividad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha y hora de inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duración \(minutos\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cupo máximo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /programar clase/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting with empty fields', async () => {
    const handleSubmit = vi.fn();
    render(<ClaseForm modo="alta" onSubmit={handleSubmit} />);

    // Clear the default "60" value so duration is empty
    const duracionInput = screen.getByLabelText(/duración \(minutos\)/i);
    fireEvent.change(duracionInput, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /programar clase/i }));

    expect(await screen.findByText(/el nombre de la actividad es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/la fecha y hora de inicio son obligatorias/i)).toBeInTheDocument();
    expect(await screen.findByText(/la duración debe ser al menos 1 minuto/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('does NOT call onSubmit when cupoMaximo is 0', async () => {
    const handleSubmit = vi.fn();
    render(<ClaseForm modo="alta" onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/nombre de actividad/i), { target: { value: 'Yoga' } });
    fireEvent.change(screen.getByLabelText(/fecha y hora de inicio/i), { target: { value: '2028-10-21T10:00' } });
    fireEvent.change(screen.getByLabelText(/cupo máximo/i), { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /programar clase/i }));

    expect(await screen.findByText(/el cupo máximo debe ser al menos 1 persona/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('shows error and does NOT call onSubmit when fechaHoraInicio is in the past in modo alta', async () => {
    const handleSubmit = vi.fn();
    render(<ClaseForm modo="alta" onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/nombre de actividad/i), { target: { value: 'Spinning' } });
    fireEvent.change(screen.getByLabelText(/fecha y hora de inicio/i), { target: { value: '2020-01-01T08:00' } });

    fireEvent.click(screen.getByRole('button', { name: /programar clase/i }));

    expect(await screen.findByText(/no se puede seleccionar una fecha y hora anterior a la actual/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct payload when all fields are valid', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ClaseForm modo="alta" onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/nombre de actividad/i), { target: { value: 'CrossFit' } });
    fireEvent.change(screen.getByLabelText(/fecha y hora de inicio/i), { target: { value: '2026-10-23T07:00' } });
    fireEvent.change(screen.getByLabelText(/duración \(minutos\)/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/cupo máximo/i), { target: { value: '15' } });

    fireEvent.click(screen.getByRole('button', { name: /programar clase/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombreActividad: 'CrossFit',
          fechaHoraInicio: '2026-10-23T07:00',
          duracionMinutos: 50,
          cupoMaximo: 15,
        })
      );
      const calledPayload = handleSubmit.mock.calls[0][0];
      expect(calledPayload.idClase).toBeUndefined();
    });
  });

  it('clears field error when user corrects invalid input', async () => {
    render(<ClaseForm modo="alta" onSubmit={vi.fn()} />);

    // Trigger validation
    fireEvent.click(screen.getByRole('button', { name: /programar clase/i }));
    expect(await screen.findByText(/el nombre de la actividad es obligatorio/i)).toBeInTheDocument();

    // Fix the field
    fireEvent.change(screen.getByLabelText(/nombre de actividad/i), { target: { value: 'Yoga' } });

    await waitFor(() => {
      expect(screen.queryByText(/el nombre de la actividad es obligatorio/i)).not.toBeInTheDocument();
    });
  });

  it('displays business-logic error banner when errorNegocio prop is set', () => {
    render(
      <ClaseForm
        modo="alta"
        onSubmit={vi.fn()}
        errorNegocio="El cupo máximo no puede ser menor al número de reservas ya confirmadas"
      />
    );
    expect(
      screen.getByText(/el cupo máximo no puede ser menor al número de reservas ya confirmadas/i)
    ).toBeInTheDocument();
  });
});

describe('ClaseForm Component — Modo Edición', () => {
  it('pre-populates fields with valoresIniciales', () => {
    render(<ClaseForm modo="edicion" valoresIniciales={mockClase} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/nombre de actividad/i)).toHaveValue('Spinning');
    expect(screen.getByLabelText(/duración \(minutos\)/i)).toHaveValue(60);
    expect(screen.getByLabelText(/cupo máximo/i)).toHaveValue(20);
  });

  it('renders "Guardar Cambios" button in edicion mode', () => {
    render(<ClaseForm modo="edicion" valoresIniciales={mockClase} onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('shows reserved seats count in helper text when editing', () => {
    render(<ClaseForm modo="edicion" valoresIniciales={mockClase} onSubmit={vi.fn()} />);
    // mockClase: cupoMaximo=20, cupoDisponible=5 → 15 reservas
    expect(screen.getByText(/reservas confirmadas: 15/i)).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<ClaseForm modo="alta" onSubmit={vi.fn()} loading={true} />);
    const btn = screen.getByRole('button', { name: /programando/i });
    expect(btn).toBeDisabled();
  });
});
