import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CheckoutInvitadoPage } from './CheckoutInvitadoPage';
import { ToastProvider } from '../context/ToastContext';
import * as canchasService from '../services/canchasService';
import * as pagosService from '../services/pagosService';
import type { ReservaInvitadoDTO, TransaccionDTO } from '../types';

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
  pagada: false,
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

  it('muestra el código de reserva y el resumen del turno sin pedir sesión', async () => {
    renderPagina();

    expect(await screen.findByTestId('codigo-reserva')).toHaveTextContent(reserva.codigoReserva);
    expect(screen.getByText('Turno · Pádel 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar ·/i })).toBeInTheDocument();
  });

  it('paga con el código y muestra el comprobante', async () => {
    const transaccion = {
      idTransaccion: 9,
      monto: 10000,
      estadoPago: 'CONFIRMADO',
      fechaHoraCreacion: '2099-01-01T10:00:00',
      fechaHoraConfirmacion: '2099-01-01T10:00:01',
      usuario: { dni: '30111222', nombre: 'Ana', apellido: 'Pérez' },
      sede: { idSede: 1, nombre: 'Palermo' },
    } as unknown as TransaccionDTO;
    const pagar = vi.spyOn(pagosService, 'pagarReservaInvitado').mockResolvedValue({
      transaccion,
      comprobante: { idComprobante: 3, numeroFactura: '0001-00000003', transaccion },
      aprobado: true,
      mensaje: '¡Pago acreditado exitosamente!',
    });

    renderPagina();
    fireEvent.click(await screen.findByRole('button', { name: /Pagar ·/i }));

    await waitFor(() => {
      expect(pagar).toHaveBeenCalledWith(reserva.codigoReserva);
      expect(screen.getByText('¡Pago Confirmado!')).toBeInTheDocument();
      expect(screen.getByText('0001-00000003')).toBeInTheDocument();
    });
  });

  it('una reserva ya pagada muestra el aviso y permite descargar el comprobante', async () => {
    vi.spyOn(canchasService, 'obtenerReservaInvitado').mockResolvedValue({ ...reserva, pagada: true });

    renderPagina();

    expect(await screen.findByText('Turno pagado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descargar comprobante/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pagar ·/i })).not.toBeInTheDocument();
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
