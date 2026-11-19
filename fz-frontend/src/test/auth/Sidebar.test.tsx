import { describe, it, expect } from 'vitest';
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import type { AuthContextType } from '../../context/AuthContext';
import { SedeProvider } from '../../context/SedeContext';
import type { SedeDTO, TipoUsuario, UsuarioDTO } from '../../types';

function renderSidebar(tipoUsuario: TipoUsuario | null): string[] {
  const usuario: UsuarioDTO | null = tipoUsuario
    ? {
        idUsuario: 1,
        authId: 'auth-1',
        dni: '00000001',
        nombre: 'Test',
        apellido: 'Rol',
        email: 'test@fitzone.com',
        telefono: '1100000000',
        fotoUrl: null,
        tipoUsuario,
        idSede: 1,
      }
    : null;
  const auth: AuthContextType = {
    usuario,
    token: usuario ? 'token' : null,
    isAuthenticated: Boolean(usuario),
    isLoading: false,
    login: async () => ({ token: 'x', usuario: usuario! }),
    register: async () => ({ token: 'x', usuario: usuario! }),
    reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
    logout: () => {},
  };

  render(
    <MemoryRouter>
      <AuthContext.Provider value={auth}>
        <SedeProvider sedes={[{ idSede: 1, nombre: 'Sede Central', aforoMaximo: 150 }]}>
          <Sidebar />
        </SedeProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );

  const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
  return Array.from(nav.querySelectorAll('a')).map((a) => a.textContent?.trim() ?? '');
}

describe('SCRUM-92: Sidebar muestra solo los módulos del rol', () => {
  it.each<[TipoUsuario | null, string[]]>([
    [null, ['Canchas']],
    ['EXTERNO', ['Canchas']],
    ['SOCIO', ['Mi Pase QR', 'Clases Grupales', 'Canchas', 'Pagos']],
    [
      'RECEPCIONISTA',
      ['Usuarios', 'Membresías', 'Control Acceso', 'Clases Grupales', 'Canchas'],
    ],
    [
      'GERENTE',
      [
        'Usuarios',
        'Membresías',
        'Control Acceso',
        'Clases Grupales',
        'Canchas',
        'Roles y Accesos',
      ],
    ],
  ])('rol %s', (rol, esperados) => {
    expect(renderSidebar(rol)).toEqual(esperados);
  });

  it('un visitante ve "Iniciar sesión" en lugar de "Cerrar sesión"', () => {
    renderSidebar(null);
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.queryByText('Cerrar sesión')).toBeNull();
  });

  it('"Portal de Gestión" aparece solo para el personal', () => {
    renderSidebar(null);
    expect(screen.queryByText(/Portal de Gestión/)).toBeNull();
    cleanup();

    renderSidebar('SOCIO');
    expect(screen.queryByText(/Portal de Gestión/)).toBeNull();
    cleanup();

    renderSidebar('RECEPCIONISTA');
    expect(screen.getByText(/Portal de Gestión/)).toBeInTheDocument();
  });

  describe('SCRUM-140: Selector de sede en navegación (mobile / responsive)', () => {
    const muchasSedes: SedeDTO[] = Array.from({ length: 25 }, (_, i) => ({
      idSede: i + 1,
      nombre: `Sede #${i + 1}`,
      aforoMaximo: 120 + i * 5,
    }));

    function renderSidebarConSedes(usuario: UsuarioDTO | null, sedes: SedeDTO[] = muchasSedes) {
      const auth: AuthContextType = {
        usuario,
        token: usuario ? 'token' : null,
        isAuthenticated: Boolean(usuario),
        isLoading: false,
        login: async () => ({ token: 'x', usuario: usuario! }),
        register: async () => ({ token: 'x', usuario: usuario! }),
        reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
        logout: () => {},
      };

      return render(
        <MemoryRouter>
          <AuthContext.Provider value={auth}>
            <SedeProvider sedes={sedes}>
              <Sidebar mobileOpen={true} />
            </SedeProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    }

    it('en escritorio mantiene la insignia fija sin botón desplegable para no duplicar el selector de Header', () => {
      render(
        <MemoryRouter>
          <AuthContext.Provider
            value={{
              usuario: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              login: async () => ({ token: 'x', usuario: {} as UsuarioDTO }),
              register: async () => ({ token: 'x', usuario: {} as UsuarioDTO }),
              reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
              logout: () => {},
            }}
          >
            <SedeProvider sedes={muchasSedes}>
              <Sidebar mobileOpen={false} />
            </SedeProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      expect(screen.queryByRole('button', { name: /selector de sede en navegación/i })).toBeNull();
      expect(screen.getByText('Sede #1')).toBeInTheDocument();
    });

    it('permite abrir el desplegable y muestra las 25 sedes con contenedor scrolleable en el menú móvil', () => {
      renderSidebarConSedes(null);

      const menuMovil = screen.getByLabelText('Menú móvil');
      const btn = within(menuMovil).getByRole('button', { name: /selector de sede en navegación/i });
      fireEvent.click(btn);

      const listbox = within(menuMovil).getByRole('listbox', { name: /sedes disponibles/i });
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveClass('overflow-y-auto');
      expect(listbox).toHaveClass('overscroll-contain');
      expect(listbox.className).toMatch(/max-h-(60|64)/);

      const options = within(listbox).getAllByRole('option');
      expect(options).toHaveLength(25);
      expect(within(listbox).getByRole('option', { name: /sede #25/i })).toBeInTheDocument();
    });

    it('permite scrollear y seleccionar la última sede (Sede #25) actualizando la sede activa', () => {
      renderSidebarConSedes(null);

      const menuMovil = screen.getByLabelText('Menú móvil');
      const btn = within(menuMovil).getByRole('button', { name: /selector de sede en navegación/i });
      fireEvent.click(btn);

      const listbox = within(menuMovil).getByRole('listbox', { name: /sedes disponibles/i });
      fireEvent.scroll(listbox, { target: { scrollTop: 500 } });

      const opcion25 = within(listbox).getByRole('option', { name: /sede #25/i });
      fireEvent.click(opcion25);

      expect(screen.queryByRole('listbox')).toBeNull();
      expect(within(menuMovil).getByText('Sede #25')).toBeInTheDocument();
    });

    it('cierra el desplegable de sedes al hacer clic en el backdrop', () => {
      renderSidebarConSedes(null);

      const menuMovil = screen.getByLabelText('Menú móvil');
      const btn = within(menuMovil).getByRole('button', { name: /selector de sede en navegación/i });
      fireEvent.click(btn);

      expect(within(menuMovil).getByRole('listbox', { name: /sedes disponibles/i })).toBeInTheDocument();

      const backdrop = document.querySelector('.fixed.inset-0.z-40');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);

      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('muestra la sede asignada (Sede #5) con candado para operadores y no permite desplegar', () => {
      const operadorFijo: UsuarioDTO = {
        idUsuario: 2,
        authId: 'auth-op',
        dni: '00000002',
        nombre: 'Operador',
        apellido: 'Fijo',
        email: 'op@fitzone.com',
        telefono: '1100000000',
        fotoUrl: null,
        tipoUsuario: 'RECEPCIONISTA',
        idSede: 5,
      };

      renderSidebarConSedes(operadorFijo);

      expect(screen.queryByRole('button', { name: /selector de sede en navegación/i })).toBeNull();
      expect(screen.getAllByTitle(/sede fija de operador/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText('Sede #5')[0]).toBeInTheDocument();
    });

    it('SCRUM-141: al cerrar el menú móvil se cierra la lista de sedes y no reaparece al volver a abrirlo', () => {
      const auth: AuthContextType = {
        usuario: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: async () => ({ token: 'x', usuario: {} as UsuarioDTO }),
        register: async () => ({ token: 'x', usuario: {} as UsuarioDTO }),
        reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
        logout: () => {},
      };
      const sidebarCon = (mobileOpen: boolean) => (
        <MemoryRouter>
          <AuthContext.Provider value={auth}>
            <SedeProvider sedes={muchasSedes}>
              <Sidebar mobileOpen={mobileOpen} />
            </SedeProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      const { rerender } = render(sidebarCon(true));
      const drawer = within(screen.getByRole('complementary', { name: 'Menú móvil' }));
      fireEvent.click(drawer.getByRole('button', { name: /selector de sede en navegación/i }));
      expect(drawer.getByRole('listbox', { name: /sedes disponibles/i })).toBeInTheDocument();

      rerender(sidebarCon(false));
      expect(screen.queryByRole('complementary', { name: 'Menú móvil' })).toBeNull();

      rerender(sidebarCon(true));
      expect(screen.getByRole('complementary', { name: 'Menú móvil' })).toBeInTheDocument();
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });
});
