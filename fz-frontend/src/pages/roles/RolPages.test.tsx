import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  SocioRolPage,
  ExternoRolPage,
  RecepcionistaRolPage,
  GerenteRolPage,
  RolNav,
} from './index';
import { AuthProvider } from '../../context/AuthContext';

describe('SCRUM-90: Pantallas base por rol y navegación', () => {
  it('RolNav renderiza los enlaces a las 4 rutas de rol y el botón de cerrar sesión', () => {
    render(
      <MemoryRouter initialEntries={['/rol/socio']}>
        <AuthProvider>
          <RolNav />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /socio/i })).toHaveAttribute('href', '/rol/socio');
    expect(screen.getByRole('link', { name: /externo/i })).toHaveAttribute('href', '/rol/externo');
    expect(screen.getByRole('link', { name: /recepcionista/i })).toHaveAttribute('href', '/rol/recepcionista');
    expect(screen.getByRole('link', { name: /gerente/i })).toHaveAttribute('href', '/rol/gerente');
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('SocioRolPage renderiza "Soy SOCIO" y el badge correspondiente', () => {
    render(
      <MemoryRouter initialEntries={['/rol/socio']}>
        <AuthProvider>
          <SocioRolPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soy socio/i })).toBeInTheDocument();
    expect(screen.getAllByText('Socio').length).toBeGreaterThanOrEqual(2);
  });

  it('ExternoRolPage renderiza "Soy EXTERNO" y el badge correspondiente', () => {
    render(
      <MemoryRouter initialEntries={['/rol/externo']}>
        <AuthProvider>
          <ExternoRolPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soy externo/i })).toBeInTheDocument();
    expect(screen.getAllByText('Externo').length).toBeGreaterThanOrEqual(2);
  });

  it('RecepcionistaRolPage renderiza "Soy RECEPCIONISTA" y el badge correspondiente', () => {
    render(
      <MemoryRouter initialEntries={['/rol/recepcionista']}>
        <AuthProvider>
          <RecepcionistaRolPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soy recepcionista/i })).toBeInTheDocument();
    expect(screen.getAllByText('Recepcionista').length).toBeGreaterThanOrEqual(2);
  });

  it('GerenteRolPage renderiza "Soy GERENTE" y el badge correspondiente', () => {
    render(
      <MemoryRouter initialEntries={['/rol/gerente']}>
        <AuthProvider>
          <GerenteRolPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soy gerente/i })).toBeInTheDocument();
    expect(screen.getAllByText('Gerente').length).toBeGreaterThanOrEqual(2);
  });

  it('permite cerrar sesión desde RolNav y dispara el logout', () => {
    render(
      <MemoryRouter initialEntries={['/rol/socio']}>
        <AuthProvider>
          <RolNav />
        </AuthProvider>
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: /cerrar sesión/i });
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
  });
});
