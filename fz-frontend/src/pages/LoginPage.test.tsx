import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { _resetMockUsersForTest } from '../services/authService';
import * as authService from '../services/authService';

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

  // SCRUM-142 (race condition): mientras el login está en progreso, los enlaces de salida
  // quedan deshabilitados y no disparan navigate aunque la promesa resuelva después.
  it('SCRUM-142: mientras el login está cargando, el enlace "Continuar sin iniciar sesión" queda deshabilitado', async () => {
    // Arrange: espiar iniciarSesion para devolver una promesa que nunca resuelve
    // mientras el test lo controla manualmente.
    let resolverLogin!: (value: Awaited<ReturnType<typeof authService.iniciarSesion>>) => void;
    const promesaPendiente = new Promise<Awaited<ReturnType<typeof authService.iniciarSesion>>>(
      (resolve) => { resolverLogin = resolve; }
    );
    const spy = vi.spyOn(authService, 'iniciarSesion').mockReturnValue(promesaPendiente);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Act: completar el formulario y enviar para disparar el estado de carga
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'socio@fitzone.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contraseña/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Assert: el enlace debe quedar con aria-disabled mientras la promesa está pendiente
    await waitFor(() => {
      const enlace = screen.getByRole('link', { name: /continuar sin iniciar sesión/i });
      expect(enlace).toHaveAttribute('aria-disabled', 'true');
    });

    // El clic sobre el enlace deshabilitado NO debe disparar navigate
    const enlace = screen.getByRole('link', { name: /continuar sin iniciar sesión/i });
    fireEvent.click(enlace);
    expect(mockNavigate).not.toHaveBeenCalled();

    // Cleanup: resolver la promesa para que el componente termine correctamente
    await act(async () => {
      resolverLogin({
        token: 'tok_test',
        usuario: {
          idUsuario: 101,
          authId: 'mock-auth-socio-101',
          dni: '35123456',
          nombre: 'Martín',
          apellido: 'García',
          email: 'socio@fitzone.com',
          telefono: '1144556677',
          fotoUrl: null,
          tipoUsuario: 'SOCIO',
          idSede: 1,
        },
      });
      await promesaPendiente;
    });

    spy.mockRestore();
  });

  // SCRUM-142: el logo y el botón de registro también quedan bloqueados mientras el login está en progreso
  it('SCRUM-142: el logo y el enlace a registro quedan bloqueados durante la carga del login', async () => {
    let resolverLogin!: (value: Awaited<ReturnType<typeof authService.iniciarSesion>>) => void;
    const promesaPendiente = new Promise<Awaited<ReturnType<typeof authService.iniciarSesion>>>(
      (resolve) => { resolverLogin = resolve; }
    );
    const spy = vi.spyOn(authService, 'iniciarSesion').mockReturnValue(promesaPendiente);

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
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // El logo debe tener aria-disabled="true"
    await waitFor(() => {
      const logoLink = screen.getByRole('link', { name: /ir al inicio/i });
      expect(logoLink).toHaveAttribute('aria-disabled', 'true');
    });

    // Clic en el logo no navega
    const logoLink = screen.getByRole('link', { name: /ir al inicio/i });
    fireEvent.click(logoLink);
    expect(mockNavigate).not.toHaveBeenCalled();

    // Clic en "Hacete socio" mientras carga no navega a /registro
    const botonRegistro = screen.getByRole('button', { name: /hacete socio/i });
    fireEvent.click(botonRegistro);
    expect(mockNavigate).not.toHaveBeenCalledWith('/registro');

    // Cleanup
    await act(async () => {
      resolverLogin({
        token: 'tok_test',
        usuario: {
          idUsuario: 101,
          authId: 'mock-auth-socio-101',
          dni: '35123456',
          nombre: 'Martín',
          apellido: 'García',
          email: 'socio@fitzone.com',
          telefono: '1144556677',
          fotoUrl: null,
          tipoUsuario: 'SOCIO',
          idSede: 1,
        },
      });
      await promesaPendiente;
    });

    spy.mockRestore();
  });

  // SCRUM-142 (guard de desmontaje): si el componente se desmonta mientras la petición está en curso,
  // la posterior resolución de la promesa no debe invocar navigate ni actualizar estado.
  it('SCRUM-142: si el componente se desmonta mientras el login está en progreso, la resolución tardía no dispara navigate', async () => {
    let resolverLogin!: (value: Awaited<ReturnType<typeof authService.iniciarSesion>>) => void;
    const promesaPendiente = new Promise<Awaited<ReturnType<typeof authService.iniciarSesion>>>(
      (resolve) => { resolverLogin = resolve; }
    );
    const spy = vi.spyOn(authService, 'iniciarSesion').mockReturnValue(promesaPendiente);

    const { unmount } = render(
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
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // Esperar a que entre en estado de carga
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciando sesión/i })).toBeInTheDocument();
    });

    // Desmontar el componente simulando que el usuario navegó a otra pantalla
    unmount();

    // La promesa del login resuelve cuando el componente ya no existe
    await act(async () => {
      resolverLogin({
        token: 'tok_test',
        usuario: {
          idUsuario: 101,
          authId: 'mock-auth-socio-101',
          dni: '35123456',
          nombre: 'Martín',
          apellido: 'García',
          email: 'socio@fitzone.com',
          telefono: '1144556677',
          fotoUrl: null,
          tipoUsuario: 'SOCIO',
          idSede: 1,
        },
      });
      await promesaPendiente;
    });

    // No debe haber ejecutado navigate tardío
    expect(mockNavigate).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
