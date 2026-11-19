import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { _resetMockUsersForTest } from '../services/authService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SCRUM-89: LoginPage Component & Role Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    _resetMockUsersForTest();
  });

  it('renderiza la marca FitZone Sports, formulario y modal de recuperación', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('FitZone')).toBeInTheDocument();
    expect(screen.getByText('SPORTS')).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña/i)).toBeInTheDocument();

    // Abrir modal de olvido de contraseña
    fireEvent.click(screen.getByRole('button', { name: /¿olvidaste tu contraseña\?/i }));
    expect(screen.getByText('Recuperación de Contraseña')).toBeInTheDocument();
  });

  it('autentica como SOCIO y redirige inmediatamente a /mi-qr', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'socio@fitzone.com' } });
    fireEvent.change(screen.getByLabelText(/^contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mi-qr', { replace: true });
    });
  });

  it('autentica como GERENTE y redirige a /acceso', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'gerente@fitzone.com' } });
    fireEvent.change(screen.getByLabelText(/^contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/acceso', { replace: true });
    });
  });

  it('muestra banner de error si las credenciales son incorrectas', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'socio@fitzone.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña/i), {
      target: { value: 'claveInvalida' },
    });

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/error de inicio de sesión/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // SCRUM-142: el logo y el enlace de texto deben llevar al inicio público sin sesión
  it('SCRUM-142: el logo y el enlace de texto apuntan a /canchas para usuarios sin sesión', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // El logo/marca debe ser un enlace accesible que apunte a /canchas
    const logoLink = screen.getByRole('link', { name: /ir al inicio/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/canchas');

    // El enlace de texto explícito para invitados también debe existir y apuntar a /canchas
    const enlaceInvitado = screen.getByRole('link', { name: /continuar sin iniciar sesión/i });
    expect(enlaceInvitado).toBeInTheDocument();
    expect(enlaceInvitado).toHaveAttribute('href', '/canchas');
  });
});
