import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MisReservasView } from './MisReservasView';
import { ToastProvider } from '../../context/ToastContext';
import * as canchasService from '../../services/canchasService';
import * as pagosService from '../../services/pagosService';
import type { ReservaCanchaDTO } from '../../types';

// Turnos en el futuro lejano: el estado no depende del día en que corra el test
const reserva = (id: number, retencionVencida: boolean): ReservaCanchaDTO =>
  ({
    idReservaCancha: id,
    cancha: { idCancha: 1, nombre: `Cancha ${id}`, tipo: 'PADEL', sede: { nombre: 'FitZone Palermo' } },
    usuario: { idUsuario: 1 },
    fechaHoraInicio: '2099-01-10T19:00:00',
    fechaHoraFin: '2099-01-10T20:00:00',
    precioFinal: 6800,
    retencionVencida,
  }) as unknown as ReservaCanchaDTO;

describe('MisReservasView — retención de reservas sin pagar (ADR-019)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(pagosService, 'listarMisPagos').mockResolvedValue([]);
  });

  it('una reserva sin pagar con la retención vencida se muestra como Vencida y sin botón de pago', async () => {
    vi.spyOn(canchasService, 'listarMisReservas').mockResolvedValue([reserva(1, true)]);

    render(
      <MemoryRouter>
        <ToastProvider>
          <MisReservasView />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/El turno se liberó/)).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ir a Pagar/ })).not.toBeInTheDocument();
  });

  it('una reserva sin pagar dentro de la retención sigue pendiente y se puede pagar', async () => {
    vi.spyOn(canchasService, 'listarMisReservas').mockResolvedValue([reserva(2, false)]);

    render(
      <MemoryRouter>
        <ToastProvider>
          <MisReservasView />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: /Ir a Pagar/ })).toBeInTheDocument();
    expect(screen.queryByText('Vencida')).not.toBeInTheDocument();
  });
});
