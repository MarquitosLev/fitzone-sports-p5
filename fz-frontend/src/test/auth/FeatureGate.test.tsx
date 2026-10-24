import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FeatureGate } from '../../components/auth/FeatureGate';
import { AccesoDenegado403 } from '../../components/auth/AccesoDenegado403';
import { AuthContext } from '../../context/AuthContext';
import type { AuthContextType } from '../../context/AuthContext';
import type { UsuarioDTO } from '../../types';

function renderConAuth(ui: React.ReactNode, usuario: UsuarioDTO | null) {
  const contextValue: AuthContextType = {
    usuario,
    token: usuario ? 'token-test' : null,
    isAuthenticated: Boolean(usuario),
    isLoading: false,
    login: async () => ({ token: 'mock', usuario: usuario! }),
    register: async () => ({ token: 'mock', usuario: usuario! }),
    logout: () => {},
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={contextValue}>
        {ui}
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe('SCRUM-106 / SCRUM-107: FeatureGate Component', () => {
  const usuarioGerente: UsuarioDTO = {
    idUsuario: 1,
    authId: 'auth-gerente',
    dni: '12345678',
    nombre: 'Carlos',
    apellido: 'Vidal',
    email: 'gerente@fitzone.com',
    telefono: '11223344',
    fotoUrl: null,
    tipoUsuario: 'GERENTE',
    idSede: 1,
  };

  const usuarioSocio: UsuarioDTO = {
    idUsuario: 2,
    authId: 'auth-socio',
    dni: '87654321',
    nombre: 'Martín',
    apellido: 'García',
    email: 'socio@fitzone.com',
    telefono: '11445566',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  };

  it('renderiza children si el usuario posee la prestación requerida', () => {
    renderConAuth(
      <FeatureGate prestacion="ROLES_GESTIONAR">
        <button>Panel Roles</button>
      </FeatureGate>,
      usuarioGerente
    );

    expect(screen.getByText('Panel Roles')).toBeInTheDocument();
  });

  it('no renderiza children si el usuario no posee la prestación y muestra fallback si existe', () => {
    renderConAuth(
      <FeatureGate
        prestacion="ROLES_GESTIONAR"
        fallback={<span>Sin permiso para roles</span>}
      >
        <button>Panel Roles</button>
      </FeatureGate>,
      usuarioSocio
    );

    expect(screen.queryByText('Panel Roles')).not.toBeInTheDocument();
    expect(screen.getByText('Sin permiso para roles')).toBeInTheDocument();
  });
});

describe('SCRUM-106: AccesoDenegado403 Component', () => {
  it('renderiza el código de error 403 y el botón de regreso', () => {
    renderConAuth(<AccesoDenegado403 />, null);

    expect(screen.getByText(/Error 403 · Acceso No Autorizado/i)).toBeInTheDocument();
    expect(screen.getByText(/Sección Restringida/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ir al Inicio de Sesión/i })).toBeInTheDocument();
  });
});
