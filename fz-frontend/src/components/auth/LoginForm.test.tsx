import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('SCRUM-89: LoginForm Component', () => {
  it('renderiza todos los campos requeridos, botones y enlaces', () => {
    render(
      <LoginForm
        onSubmit={vi.fn()}
        onForgotPassword={vi.fn()}
        onNavigateToRegister={vi.fn()}
        showQuickRoles={true}
      />
    );

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /¿olvidaste tu contraseña\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrate acá/i })).toBeInTheDocument();
  });

  it('muestra errores de validación si se envía el formulario vacío', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/el correo electrónico es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/la contraseña es obligatoria/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('muestra error si el formato del correo es inválido', async () => {
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'correo-invalido' },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/ingrese un formato de correo válido/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('autocompleta credenciales al hacer clic en un rol rápido', () => {
    render(<LoginForm onSubmit={vi.fn()} showQuickRoles={true} />);

    // Hacemos clic en el botón de Gerente
    const gerenteBtn = screen.getByRole('button', { name: /gerente/i });
    fireEvent.click(gerenteBtn);

    expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue('gerente@fitzone.com');
    expect(screen.getByLabelText(/^contraseña/i)).toHaveValue('password123');
  });

  it('invoca onSubmit con los datos válidos al enviar', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'socio@fitzone.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        email: 'socio@fitzone.com',
        password: 'password123',
      });
    });
  });

  it('muestra estado de carga y deshabilita el botón cuando isLoading=true', () => {
    render(<LoginForm onSubmit={vi.fn()} isLoading={true} />);

    const submitBtn = screen.getByRole('button', { name: /iniciando sesión\.\.\./i });
    expect(submitBtn).toBeDisabled();
  });

  it('dispara los callbacks de navegación y olvido de contraseña', () => {
    const handleForgot = vi.fn();
    const handleRegister = vi.fn();

    render(
      <LoginForm
        onSubmit={vi.fn()}
        onForgotPassword={handleForgot}
        onNavigateToRegister={handleRegister}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /¿olvidaste tu contraseña\?/i }));
    expect(handleForgot).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /registrate acá/i }));
    expect(handleRegister).toHaveBeenCalledTimes(1);
  });
});
