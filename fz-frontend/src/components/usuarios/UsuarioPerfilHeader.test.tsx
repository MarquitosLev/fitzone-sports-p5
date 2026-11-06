import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UsuarioPerfilHeader } from './UsuarioPerfilHeader';
import type { UsuarioDTO } from '../../types';

describe('UsuarioPerfilHeader Component', () => {
  const mockUsuario: UsuarioDTO = {
    idUsuario: 1,
    authId: 'uuid-1',
    dni: '30123456',
    nombre: 'Lucas',
    apellido: 'Martínez',
    email: 'lucas@fitzone.com',
    telefono: '11-4567-8901',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  };

  it('renders user full name, DNI and role badge', () => {
    render(<UsuarioPerfilHeader usuario={mockUsuario} sedeNombre="FitZone Palermo" />);

    expect(screen.getByText('Lucas Martínez')).toBeInTheDocument();
    expect(screen.getByText(/DNI 30123456/i)).toBeInTheDocument();
    expect(screen.getAllByText('Socio').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('FitZone Palermo')).toBeInTheDocument();
  });

  it('renders initials avatar when no photo is provided', () => {
    render(<UsuarioPerfilHeader usuario={mockUsuario} />);
    expect(screen.getByText('LM')).toBeInTheDocument();
  });

  it('renders image when fotoUrl is provided', () => {
    const usuarioConFoto: UsuarioDTO = {
      ...mockUsuario,
      fotoUrl: 'https://example.com/avatar.jpg',
    };
    render(<UsuarioPerfilHeader usuario={usuarioConFoto} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Lucas Martínez');
  });

  it('renders custom actions when provided', () => {
    render(
      <UsuarioPerfilHeader
        usuario={mockUsuario}
        actions={<button type="button">Editar Perfil</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Editar Perfil' })).toBeInTheDocument();
  });
});
