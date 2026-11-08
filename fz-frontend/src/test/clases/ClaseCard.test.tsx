/**
 * ClaseCard.test.tsx — Pruebas unitarias para ClaseCard (SCRUM-83 / SCRUM-102).
 * El estado del botón sale de la agenda del backend (`yaReservada`, `posicionEspera`)
 * y de la ventana de reserva de 48 hs.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClaseCard } from '../../components/clases/ClaseCard';
import type { ClaseGrupalDTO } from '../../types';
import { toLocalISOString } from '../../utils/formatters';

// Helper para generar fechas ISO locales relativas al momento actual
function generarFechaHoras(horas: number): string {
  return toLocalISOString(new Date(Date.now() + horas * 60 * 60 * 1000));
}

const mockClaseBase: ClaseGrupalDTO = {
  idClase: 1,
  sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
  nombreActividad: 'Spinning Power',
  fechaHoraInicio: generarFechaHoras(24), // 24 hs en el futuro → dentro de 48 hs
  duracionMinutos: 60,
  cupoMaximo: 20,
  cupoDisponible: 5,
  yaReservada: false,
};

function renderCard(clase: Partial<ClaseGrupalDTO> = {}, props: Partial<Parameters<typeof ClaseCard>[0]> = {}) {
  const handlers = {
    onReservar: vi.fn(),
    onAnotarEnEspera: vi.fn(),
    onSalirDeEspera: vi.fn(),
  };
  render(<ClaseCard clase={{ ...mockClaseBase, ...clase }} {...handlers} {...props} />);
  return handlers;
}

describe('ClaseCard Component', () => {
  it('renderiza la actividad, sede y cupo disponible', () => {
    renderCard();

    expect(screen.getByText('Spinning Power')).toBeInTheDocument();
    expect(screen.getByText('FitZone Palermo')).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 20 cupos/i)).toBeInTheDocument();
  });

  it('muestra "Reservar" habilitado cuando está en ventana y hay cupo', () => {
    const { onReservar } = renderCard({ cupoDisponible: 5 });

    const btn = screen.getByRole('button', { name: /reservar para spinning power/i });
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    expect(onReservar).toHaveBeenCalledTimes(1);
  });

  it('muestra "Anotarme en espera" cuando está en ventana pero no hay cupo', () => {
    const { onAnotarEnEspera } = renderCard({ cupoDisponible: 0 });

    const btn = screen.getByRole('button', { name: /anotarme en espera para spinning power/i });
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    expect(onAnotarEnEspera).toHaveBeenCalledTimes(1);
  });

  it('deshabilita el botón y muestra RESERVADA cuando la agenda trae yaReservada = true', () => {
    renderCard({ yaReservada: true });

    const btn = screen.getByRole('button', { name: /ya reservada para spinning power/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText('RESERVADA')).toBeInTheDocument();
  });

  it('con posicionEspera muestra la posición y permite salir de la lista de espera', () => {
    const { onSalirDeEspera, onAnotarEnEspera } = renderCard({ cupoDisponible: 0, posicionEspera: 2 });

    expect(screen.getByText('EN ESPERA')).toBeInTheDocument();
    expect(screen.getByText(/estás 2° en la lista/i)).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /salir de la espera para spinning power/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onSalirDeEspera).toHaveBeenCalledTimes(1);
    expect(onAnotarEnEspera).not.toHaveBeenCalled();
  });

  it('sin callback de salida, el socio en espera ve el botón deshabilitado', () => {
    renderCard({ cupoDisponible: 0, posicionEspera: 1 }, { onSalirDeEspera: undefined });

    const btn = screen.getByRole('button', { name: /en lista de espera para spinning power/i });
    expect(btn).toBeDisabled();
  });

  it('posicionEspera = null se trata como fuera de la lista de espera', () => {
    renderCard({ cupoDisponible: 0, posicionEspera: null });

    expect(screen.queryByText('EN ESPERA')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /anotarme en espera/i })).toBeInTheDocument();
  });

  it('muestra "Fuera de ventana" con el aviso de 48 hs cuando faltan más de 48 hs', () => {
    renderCard({ fechaHoraInicio: generarFechaHoras(72) });

    const btn = screen.getByRole('button', { name: /fuera de ventana para spinning power/i });
    expect(btn).toBeDisabled();
    expect(screen.getByText('+48 HS')).toBeInTheDocument();
    expect(screen.getByText('Se reserva hasta 48 hs antes')).toBeInTheDocument();
  });

  it('muestra el badge "FINALIZADA" si la clase ya pasó', () => {
    renderCard({ fechaHoraInicio: generarFechaHoras(-2) });

    expect(screen.getByText('FINALIZADA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fuera de ventana para spinning power/i })).toBeDisabled();
  });

  it('deshabilita el botón mientras isLoading = true', () => {
    renderCard({}, { isLoading: true });

    expect(screen.getByRole('button', { name: /reservar para spinning power/i })).toBeDisabled();
  });

  it('muestra "Reservar" habilitado a un socio en espera si hay cupo disponible', () => {
    const { onReservar, onSalirDeEspera } = renderCard({
      cupoDisponible: 1,
      posicionEspera: 1,
    });

    expect(screen.getByText('EN ESPERA')).toBeInTheDocument();
    expect(screen.getByText(/estás 1° en la lista/i)).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /reservar para spinning power/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    expect(onReservar).toHaveBeenCalledTimes(1);
    expect(onSalirDeEspera).not.toHaveBeenCalled();
  });
});
