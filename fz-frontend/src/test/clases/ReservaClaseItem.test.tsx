/**
 * ReservaClaseItem.test.tsx — Pruebas unitarias para ReservaClaseItem (SCRUM-83).
 * Valida la regla de corte de cancelación (2 hs), ConfirmDialog y accesibilidad.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReservaClaseItem } from '../../components/clases/ReservaClaseItem';
import type { ReservaClaseDTO } from '../../types';

function generarFechaHoras(horas: number): string {
  const date = new Date(Date.now() + horas * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

const mockReservaBase: ReservaClaseDTO = {
  idReservaClase: 501,
  clase: {
    idClase: 10,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombreActividad: 'Yoga Flow',
    fechaHoraInicio: generarFechaHoras(5), // 5 hs en el futuro (> 2 hs)
    duracionMinutos: 75,
    cupoMaximo: 15,
    cupoDisponible: 2,
  },
  usuario: {
    idUsuario: 2,
    authId: 'u2',
    dni: '28456789',
    nombre: 'Valentina',
    apellido: 'García',
    email: 'v@test.com',
    telefono: '',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  estado: 'CONFIRMADA',
};

describe('ReservaClaseItem Component', () => {
  it('renderiza la actividad, sede y estado de la reserva', () => {
    render(<ReservaClaseItem reserva={mockReservaBase} onCancelar={vi.fn()} />);

    expect(screen.getByText('Yoga Flow')).toBeInTheDocument();
    expect(screen.getByText('FitZone Palermo')).toBeInTheDocument();
    expect(screen.getByText(/confirmada/i)).toBeInTheDocument();
  });

  it('permite cancelar si faltan más de 2 hs para el inicio (botón habilitado)', () => {
    render(<ReservaClaseItem reserva={mockReservaBase} onCancelar={vi.fn()} />);

    const btn = screen.getByRole('button', { name: /cancelar reserva de yoga flow/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
    expect(screen.queryByText(/cancelación disponible hasta 2 hs antes/i)).not.toBeInTheDocument();
  });

  it('abre el ConfirmDialog al hacer click en Cancelar y dispara onCancelar al confirmar', () => {
    const onCancelar = vi.fn();
    render(<ReservaClaseItem reserva={mockReservaBase} onCancelar={onCancelar} />);

    const btn = screen.getByRole('button', { name: /cancelar reserva de yoga flow/i });
    fireEvent.click(btn);

    // Debe mostrarse el modal de confirmación
    expect(screen.getByText(/cancelar reserva de clase/i)).toBeInTheDocument();

    // Confirmamos la acción en el diálogo
    const confirmBtn = screen.getByRole('button', { name: /sí, cancelar reserva/i });
    fireEvent.click(confirmBtn);

    expect(onCancelar).toHaveBeenCalledWith(501);
  });

  it('deshabilita el botón y muestra advertencia si faltan ≤ 2 hs para el inicio', () => {
    const reservaDentroDeCorte: ReservaClaseDTO = {
      ...mockReservaBase,
      clase: {
        ...mockReservaBase.clase,
        fechaHoraInicio: generarFechaHoras(1.5), // 1.5 horas en el futuro (≤ 2 hs)
      },
    };

    render(<ReservaClaseItem reserva={reservaDentroDeCorte} onCancelar={vi.fn()} />);

    const btn = screen.getByRole('button', { name: /cancelar reserva de yoga flow/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText(/cancelación disponible hasta 2 hs antes/i)).toBeInTheDocument();
  });

  it('no ofrece botón de cancelación y muestra "Sin acciones" si el estado es CANCELADA', () => {
    const reservaCancelada: ReservaClaseDTO = {
      ...mockReservaBase,
      estado: 'CANCELADA',
    };

    render(<ReservaClaseItem reserva={reservaCancelada} onCancelar={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
    expect(screen.getByText(/sin acciones/i)).toBeInTheDocument();
  });
});
