import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CheckoutInvitadoPage } from './CheckoutInvitadoPage';
import { ToastProvider } from '../context/ToastContext';
import * as canchasService from '../services/canchasService';
import type { ReservaInvitadoDTO } from '../types';

const reserva: ReservaInvitadoDTO = {
  codigoReserva: '3f0c5a52-1d1f-4c7e-9b1a-2f4a8f6a9c10',
  idReservaCancha: 5,
  idCancha: 1,
  cancha: 'Pádel 1',
  tipoCancha: 'PADEL',
  idSede: 1,
  sede: 'Palermo',
  fechaHoraInicio: '2099-01-10T10:00:00',
  fechaHoraFin: '2099-01-10T11:00:00',
  precioFinal: 10000,
  cotizacion: null,
  pagada: true,
  numeroFactura: '0001-00000003',
};

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={[`/reserva-invitado/${reserva.codigoReserva}`]}>
      <ToastProvider>
        <Routes>
          <Route path="/reserva-invitado/:codigo" element={<CheckoutInvitadoPage />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('CheckoutInvitadoPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(canchasService, 'obtenerReservaInvitado').mockResolvedValue(reserva);
  });

  it('muestra el código, el turno y el comprobante sin pedir sesión ni volver a cobrar', async () => {
    renderPagina();

    expect(await screen.findByTestId('codigo-reserva')).toHaveTextContent(reserva.codigoReserva);
    expect(screen.getByText('Pádel 1')).toBeInTheDocument();
    expect(screen.getByText('Turno pagado')).toBeInTheDocument();
    expect(screen.getByText(/0001-00000003/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descargar comprobante/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pagar/i })).not.toBeInTheDocument();
  });

  it('una reserva anterior al cambio sin pago avisa y no ofrece comprobante', async () => {
    vi.spyOn(canchasService, 'obtenerReservaInvitado').mockResolvedValue({ ...reserva, pagada: false, numeroFactura: null });

    renderPagina();

    expect(await screen.findByText('Reserva sin pagar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /descargar comprobante/i })).not.toBeInTheDocument();
  });

  it('con un código inexistente muestra el error y el link a Canchas', async () => {
    vi.spyOn(canchasService, 'obtenerReservaInvitado').mockRejectedValue(
      new Error('No existe una reserva de invitado con ese código')
    );

    renderPagina();

    expect(await screen.findByText('Reserva no encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver a canchas/i })).toHaveAttribute('href', '/canchas');
  });
});
