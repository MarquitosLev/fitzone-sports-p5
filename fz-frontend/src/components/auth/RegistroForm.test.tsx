import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegistroForm } from './RegistroForm';

describe('SCRUM-89: RegistroForm Component', () => {
  it('renderiza todos los campos de datos personales y credenciales', () => {
    render(<RegistroForm onSubmit={vi.fn()} onNavigateToLogin={vi.fn()} />);

    expect(screen.getByLabelText(/^nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^dni/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('muestra errores ante campos obligatorios vacíos', async () => {
    const handleSubmit = vi.fn();
    render(<RegistroForm onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/el apellido es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/el dni es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/el correo electrónico es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/la contraseña es obligatoria/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('valida que el DNI contenga entre 7 y 8 dígitos numéricos', async () => {
    const handleSubmit = vi.fn();
    render(<RegistroForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/^dni/i), { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByText(/el dni debe tener 7 u 8 dígitos numéricos/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('valida que las contraseñas coincidan', async () => {
    const handleSubmit = vi.fn();
    render(<RegistroForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/^contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/^confirmar contraseña/i), { target: { value: 'otraClave' } });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('asigna por defecto tipoUsuario: EXTERNO e idSede: null al enviar datos válidos', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RegistroForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/^nombre/i), { target: { value: 'Martín' } });
    fireEvent.change(screen.getByLabelText(/^apellido/i), { target: { value: 'García' } });
    fireEvent.change(screen.getByLabelText(/^dni/i), { target: { value: '35123456' } });
    fireEvent.change(screen.getByLabelText(/^teléfono/i), { target: { value: '1144556677' } });
    fireEvent.change(screen.getByLabelText(/^correo electrónico/i), { target: { value: 'martin@fitzone.com' } });
    fireEvent.change(screen.getByLabelText(/^contraseña/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/^confirmar contraseña/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        nombre: 'Martín',
        apellido: 'García',
        dni: '35123456',
        telefono: '1144556677',
        email: 'martin@fitzone.com',
        password: 'password123',
        tipoUsuario: 'EXTERNO',
        idSede: null,
      });
    });
  });

  it('dispara el callback onNavigateToLogin al pulsar el enlace', () => {
    const handleLogin = vi.fn();
    render(<RegistroForm onSubmit={vi.fn()} onNavigateToLogin={handleLogin} />);

    fireEvent.click(screen.getByRole('button', { name: /iniciá sesión acá/i }));
    expect(handleLogin).toHaveBeenCalledTimes(1);
  });
});
