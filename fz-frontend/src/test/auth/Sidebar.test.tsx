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

  describe('SCRUM-141: Selector de sede unificado en Sidebar (escritorio y mobile)', () => {
    const muchasSedes: SedeDTO[] = Array.from({ length: 25 }, (_, i) => ({
      idSede: i + 1,
      nombre: `Sede #${i + 1}`,
      aforoMaximo: 120 + i * 5,
    }));

    function renderSidebarConSedes(
      usuario: UsuarioDTO | null,
      sedes: SedeDTO[] = muchasSedes,
      mobileOpen = false
    ) {
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
              <Sidebar mobileOpen={mobileOpen} />
            </SedeProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );
    }

    it('en escritorio: abre el desplegable hacia abajo y contenido dentro del ancho con scroll para 25 sedes', () => {
      renderSidebarConSedes(null, muchasSedes, false);

      const btn = screen.getByRole('button', { name: /selector de sede en navegación/i });
      fireEvent.click(btn);

      const listbox = screen.getByRole('listbox', { name: /sedes disponibles/i });
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveClass('top-full');
      expect(listbox).toHaveClass('w-full');
      expect(listbox).toHaveClass('z-50');
      expect(listbox).toHaveClass('overflow-y-auto');
      expect(listbox).toHaveClass('overscroll-contain');
      expect(listbox.className).toMatch(/max-h-(60|64)/);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(25);
      expect(screen.getByRole('option', { name: /sede #25/i })).toBeInTheDocument();

      // Simular el desplazamiento vertical del listbox antes de elegir la última sede
      fireEvent.scroll(listbox, { target: { scrollTop: 500 } });
      expect(listbox.scrollTop).toBe(500);

      // Seleccionar la última sede
      fireEvent.click(screen.getByRole('option', { name: /sede #25/i }));
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(screen.getByText('Sede #25')).toBeInTheDocument();
    });

    it('en mobile (drawer abierto): aísla las consultas al drawer móvil, simula scroll y permite seleccionar sede', () => {
      renderSidebarConSedes(null, muchasSedes, true);

      // Aislar específicamente el contenedor del drawer móvil mediante su aria-label
      const mobileDrawer = screen.getByRole('complementary', { name: 'Menú móvil' });
      const drawer = within(mobileDrawer);

      // Clic exclusivamente en el selector de sede del drawer móvil
      const btn = drawer.getByRole('button', { name: /selector de sede en navegación/i });
      fireEvent.click(btn);

      const listbox = drawer.getByRole('listbox', { name: /sedes disponibles/i });
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveClass('overflow-y-auto');

      // Simular scroll vertical en el listbox del drawer móvil
      fireEvent.scroll(listbox, { target: { scrollTop: 500 } });
      expect(listbox.scrollTop).toBe(500);

      const opcion25 = drawer.getByRole('option', { name: /sede #25/i });
      fireEvent.click(opcion25);

      expect(drawer.queryByRole('listbox')).toBeNull();
      expect(drawer.getByText('Sede #25')).toBeInTheDocument();
    });

    it('cierra el desplegable de sedes al hacer clic en el backdrop', () => {
      renderSidebarConSedes(null, muchasSedes, false);

      const btn = screen.getByRole('button', { name: /selector de sede en navegación/i });
      fireEvent.click(btn);

      expect(screen.getByRole('listbox')).toBeInTheDocument();

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

      renderSidebarConSedes(operadorFijo, muchasSedes, false);

      expect(screen.queryByRole('button', { name: /selector de sede en navegación/i })).toBeNull();
      expect(screen.getByTitle(/sede fija de operador/i)).toBeInTheDocument();
    });

    it('muestra siempre la sede asignada al personal con sede fija aunque no sea la primera de la lista', () => {
      const operadorSede2: UsuarioDTO = {
        idUsuario: 5,
        authId: 'auth-op-2',
        dni: '00000005',
        nombre: 'Recepcionista',
        apellido: 'Sede2',
        email: 'op2@fitzone.com',
        telefono: '1100000000',
        fotoUrl: null,
        tipoUsuario: 'RECEPCIONISTA',
        idSede: 2,
      };

      // muchasSedes tiene idSede 1 (Sede #1) y idSede 2 (Sede #2)
      renderSidebarConSedes(operadorSede2, muchasSedes, false);

      expect(screen.getByText('Sede #2')).toBeInTheDocument();
      expect(screen.queryByText('Sede #1')).toBeNull();
      expect(screen.getByTitle(/sede fija de operador/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /selector de sede en navegación/i })).toBeNull();
    });
  });
});
