import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UsuarioForm } from './UsuarioForm';
import { SedeProvider } from '../../context/SedeContext';
import type { SedeDTO } from '../../types';

describe('UsuarioForm Component', () => {
  const mockSedes: SedeDTO[] = [
    { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
  ];

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <SedeProvider sedes={mockSedes}>
        {ui}
      </SedeProvider>
    );
  };

  it('renders base inputs and submit button in alta mode', () => {
    renderWithProviders(<UsuarioForm modo="alta" onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dni/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rol en el sistema/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dar de alta usuario/i })).toBeInTheDocument();
  });

  it('does NOT display sede selector when role is SOCIO', () => {
    renderWithProviders(<UsuarioForm modo="alta" onSubmit={vi.fn()} />);

    // Por defecto el rol es SOCIO
    expect(screen.queryByLabelText(/asignación de sede operativa/i)).not.toBeInTheDocument();
    expect(screen.getByText(/usuario asociado a la sede actual/i)).toBeInTheDocument();
  });

  it('DOES display sede selector when role is changed to RECEPCIONISTA or GERENTE', () => {
    renderWithProviders(<UsuarioForm modo="alta" onSubmit={vi.fn()} />);

    const roleSelect = screen.getByLabelText(/rol en el sistema/i);

    // Cambiar a RECEPCIONISTA
    fireEvent.change(roleSelect, { target: { value: 'RECEPCIONISTA' } });
    expect(screen.getByLabelText(/asignación de sede operativa/i)).toBeInTheDocument();

    // Cambiar a GERENTE
    fireEvent.change(roleSelect, { target: { value: 'GERENTE' } });
    expect(screen.getByLabelText(/asignación de sede operativa/i)).toBeInTheDocument();

    // Cambiar de nuevo a EXTERNO
    fireEvent.change(roleSelect, { target: { value: 'EXTERNO' } });
    expect(screen.queryByLabelText(/asignación de sede operativa/i)).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting with empty fields', async () => {
    const handleSubmit = vi.fn();
    renderWithProviders(<UsuarioForm modo="alta" onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /dar de alta usuario/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(await screen.findByText('El apellido es obligatorio')).toBeInTheDocument();
    expect(await screen.findByText('El DNI es obligatorio')).toBeInTheDocument();
    expect(await screen.findByText('El correo electrónico es obligatorio')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<UsuarioForm modo="alta" onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Lucas' } });
    fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Martínez' } });
    fireEvent.change(screen.getByLabelText(/dni/i), { target: { value: '30123456' } });
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'lucas@fitzone.com' },
    });

    const submitBtn = screen.getByRole('button', { name: /dar de alta usuario/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Lucas',
          apellido: 'Martínez',
          dni: '30123456',
          email: 'lucas@fitzone.com',
          tipoUsuario: 'SOCIO',
          idSede: 1,
        })
      );
    });
  });
});
