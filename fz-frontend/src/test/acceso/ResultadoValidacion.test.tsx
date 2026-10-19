/**
 * ResultadoValidacion.test.tsx — Pruebas unitarias para el componente de resolución de accesos (RF-04, RN-01, RF-05).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultadoValidacion } from '../../components/acceso/ResultadoValidacion';
import type { UsuarioDTO, AccesoDTO } from '../../types';

const mockUsuario: UsuarioDTO = {
  idUsuario: 1,
  authId: 'uuid-1',
  dni: '30123456',
  nombre: 'Martín',
  apellido: 'García',
  email: 'martin@fitzone.com',
  telefono: '11-4567-8901',
  fotoUrl: null,
  tipoUsuario: 'SOCIO',
  idSede: 1,
};

const mockAcceso: AccesoDTO = {
  idAcceso: 99,
  usuario: mockUsuario,
  sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
  reservaClase: null,
  reservaCancha: null,
  fechaHoraIngreso: '2026-10-18T10:15:00',
  fechaHoraEgreso: null,
};

describe('ResultadoValidacion Component', () => {
  it('muestra el estado vacío cuando no hay resultado previo', () => {
    render(<ResultadoValidacion resultado={null} />);

    expect(screen.getByTestId('resultado-validacion-vacio')).toBeInTheDocument();
    expect(screen.getByText(/Esperando escaneo/i)).toBeInTheDocument();
  });

  it('muestra el estado aprobado con molinete habilitado y ficha del socio', () => {
    render(
      <ResultadoValidacion
        resultado={{
          aprobado: true,
          mensaje: 'Ingreso confirmado',
          usuario: mockUsuario,
          acceso: mockAcceso,
        }}
      />
    );

    expect(screen.getByTestId('resultado-validacion-aprobado')).toBeInTheDocument();
    expect(screen.getByText(/MOLINETE HABILITADO/i)).toBeInTheDocument();
    expect(screen.getByText('Pase Autorizado')).toBeInTheDocument();
    expect(screen.getByText('Martín García')).toBeInTheDocument();
    expect(screen.getByText('10:15')).toBeInTheDocument();
  });

  it('traduce correctamente el motivo de rechazo QR_VENCIDO', () => {
    render(
      <ResultadoValidacion
        resultado={{
          aprobado: false,
          motivoRechazo: 'QR_VENCIDO',
          mensaje: 'Token inválido',
        }}
      />
    );

    expect(screen.getByTestId('resultado-validacion-rechazado')).toBeInTheDocument();
    expect(screen.getByTestId('resultado-validacion-motivo')).toHaveTextContent('QR_VENCIDO');
    expect(screen.getByText('Pase QR Expirado')).toBeInTheDocument();
    expect(screen.getByText(/abra su app móvil y genere un nuevo código/i)).toBeInTheDocument();
  });

  it('traduce correctamente el motivo de rechazo MEMBRESIA_INACTIVA', () => {
    render(
      <ResultadoValidacion
        resultado={{
          aprobado: false,
          motivoRechazo: 'MEMBRESIA_INACTIVA',
        }}
      />
    );

    expect(screen.getByTestId('resultado-validacion-motivo')).toHaveTextContent('MEMBRESIA_INACTIVA');
    expect(screen.getByText('Membresía Inactiva / Morosa')).toBeInTheDocument();
    expect(screen.getByText(/regularizar su cuota mensual en recepción/i)).toBeInTheDocument();
  });

  it('traduce correctamente el motivo de rechazo YA_INGRESADO (RN-01)', () => {
    render(
      <ResultadoValidacion
        resultado={{
          aprobado: false,
          motivoRechazo: 'YA_INGRESADO',
        }}
      />
    );

    expect(screen.getByTestId('resultado-validacion-motivo')).toHaveTextContent('YA_INGRESADO');
    expect(screen.getByText('Ingreso Previo Activo (RN-01)')).toBeInTheDocument();
    expect(screen.getByText(/olvidó registrar su salida del club/i)).toBeInTheDocument();
  });

  it('traduce correctamente el motivo de rechazo AFORO_COMPLETO (RF-05)', () => {
    render(
      <ResultadoValidacion
        resultado={{
          aprobado: false,
          motivoRechazo: 'AFORO_COMPLETO',
        }}
      />
    );

    expect(screen.getByTestId('resultado-validacion-motivo')).toHaveTextContent('AFORO_COMPLETO');
    expect(screen.getByText('Aforo Completo en Sede (RF-05)')).toBeInTheDocument();
    expect(screen.getByText(/aguardar a que se registren egresos/i)).toBeInTheDocument();
  });

  it('permite cerrar o limpiar el resultado con onLimpiar', () => {
    const onLimpiarMock = vi.fn();
    render(
      <ResultadoValidacion
        resultado={{
          aprobado: true,
          acceso: mockAcceso,
        }}
        onLimpiar={onLimpiarMock}
      />
    );

    const btnCerrar = screen.getByRole('button', { name: /Cerrar resultado/i });
    fireEvent.click(btnCerrar);

    expect(onLimpiarMock).toHaveBeenCalledTimes(1);
  });
});
