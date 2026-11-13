import { StrictMode } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { RoleMiddleware, MENSAJE_RUTA_SIN_PERMISO } from '../../components/auth/RoleMiddleware';
import { evaluarAccesoRuta } from '../../components/auth/accesoRuta';
import { AuthContext } from '../../context/AuthContext';
import type { AuthContextType } from '../../context/AuthContext';
import { ToastProvider, useToast } from '../../context/ToastContext';
import type { TipoUsuario, UsuarioDTO } from '../../types';

function crearUsuario(tipoUsuario: TipoUsuario): UsuarioDTO {
  return {
    idUsuario: 1,
    authId: 'auth-1',
    dni: '00000001',
    nombre: 'Test',
    apellido: 'Rol',
    email: `${tipoUsuario.toLowerCase()}@fitzone.com`,
    telefono: '1100000000',
    fotoUrl: null,
    tipoUsuario,
    idSede: 1,
  };
}

function MostrarUbicacion() {
  const location = useLocation();
  return <div data-testid="ubicacion">{location.pathname + location.search}</div>;
}

function ListaToasts() {
  const { toasts } = useToast();
  return (
    <ul>
      {toasts.map((t) => (
        <li key={t.id}>{t.message}</li>
      ))}
    </ul>
  );
}

function renderEnRuta(ruta: string, usuario: UsuarioDTO | null, isLoading = false) {
  const auth: AuthContextType = {
    usuario,
    token: usuario ? 'token-test' : null,
    isAuthenticated: Boolean(usuario),
    isLoading,
    login: async () => ({ token: 'x', usuario: usuario! }),
    register: async () => ({ token: 'x', usuario: usuario! }),
    reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
    logout: () => {},
  };

  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[ruta]}>
        <ToastProvider>
          <AuthContext.Provider value={auth}>
            <ListaToasts />
            <Routes>
              <Route path="/" element={<MostrarUbicacion />} />
              <Route path="/login" element={<MostrarUbicacion />} />
              <Route element={<RoleMiddleware prestacionRequerida="USUARIOS_ADMIN" />}>
                <Route path="/usuarios" element={<div>Pantalla Usuarios</div>} />
              </Route>
              <Route element={<RoleMiddleware allowedRoles={['GERENTE']} />}>
                <Route path="/admin/roles" element={<div>Panel Gerente</div>} />
              </Route>
              <Route element={<RoleMiddleware prestacionRequerida="CLASES_VER" invitarAsociarse />}>
                <Route path="/clases" element={<div>Agenda de clases</div>} />
              </Route>
            </Routes>
          </AuthContext.Provider>
        </ToastProvider>
      </MemoryRouter>
    </StrictMode>
  );
}

describe('SCRUM-92: RoleMiddleware (RutaProtegida)', () => {
  it('deja entrar al rol con la prestación requerida', () => {
    renderEnRuta('/usuarios', crearUsuario('RECEPCIONISTA'));
    expect(screen.getByText('Pantalla Usuarios')).toBeInTheDocument();
  });

  it('sin sesión manda a /login con returnTo', () => {
    renderEnRuta('/usuarios', null);
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/login?returnTo=%2Fusuarios');
  });

  it('un socio que entra por URL a /usuarios vuelve a su inicio con aviso de sin permiso', async () => {
    renderEnRuta('/usuarios', crearUsuario('SOCIO'));
    expect(screen.queryByText('Pantalla Usuarios')).toBeNull();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/$/);
    expect(await screen.findAllByText(MENSAJE_RUTA_SIN_PERMISO)).toHaveLength(1);
  });

  it('un recepcionista que entra por URL al panel del gerente vuelve a su inicio', () => {
    renderEnRuta('/admin/roles', crearUsuario('RECEPCIONISTA'));
    expect(screen.queryByText('Panel Gerente')).toBeNull();
    expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/$/);
  });

  it('mientras valida la sesión muestra un spinner y no el contenido', () => {
    renderEnRuta('/usuarios', crearUsuario('GERENTE'), true);
    expect(screen.getByRole('status', { name: 'Verificando sesión...' })).toBeInTheDocument();
    expect(screen.queryByText('Pantalla Usuarios')).toBeNull();
  });

  it('sin sesión y con invitarAsociarse muestra la invitación a asociarse en vez de redirigir al login', () => {
    renderEnRuta('/clases', null);

    expect(screen.getByText('Esto es para socios')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hacete socio' })).toHaveAttribute('href', '/registro');
    expect(screen.getByRole('link', { name: 'Ya soy socio' })).toHaveAttribute('href', '/login?returnTo=%2Fclases');
    expect(screen.queryByText('Agenda de clases')).not.toBeInTheDocument();
  });

  it('con invitarAsociarse, un socio con sesión entra a la pantalla', () => {
    renderEnRuta('/clases', crearUsuario('SOCIO'));

    expect(screen.getByText('Agenda de clases')).toBeInTheDocument();
  });
});

describe('SCRUM-92: evaluarAccesoRuta', () => {
  it('sin rol pide login', () => {
    expect(evaluarAccesoRuta({ tipoUsuario: null, prestacionesUsuario: [] })).toBe('REQUIERE_LOGIN');
  });

  it('rechaza un rol fuera de allowedRoles', () => {
    expect(
      evaluarAccesoRuta({ tipoUsuario: 'SOCIO', prestacionesUsuario: [], allowedRoles: ['GERENTE'] })
    ).toBe('SIN_PERMISO');
  });

  it('rechaza si falta la prestación y permite si la tiene', () => {
    expect(
      evaluarAccesoRuta({
        tipoUsuario: 'EXTERNO',
        prestacionesUsuario: ['CANCHAS_VER'],
        prestacionRequerida: 'PAGOS_VER_HISTORIAL',
      })
    ).toBe('SIN_PERMISO');
    expect(
      evaluarAccesoRuta({
        tipoUsuario: 'SOCIO',
        prestacionesUsuario: ['PAGOS_VER_HISTORIAL'],
        prestacionRequerida: 'PAGOS_VER_HISTORIAL',
      })
    ).toBe('PERMITIDO');
  });
});
