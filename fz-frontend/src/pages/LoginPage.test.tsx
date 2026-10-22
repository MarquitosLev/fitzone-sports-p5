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
    localStorage.clear();
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

  it('autentica como SOCIO y redirige inmediatamente a /rol/socio (conexión SCRUM-90)', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Click en chip de acceso rápido de SOCIO
    fireEvent.click(screen.getByRole('button', { name: /socio/i }));
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/rol/socio', { replace: true });
    });
  });

  it('autentica como GERENTE y redirige a /rol/gerente (conexión SCRUM-90)', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Click en chip de acceso rápido de GERENTE
    fireEvent.click(screen.getByRole('button', { name: /gerente/i }));
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/rol/gerente', { replace: true });
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
});
