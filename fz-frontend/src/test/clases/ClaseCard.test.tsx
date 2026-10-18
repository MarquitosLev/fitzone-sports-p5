/**
 * ClaseCard.test.tsx — Pruebas unitarias para ClaseCard (SCRUM-83).
 * Valida los 4 estados del botón, ventana de reserva (48h), cupo y accesibilidad.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClaseCard } from '../../components/clases/ClaseCard';
import type { ClaseGrupalDTO } from '../../types';

// Helper para generar fechas ISO relativas al momento actual
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

const mockClaseBase: ClaseGrupalDTO = {
  idClase: 1,
  sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
  nombreActividad: 'Spinning Power',
  fechaHoraInicio: generarFechaHoras(24), // 24 hs en el futuro → dentro de 48 hs
  duracionMinutos: 60,
  cupoMaximo: 20,
  cupoDisponible: 5,
};

describe('ClaseCard Component', () => {
  it('renderiza la actividad, sede y cupo disponible', () => {
    render(
      <ClaseCard
        clase={mockClaseBase}
        estaReservada={false}
        estaEnEspera={false}
        onReservar={vi.fn()}
        onAnotarEnEspera={vi.fn()}
      />
    );

    expect(screen.getByText('Spinning Power')).toBeInTheDocument();
    expect(screen.getByText('FitZone Palermo')).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 20 cupos/i)).toBeInTheDocument();
  });

  it('Estado 1: Botón "Reservar" habilitado cuando está en ventana (≤ 48 hs) y hay cupos disponibles', () => {
    const onReservar = vi.fn();
    render(
      <ClaseCard
        clase={{ ...mockClaseBase, cupoDisponible: 5 }}
        estaReservada={false}
        estaEnEspera={false}
        onReservar={onReservar}
        onAnotarEnEspera={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /reservar para spinning power/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    expect(onReservar).toHaveBeenCalledTimes(1);
  });

  it('Estado 2: Botón "Anotarme en espera" habilitado cuando está en ventana pero NO hay cupos (cupoDisponible = 0)', () => {
    const onAnotarEnEspera = vi.fn();
    render(
      <ClaseCard
        clase={{ ...mockClaseBase, cupoDisponible: 0 }}
        estaReservada={false}
        estaEnEspera={false}
        onReservar={vi.fn()}
        onAnotarEnEspera={onAnotarEnEspera}
      />
    );

    const btn = screen.getByRole('button', { name: /anotarme en espera para spinning power/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    expect(onAnotarEnEspera).toHaveBeenCalledTimes(1);
  });

  it('Estado 3: Botón deshabilitado "Ya reservada" y badge visible si el socio ya tiene reserva confirmada', () => {
    render(
      <ClaseCard
        clase={mockClaseBase}
        estaReservada={true}
        estaEnEspera={false}
        onReservar={vi.fn()}
        onAnotarEnEspera={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /ya reservada para spinning power/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();

    expect(screen.getByText('RESERVADA')).toBeInTheDocument();
  });

  it('Estado 4: Botón deshabilitado "Fuera de ventana" cuando faltan más de 48 hs para el inicio', () => {
    render(
      <ClaseCard
        clase={{
          ...mockClaseBase,
          fechaHoraInicio: generarFechaHoras(72), // 72 hs en el futuro
        }}
        estaReservada={false}
        estaEnEspera={false}
        onReservar={vi.fn()}
        onAnotarEnEspera={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /fuera de ventana para spinning power/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();

    expect(screen.getByText('+48 HS')).toBeInTheDocument();
    expect(screen.getByText(/reserva habilitada hasta 48 hs antes del inicio/i)).toBeInTheDocument();
  });

  it('Muestra badge "FINALIZADA" si la clase ya pasó', () => {
    render(
      <ClaseCard
        clase={{
          ...mockClaseBase,
          fechaHoraInicio: generarFechaHoras(-2), // 2 hs en el pasado
        }}
        estaReservada={false}
        estaEnEspera={false}
        onReservar={vi.fn()}
        onAnotarEnEspera={vi.fn()}
      />
    );

    expect(screen.getByText('FINALIZADA')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /fuera de ventana para spinning power/i });
    expect(btn).toBeDisabled();
  });

  it('Muestra el indicador de carga cuando isLoading = true', () => {
    render(
      <ClaseCard
        clase={mockClaseBase}
        estaReservada={false}
        estaEnEspera={false}
        isLoading={true}
        onReservar={vi.fn()}
        onAnotarEnEspera={vi.fn()}
      />
    );

    const btn = screen.getByRole('button', { name: /reservar para spinning power/i });
    expect(btn).toBeDisabled();
  });
});
