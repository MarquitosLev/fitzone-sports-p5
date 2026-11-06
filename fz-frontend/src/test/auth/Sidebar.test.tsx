import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import type { AuthContextType } from '../../context/AuthContext';
import { SedeProvider } from '../../context/SedeContext';
import type { TipoUsuario, UsuarioDTO } from '../../types';

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
    ['EXTERNO', ['Canchas', 'Pagos']],
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
});
