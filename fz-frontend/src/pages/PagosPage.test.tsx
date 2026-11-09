import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PagosPage } from './PagosPage';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider } from '../context/ToastContext';
import * as pagosService from '../services/pagosService';
import * as canchasService from '../services/canchasService';
import * as membresiasService from '../services/membresiasService';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../context/AuthContext';
import type {
  TransaccionDTO,
  ComprobanteDTO,
  SedeDTO,
  UsuarioDTO,
  MembresiaDTO,
  ReservaCanchaDTO,
} from '../types';

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

const socio: UsuarioDTO = {
  idUsuario: 2,
  authId: 'auth-2',
  dni: '30000000',
  nombre: 'Socio',
  apellido: 'Prueba',
  email: 'socio@fitzone.com',
  telefono: '1100000000',
  fotoUrl: null,
  tipoUsuario: 'SOCIO',
  idSede: null,
};

const sesionSocio: AuthContextType = {
  usuario: socio,
  token: 'token',
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({ token: 'token', usuario: socio }),
  register: async () => ({ token: 'token', usuario: socio }),
  logout: () => {},
};

/** Turno futuro sin pagar: aparece en el checkout. */
const reservaPendiente = {
  idReservaCancha: 30,
  cancha: { idCancha: 1, nombre: 'Pádel · Cancha 1', tipo: 'PADEL', sede: mockSede },
  fechaHoraInicio: '2099-01-10T19:00:00',
  fechaHoraFin: '2099-01-10T20:00:00',
  precioFinal: 6800,
} as unknown as ReservaCanchaDTO;

const membresiaSocio = {
  idMembresia: 201,
  usuario: socio,
  plan: { idPlan: 2, nombre: 'Plan Trimestral', precioBase: 38000, duracionMeses: 3 },
  fechaInicio: '2026-11-01',
  fechaVencimiento: '2027-02-01',
  fechaCancelacion: null,
  estado: 'ACTIVO',
} as MembresiaDTO;

const cotizacionTurno = {
  precioBase: 8000,
  esPico: false,
  recargoPico: 0,
  porcentajeRecargoPico: 0,
  descuentoSocio: 1200,
  porcentajeDescuentoSocio: 15,
  esSocio: true,
  total: 6800,
};

function renderWithProviders(ui: React.ReactElement) {
  // MemoryRouter: la página lee ?reserva= para preseleccionar el ítem a pagar
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthContext.Provider value={sesionSocio}>
          <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
            {ui}
          </SedeProvider>
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('PagosPage (Integración RF-13, RF-14, SCRUM-86)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(pagosService, 'listarMisPagos').mockResolvedValue([...mockTransacciones]);
    vi.spyOn(canchasService, 'listarMisReservas').mockResolvedValue([reservaPendiente]);
    vi.spyOn(membresiasService, 'obtenerMembresiaPorUsuario').mockResolvedValue(membresiaSocio);
    vi.spyOn(canchasService, 'cotizarTurno').mockResolvedValue(cotizacionTurno);
    vi.spyOn(pagosService, 'obtenerComprobantePorTransaccion').mockImplementation(async (id) =>
      id === 1 ? mockComprobante : null
    );
  });

  it('renderiza cabecera, pestañas y vista inicial de Checkout', async () => {
    renderWithProviders(<PagosPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Gestión de Pagos y Comprobantes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Checkout \/ Pagar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Historial/i })).toBeInTheDocument();

    // En Checkout se muestran lo que el socio tiene pendiente de pago
    expect((await screen.findAllByText(/Turno · Pádel · Cancha 1/i)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Renovación Membresía · Plan Trimestral/i)).toBeInTheDocument();
  });

  it('el pago de una cancha muestra el desglose de la cotización del backend (SCRUM-120)', async () => {
    renderWithProviders(<PagosPage />);

    expect(await screen.findByText(/desglose del turno/i)).toBeInTheDocument();
    expect(screen.queryByText(/cuota membresía/i)).not.toBeInTheDocument();
    expect(canchasService.cotizarTurno).toHaveBeenCalledWith(1, '19:00', true, '2099-01-10', '20:00');
  });

  it('si la cotización no coincide con el precio congelado, muestra el resumen del turno', async () => {
    vi.spyOn(canchasService, 'cotizarTurno').mockResolvedValue({ ...cotizacionTurno, total: 8000 });
    renderWithProviders(<PagosPage />);

    expect(await screen.findByText(/resumen del turno/i)).toBeInTheDocument();
    expect(screen.queryByText(/desglose del turno/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cuota membresía/i)).not.toBeInTheDocument();
  });

  it('permite cambiar a la pestaña de Historial y muestra las transacciones y métricas', async () => {
    renderWithProviders(<PagosPage />);

    const tabHistorial = screen.getByRole('button', { name: /Historial/i });
    fireEvent.click(tabHistorial);

    await waitFor(() => {
      expect(screen.getByText('Total Abonado')).toBeInTheDocument();
      expect(screen.getByText('Comprobantes')).toBeInTheDocument();
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

  it('procesa el pago y muestra la pantalla ResultadoPago', async () => {
    const procesarPagoSpy = vi.spyOn(pagosService, 'procesarPago').mockResolvedValue({
      transaccion: mockTransacciones[0]!,
      comprobante: mockComprobante,
      aprobado: true,
      mensaje: '¡Pago acreditado exitosamente!',
    });

    renderWithProviders(<PagosPage />);

    const botonPagar = await screen.findByRole('button', { name: /Pagar ·/i });
    fireEvent.click(botonPagar);

    await waitFor(() => {
      expect(procesarPagoSpy).toHaveBeenCalled();
      expect(screen.getByText('¡Pago Confirmado!')).toBeInTheDocument();
      expect(screen.getByText('FAC-0001-00000123')).toBeInTheDocument();
    });
  });

  it('si el backend rechaza el pago permite reintentarlo', async () => {
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

    const botonPagar = await screen.findByRole('button', { name: /Pagar ·/i });
    fireEvent.click(botonPagar);

    await waitFor(() => {
      expect(screen.getByText('Pago Rechazado')).toBeInTheDocument();
      expect(screen.getByText(/Límite diario de compras excedido/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reintentar Pago/i })).toBeInTheDocument();
    });

    const botonReintentar = screen.getByRole('button', { name: /Reintentar Pago/i });
    fireEvent.click(botonReintentar);

    await waitFor(() => {
      expect(reintentarSpy).toHaveBeenCalledWith(2);
      expect(screen.getByText('¡Pago Confirmado!')).toBeInTheDocument();
    });
  });

  it('una membresía vencida muestra hasta cuándo queda vigente después de pagar (SCRUM-122)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 6, 10, 0, 0));
    vi.spyOn(membresiasService, 'obtenerMembresiaPorUsuario').mockResolvedValue({
      ...membresiaSocio,
      plan: { ...membresiaSocio.plan, duracionMeses: 1 },
      fechaVencimiento: '2026-10-22',
      estado: 'VENCIDO',
    });

    renderWithProviders(<PagosPage />);
    fireEvent.click(await screen.findByText(/Renovación Membresía · Plan Trimestral/i));

    expect(screen.getAllByText(/06\/12\/2026/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/2026-10-22/)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('no ofrece pagar una membresía cancelada', async () => {
    vi.spyOn(membresiasService, 'obtenerMembresiaPorUsuario').mockResolvedValue({
      ...membresiaSocio,
      estado: 'CANCELADO',
    });

    renderWithProviders(<PagosPage />);
    expect((await screen.findAllByText(/Turno · Pádel · Cancha 1/i)).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Renovación Membresía/i)).not.toBeInTheDocument();
  });

  it('SCRUM-121: un pago rechazado no ofrece reintentar ni cuenta en métricas si ya existe una transacción confirmada para esa reserva', async () => {
    // Transacción 2 rechazada para reservaCanchaId: 11
    // Nueva transacción 4 confirmada para esa misma reserva 11
    const transaccionAprobadaReintento: TransaccionDTO = {
      idTransaccion: 4,
      usuario: socio,
      sede: mockSede,
      membresiaId: null,
      reservaCanchaId: 11,
      concepto: 'RESERVA_SOCIO',
      monto: 8000,
      estadoPago: 'CONFIRMADO',
      tokenTransaccionPasarela: 'tok_reintento_ok',
      fechaHoraCreacion: '2026-10-16T18:05:00',
      fechaHoraConfirmacion: '2026-10-16T18:06:00',
      descripcion: 'Fútbol 5 · Cancha Central (Turno 20:00 a 21:00 hs)',
    };

    vi.spyOn(pagosService, 'listarMisPagos').mockResolvedValue([
      mockTransacciones[0]!, // Transacción 1 (reserva 10, CONFIRMADO)
      mockTransacciones[1]!, // Transacción 2 (reserva 11, RECHAZADO)
      transaccionAprobadaReintento, // Transacción 4 (reserva 11, CONFIRMADO)
    ]);

    renderWithProviders(<PagosPage />);

    const tabHistorial = screen.getByRole('button', { name: /Historial/i });
    fireEvent.click(tabHistorial);

    await waitFor(() => {
      // La métrica "Rechazados / A Revisar" debe mostrar 0 reintentos disponibles (porque la reserva 11 ya fue pagada)
      expect(screen.getByText('Rechazados / A Revisar')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    // En la vista de tarjetas no debe ofrecer el botón Reintentar para la transacción rechazada
    expect(screen.queryByRole('button', { name: /Reintentar/i })).not.toBeInTheDocument();
  });
});
