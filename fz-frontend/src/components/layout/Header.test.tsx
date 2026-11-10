import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { AuthContext } from '../../context/AuthContext';
import type { AuthContextType } from '../../context/AuthContext';
import { SedeProvider } from '../../context/SedeContext';
import type { UsuarioDTO } from '../../types';

const socio: UsuarioDTO = {
  idUsuario: 1,
  authId: 'auth-1',
  dni: '00000003',
  nombre: 'Martín',
  apellido: 'Socio',
  email: 'socio@fitzone.com',
  telefono: '1100000000',
  fotoUrl: null,
  tipoUsuario: 'SOCIO',
  idSede: null,
};

function Ubicacion() {
  return <div data-testid="ubicacion">{useLocation().pathname}</div>;
}

function renderHeader(usuario: UsuarioDTO | null, logout = vi.fn()) {
  const auth: AuthContextType = {
    usuario,
    token: usuario ? 'token' : null,
    isAuthenticated: Boolean(usuario),
    isLoading: false,
    login: async () => ({ token: 'x', usuario: usuario! }),
    register: async () => ({ token: 'x', usuario: usuario! }),
    logout,
  };

  render(
    <MemoryRouter initialEntries={['/canchas']}>
      <AuthContext.Provider value={auth}>
        <SedeProvider sedes={[{ idSede: 1, nombre: 'Sede Central', aforoMaximo: 150 }]}>
          <Header />
          <Routes>
            <Route path="*" element={<Ubicacion />} />
          </Routes>
        </SedeProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return { logout };
}

describe('Header', () => {
  describe('visitante sin sesión (cliente externo)', () => {
    it('se identifica como cliente externo y no muestra ninguna señal de sesión', () => {
      renderHeader(null);

      expect(screen.getByText('Cliente externo')).toBeInTheDocument();
      expect(screen.queryByText('Invitado')).not.toBeInTheDocument();
      expect(screen.queryByText('Usuario')).not.toBeInTheDocument();
      expect(screen.queryByText('Sin sesión activa')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Menú de usuario')).not.toBeInTheDocument();
    });

    it('no ofrece cerrar sesión', () => {
      renderHeader(null);

      expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument();
    });

    it('ofrece iniciar sesión y asociarse', () => {
      renderHeader(null);

      expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hacete socio' })).toBeInTheDocument();
    });

    it('"Iniciar sesión" lleva al login', () => {
      renderHeader(null);

      fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/login');
    });

    it('"Hacete socio" lleva al alta de socio', () => {
      renderHeader(null);

      fireEvent.click(screen.getByRole('button', { name: 'Hacete socio' }));

      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/registro');
    });
  });

  describe('usuario con sesión', () => {
    it('muestra su nombre y su rol, y no los botones del visitante', () => {
      renderHeader(socio);

      expect(screen.getByText('Martín Socio')).toBeInTheDocument();
      expect(screen.getByText('SOCIO')).toBeInTheDocument();
      expect(screen.queryByText('Cliente externo')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Hacete socio' })).not.toBeInTheDocument();
    });

    it('su menú muestra el email y permite cerrar sesión', () => {
      const { logout } = renderHeader(socio);

      fireEvent.click(screen.getByTitle('Menú de usuario'));
      expect(screen.getByText('socio@fitzone.com')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('menuitem', { name: /cerrar sesión/i }));

      expect(logout).toHaveBeenCalled();
      expect(screen.getByTestId('ubicacion')).toHaveTextContent('/login');
    });
  });
});
