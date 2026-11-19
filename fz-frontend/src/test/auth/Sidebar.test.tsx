import { describe, it, expect } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
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
      ['Usuarios', 'Membresías', 'Control Acceso', 'Clases Grupales', 'Canchas', 'Pagos'],
    ],
    [
      'GERENTE',
      [
        'Usuarios',
        'Membresías',
        'Control Acceso',
        'Clases Grupales',
        'Canchas',
        'Pagos',
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

    it('permite abrir el desplegable y muestra las 25 sedes con contenedor scrolleable', () => {
      renderSidebarConSedes(null);

      const btn = screen.getAllByRole('button', { name: /selector de sede en navegación/i })[0];
      fireEvent.click(btn);

      const listboxes = screen.getAllByRole('listbox', { name: /sedes disponibles/i });
      expect(listboxes.length).toBeGreaterThan(0);
      const listbox = listboxes[0];
      expect(listbox).toHaveClass('overflow-y-auto');
      expect(listbox).toHaveClass('overscroll-contain');
      expect(listbox.className).toMatch(/max-h-(60|64)/);

      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(25);
      expect(screen.getAllByRole('option', { name: /sede #25/i })[0]).toBeInTheDocument();
    });

    it('permite seleccionar la última sede (Sede #25) y actualiza la sede activa', () => {
      renderSidebarConSedes(null);

      const btn = screen.getAllByRole('button', { name: /selector de sede en navegación/i })[0];
      fireEvent.click(btn);

      const opcion25 = screen.getAllByRole('option', { name: /sede #25/i })[0];
      fireEvent.click(opcion25);

      expect(screen.queryByRole('listbox')).toBeNull();
      expect(screen.getAllByText('Sede #25')[0]).toBeInTheDocument();
    });

    it('cierra el desplegable de sedes al hacer clic en el backdrop', () => {
      renderSidebarConSedes(null);

      const btn = screen.getAllByRole('button', { name: /selector de sede en navegación/i })[0];
      fireEvent.click(btn);

      expect(screen.getAllByRole('listbox').length).toBeGreaterThan(0);

      const backdrop = document.querySelector('.fixed.inset-0.z-40');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);

      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('no permite cambiar la sede si el operador tiene sede fija asignada', () => {
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
        idSede: 1,
      };

      renderSidebarConSedes(operadorFijo);

      expect(screen.queryByRole('button', { name: /selector de sede en navegación/i })).toBeNull();
      expect(screen.getAllByTitle(/sede fija de operador/i)[0]).toBeInTheDocument();
    });
  });
});
