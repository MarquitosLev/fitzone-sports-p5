import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PagosPage } from './PagosPage';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider } from '../context/ToastContext';
import * as pagosService from '../services/pagosService';
import type { TransaccionDTO, ComprobanteDTO, SedeDTO } from '../types';

const mockSede: SedeDTO = {
  idSede: 1,
  nombre: 'FitZone Palermo',
  aforoMaximo: 80,
};

const mockTransacciones: TransaccionDTO[] = [
  {
    idTransaccion: 1,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas@fitzone.com',
      telefono: '11-1234-5678',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: mockSede,
    membresiaId: null,
    reservaCanchaId: 10,
    concepto: 'RESERVA_SOCIO',
    monto: 6800,
    estadoPago: 'CONFIRMADO',
    tokenTransaccionPasarela: 'tok_mock_aprobado',
    fechaHoraCreacion: '2026-10-15T14:00:00',
    fechaHoraConfirmacion: '2026-10-15T14:01:00',
    descripcion: 'Pádel · Cancha 1 (Turno 19:00 a 20:00 hs)',
  },
  {
    idTransaccion: 2,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas@fitzone.com',
      telefono: '11-1234-5678',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: mockSede,
    membresiaId: null,
    reservaCanchaId: 11,
    concepto: 'RESERVA_SOCIO',
    monto: 8000,
    estadoPago: 'RECHAZADO',
    tokenTransaccionPasarela: 'tok_mock_rechazado',
    fechaHoraCreacion: '2026-10-16T18:00:00',
    fechaHoraConfirmacion: null,
    descripcion: 'Fútbol 5 · Cancha Central (Turno 20:00 a 21:00 hs)',
    motivoRechazo: 'Límite diario de compras excedido.',
  },
  {
    idTransaccion: 3,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas@fitzone.com',
      telefono: '11-1234-5678',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: mockSede,
    membresiaId: null,
    reservaCanchaId: 12,
    concepto: 'RESERVA_SOCIO',
    monto: 7500,
    estadoPago: 'REEMBOLSADO',
    tokenTransaccionPasarela: 'tok_mock_reembolsado',
    fechaHoraCreacion: '2026-10-10T11:00:00',
    fechaHoraConfirmacion: '2026-10-10T15:00:00',
    descripcion: 'Turno Pádel Cancelado > 24hs — Reembolsado',
  },
];

const mockComprobante: ComprobanteDTO = {
  idComprobante: 1,
  transaccion: mockTransacciones[0]!,
  numeroFactura: 'FAC-0001-00000123',
  tipoComprobante: 'FACTURA_B',
  cae: '74125896301245',
  fechaVencimientoCae: '25/10/2026',
  urlDescargaPdf: '',
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
        {ui}
      </SedeProvider>
    </ToastProvider>
  );
}

describe('PagosPage (Integración RF-13, RF-14, SCRUM-86)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(pagosService, 'listarPagos').mockResolvedValue([...mockTransacciones]);
    vi.spyOn(pagosService, 'obtenerComprobantePorTransaccion').mockImplementation(async (id) =>
      id === 1 ? mockComprobante : null
    );
  });

  it('renderiza cabecera, pestañas y vista inicial de Checkout', () => {
    renderWithProviders(<PagosPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Gestión de Pagos y Comprobantes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Checkout \/ Pagar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Historial/i })).toBeInTheDocument();

    // En Checkout se muestran los ítems seleccionables
    expect(screen.getAllByText(/Pádel · Cancha 1 — Horario Pico/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Renovación Membresía · Plan Trimestral/i)).toBeInTheDocument();
  });

  it('permite cambiar a la pestaña de Historial y muestra las transacciones y métricas', async () => {
    renderWithProviders(<PagosPage />);

    const tabHistorial = screen.getByRole('button', { name: /Historial/i });
    fireEvent.click(tabHistorial);

    await waitFor(() => {
      expect(screen.getByText('Total Abonado')).toBeInTheDocument();
      expect(screen.getByText('Comprobantes AFIP')).toBeInTheDocument();
      expect(screen.getByText('Rechazados / A Revisar')).toBeInTheDocument();
    });

    // Muestra los registros
    expect(screen.getByText('Pádel · Cancha 1 (Turno 19:00 a 20:00 hs)')).toBeInTheDocument();
    expect(screen.getByText('Fútbol 5 · Cancha Central (Turno 20:00 a 21:00 hs)')).toBeInTheDocument();
  });

  it('permite filtrar el historial por REEMBOLSADO correctamente', async () => {
    renderWithProviders(<PagosPage />);

    const tabHistorial = screen.getByRole('button', { name: /Historial/i });
    fireEvent.click(tabHistorial);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reembolsados' })).toBeInTheDocument();
    });

    const botonReembolsados = screen.getByRole('button', { name: 'Reembolsados' });
    fireEvent.click(botonReembolsados);

    // Debe mostrar la transacción reembolsada y no las otras
    expect(screen.getByText(/Turno Pádel Cancelado > 24hs — Reembolsado/i)).toBeInTheDocument();
    expect(screen.queryByText('Pádel · Cancha 1 (Turno 19:00 a 20:00 hs)')).not.toBeInTheDocument();
  });

  it('procesa el pago simulado y muestra la pantalla ResultadoPago', async () => {
    const procesarPagoSpy = vi.spyOn(pagosService, 'procesarPago').mockResolvedValue({
      transaccion: mockTransacciones[0]!,
      comprobante: mockComprobante,
      aprobado: true,
      mensaje: '¡Pago acreditado exitosamente!',
    });

    renderWithProviders(<PagosPage />);

    const botonPagar = screen.getByRole('button', { name: /Pagar ·/i });
    fireEvent.click(botonPagar);

    await waitFor(() => {
      expect(procesarPagoSpy).toHaveBeenCalled();
      expect(screen.getByText('¡Pago Confirmado!')).toBeInTheDocument();
      expect(screen.getByText('FAC-0001-00000123')).toBeInTheDocument();
    });
  });

  it('maneja el flujo de pago rechazado y permite reintentar exitosamente', async () => {
    vi.spyOn(pagosService, 'procesarPago').mockResolvedValue({
      transaccion: mockTransacciones[1]!,
      comprobante: null,
      aprobado: false,
      mensaje: 'Límite diario de compras excedido.',
    });

    const reintentarSpy = vi.spyOn(pagosService, 'reintentarPago').mockResolvedValue({
      transaccion: {
        ...mockTransacciones[1]!,
        estadoPago: 'CONFIRMADO',
      },
      comprobante: mockComprobante,
      aprobado: true,
      mensaje: '¡Reintento aprobado con éxito!',
    });

    renderWithProviders(<PagosPage />);

    const botonPagar = screen.getByRole('button', { name: /Pagar ·/i });
    fireEvent.click(botonPagar);

    await waitFor(() => {
      expect(screen.getByText('Pago Rechazado')).toBeInTheDocument();
      expect(screen.getByText(/Límite diario de compras excedido/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reintentar Pago/i })).toBeInTheDocument();
    });

    const botonReintentar = screen.getByRole('button', { name: /Reintentar Pago/i });
    fireEvent.click(botonReintentar);

    await waitFor(() => {
      expect(reintentarSpy).toHaveBeenCalledWith(2, 'tok_mock_aprobado');
      expect(screen.getByText('¡Pago Confirmado!')).toBeInTheDocument();
    });
  });
});
