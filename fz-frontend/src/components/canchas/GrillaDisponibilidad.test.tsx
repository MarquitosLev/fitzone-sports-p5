import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GrillaDisponibilidad } from './GrillaDisponibilidad';
import type { FranjaHorariaDTO, CanchaDTO } from '../../types';

describe('GrillaDisponibilidad Component', () => {
  const mockCancha: CanchaDTO = {
    idCancha: 1,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombre: 'Cancha 1 — Pádel',
    tipo: 'PADEL',
    precioBaseHora: 10000,
    enMantenimiento: false,
  };

  const mockFranjas: FranjaHorariaDTO[] = [
    {
      id: '16:00-17:00',
      horaInicio: '16:00',
      horaFin: '17:00',
      textoTurno: '16:00 – 17:00',
      esPico: false,
      estado: 'LIBRE',
      precioEstimado: 10000,
    },
    {
      id: '17:00-18:00',
      horaInicio: '17:00',
      horaFin: '18:00',
      textoTurno: '17:00 – 18:00',
      esPico: false,
      estado: 'OCUPADO',
      precioEstimado: 10000,
    },
    {
      id: '18:00-19:00',
      horaInicio: '18:00',
      horaFin: '19:00',
      textoTurno: '18:00 – 19:00',
      esPico: false,
      estado: 'MANTENIMIENTO',
      precioEstimado: 10000,
    },
    {
      id: '19:00-20:00',
      horaInicio: '19:00',
      horaFin: '20:00',
      textoTurno: '19:00 – 20:00',
      esPico: true,
      estado: 'LIBRE',
      precioEstimado: 10000,
    },
    {
      id: '20:00-21:00',
      horaInicio: '20:00',
      horaFin: '21:00',
      textoTurno: '20:00 – 21:00',
      esPico: true,
      estado: 'RECIEN_TOMADO',
      precioEstimado: 10000,
    },
  ];

  it('renderiza franjas horarias y destaca horario pico (19 a 21 hs)', () => {
    render(
      <GrillaDisponibilidad
        franjas={mockFranjas}
        cancha={mockCancha}
        fecha="2026-10-25" // fecha futura
      />
    );

    expect(screen.getByText('16:00 – 17:00')).toBeInTheDocument();
    expect(screen.getByText('17:00 – 18:00')).toBeInTheDocument();
    expect(screen.getByText('18:00 – 19:00')).toBeInTheDocument();
    expect(screen.getByText('19:00 – 20:00')).toBeInTheDocument();

    // Franja pico
    expect(screen.getAllByText(/pico \+20%/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/franja pico: 19 a 21 hs/i)).toBeInTheDocument();
  });

  it('permite seleccionar un turno disponible y dispara onSeleccionarTurno', () => {
    const handleSeleccionar = vi.fn();
    render(
      <GrillaDisponibilidad
        franjas={mockFranjas}
        cancha={mockCancha}
        fecha="2026-10-25"
        onSeleccionarTurno={handleSeleccionar}
      />
    );

    const slotLibre = screen.getByRole('button', { name: /16:00 – 17:00/i });
    expect(slotLibre).not.toBeDisabled();
    fireEvent.click(slotLibre);

    expect(handleSeleccionar).toHaveBeenCalledWith(mockFranjas[0]);
  });

  it('deshabilita los turnos con estado OCUPADO y MANTENIMIENTO', () => {
    const handleSeleccionar = vi.fn();
    render(
      <GrillaDisponibilidad
        franjas={mockFranjas}
        cancha={mockCancha}
        fecha="2026-10-25"
        onSeleccionarTurno={handleSeleccionar}
      />
    );

    const slotOcupado = screen.getByRole('button', { name: /17:00 – 18:00/i });
    expect(slotOcupado).toBeDisabled();

    const slotMantenimiento = screen.getByRole('button', { name: /18:00 – 19:00/i });
    expect(slotMantenimiento).toBeDisabled();

    fireEvent.click(slotOcupado);
    expect(handleSeleccionar).not.toHaveBeenCalled();
  });

  it('resalta visualmente el turno seleccionado', () => {
    render(
      <GrillaDisponibilidad
        franjas={mockFranjas}
        cancha={mockCancha}
        fecha="2026-10-25"
        turnoSeleccionado={mockFranjas[3]}
      />
    );

    expect(screen.getByText('Seleccionado')).toBeInTheDocument();
  });

  it('muestra estado de carga cuando loading es true', () => {
    render(
      <GrillaDisponibilidad
        franjas={[]}
        cancha={mockCancha}
        loading={true}
      />
    );

    expect(screen.getByText(/consultando disponibilidad de turnos/i)).toBeInTheDocument();
  });
});
