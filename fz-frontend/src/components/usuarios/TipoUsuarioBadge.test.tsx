import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TipoUsuarioBadge } from './TipoUsuarioBadge';

describe('TipoUsuarioBadge Component', () => {
  it('renders correctly for SOCIO', () => {
    render(<TipoUsuarioBadge tipoUsuario="SOCIO" />);
    expect(screen.getByText('Socio')).toBeInTheDocument();
  });

  it('renders correctly for EXTERNO', () => {
    render(<TipoUsuarioBadge tipoUsuario="EXTERNO" />);
    expect(screen.getByText('Externo')).toBeInTheDocument();
  });

  it('renders correctly for RECEPCIONISTA', () => {
    render(<TipoUsuarioBadge tipoUsuario="RECEPCIONISTA" />);
    expect(screen.getByText('Recepcionista')).toBeInTheDocument();
  });

  it('renders correctly for GERENTE', () => {
    render(<TipoUsuarioBadge tipoUsuario="GERENTE" />);
    expect(screen.getByText('Gerente')).toBeInTheDocument();
  });

  it('supports custom label override', () => {
    render(<TipoUsuarioBadge tipoUsuario="SOCIO" label="Socio VIP" />);
    expect(screen.getByText('Socio VIP')).toBeInTheDocument();
  });
});
