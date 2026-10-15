import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QRCodePass } from './QRCodePass';

describe('QRCodePass Component', () => {
  const mockUser = {
    name: 'Juan Perez',
    memberId: 'FZ-9999',
    plan: 'Pase Libre Anual',
    validUntil: '31/12/2026',
  };

  it('renders user information correctly', () => {
    render(<QRCodePass user={mockUser} sede="Sede Belgrano" />);

    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('Socio #FZ-9999')).toBeInTheDocument();
    expect(screen.getByText('Sede Belgrano')).toBeInTheDocument();
    expect(screen.getByText(/Pase Libre Anual/i)).toBeInTheDocument();
    expect(screen.getByText('ACTIVO')).toBeInTheDocument();
  });

  it('renders expired notice when isExpired is true', () => {
    render(<QRCodePass user={mockUser} isExpired={true} />);

    expect(screen.getByText('VENCIDA')).toBeInTheDocument();
    expect(screen.getByText('Membresía Vencida')).toBeInTheDocument();
    expect(screen.getByText('Regularizá tu cuota para reactivar tu acceso')).toBeInTheDocument();
  });

  it('blocks QR display and prompts for token when requireSignedToken is true and token is missing', () => {
    render(<QRCodePass user={mockUser} requireSignedToken={true} />);

    expect(screen.getByText('Token Requerido')).toBeInTheDocument();
    expect(
      screen.getByText('Este pase exige un token firmado por el backend para emitir el código QR de acceso.')
    ).toBeInTheDocument();
  });

  it('renders QR normally when signed token is provided', () => {
    render(
      <QRCodePass
        user={mockUser}
        requireSignedToken={true}
        token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fitzone-signed-token"
      />
    );

    expect(screen.queryByText('Token Requerido')).not.toBeInTheDocument();
    expect(screen.getByText('Validado Backend')).toBeInTheDocument();
  });
});
