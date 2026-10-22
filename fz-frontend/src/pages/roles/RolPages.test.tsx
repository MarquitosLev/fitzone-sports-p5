import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  SocioRolPage,
  ExternoRolPage,
  RecepcionistaRolPage,
  GerenteRolPage,
  RolNav,
} from './index';

describe('SCRUM-90: Pantallas base por rol y navegación', () => {
  it('RolNav renderiza los enlaces a las 4 rutas de rol', () => {
    render(
      <MemoryRouter initialEntries={['/rol/socio']}>
        <RolNav />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /socio/i })).toHaveAttribute('href', '/rol/socio');
    expect(screen.getByRole('link', { name: /externo/i })).toHaveAttribute('href', '/rol/externo');
    expect(screen.getByRole('link', { name: /recepcionista/i })).toHaveAttribute('href', '/rol/recepcionista');
    expect(screen.getByRole('link', { name: /gerente/i })).toHaveAttribute('href', '/rol/gerente');
  });

  it('SocioRolPage renderiza "Soy SOCIO" y el badge correspondiente', () => {
    render(
      <MemoryRouter initialEntries={['/rol/socio']}>
        <SocioRolPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soy socio/i })).toBeInTheDocument();
    expect(screen.getAllByText('Socio').length).toBeGreaterThanOrEqual(2);
  });

  it('ExternoRolPage renderiza "Soy EXTERNO" y el badge correspondiente', () => {
    render(
      <MemoryRouter initialEntries={['/rol/externo']}>
        <ExternoRolPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soy externo/i })).toBeInTheDocument();
    expect(screen.getAllByText('Externo').length).toBeGreaterThanOrEqual(2);
  });

  it('RecepcionistaRolPage renderiza "Soy RECEPCIONISTA" y el badge correspondiente', () => {
    render(
      <MemoryRouter initialEntries={['/rol/recepcionista']}>
        <RecepcionistaRolPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soy recepcionista/i })).toBeInTheDocument();
    expect(screen.getAllByText('Recepcionista').length).toBeGreaterThanOrEqual(2);
  });

  it('GerenteRolPage renderiza "Soy GERENTE" y el badge correspondiente', () => {
    render(
      <MemoryRouter initialEntries={['/rol/gerente']}>
        <GerenteRolPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soy gerente/i })).toBeInTheDocument();
    expect(screen.getAllByText('Gerente').length).toBeGreaterThanOrEqual(2);
  });
});
