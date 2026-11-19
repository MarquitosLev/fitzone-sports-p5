import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { CanchasPage } from './CanchasPage';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider } from '../context/ToastContext';
import * as canchasService from '../services/canchasService';
import * as pagosService from '../services/pagosService';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../context/AuthContext';
import type { CanchaDTO, SedeDTO, FranjaHorariaDTO, ReservaCanchaDTO, TransaccionDTO, UsuarioDTO } from '../types';

const mockSede: SedeDTO = {
  idSede: 1,
  nombre: 'FitZone Palermo',
  aforoMaximo: 80,
};

const initialCanchas: CanchaDTO[] = [
  {
    idCancha: 1,
    sede: mockSede,
    nombre: 'Cancha 1 — Pádel',
    tipo: 'PADEL',
    precioBaseHora: 8000,
    enMantenimiento: false,
  },
  {
    idCancha: 2,
    sede: mockSede,
    nombre: 'Cancha 2 — Fútbol 5',
    tipo: 'FUTBOL_5',
    precioBaseHora: 12000,
    enMantenimiento: true,
  },
];

const mockFranjas: FranjaHorariaDTO[] = [
  {
    id: '18:00-19:00',
    horaInicio: '18:00',
    horaFin: '19:00',
    textoTurno: '18:00 – 19:00',
    esPico: false,
    estado: 'LIBRE',
    precioEstimado: 8000,
  },
  {
    id: '19:00-20:00',
    horaInicio: '19:00',
    horaFin: '20:00',
    textoTurno: '19:00 – 20:00',
    esPico: true,
    estado: 'LIBRE',
    precioEstimado: 8000,
  },
];

const mockReservas: ReservaCanchaDTO[] = [
  {
    idReservaCancha: 1029,
    cancha: initialCanchas[0],
    usuario: {
      idUsuario: 1,
      authId: 'uuid-1',
      dni: '32845761',
      nombre: 'Martín',
      apellido: 'García',
      email: 'martin@email.com',
      telefono: '1144558899',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    fechaHoraInicio: '2026-10-25T19:00:00',
    fechaHoraFin: '2026-10-25T20:00:00',
    precioFinal: 8160,
    estado: 'PENDIENTE_PAGO',
  },
];

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
  reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
  logout: () => {},
};

const gerente: UsuarioDTO = {
  idUsuario: 3,
  authId: 'auth-3',
  dni: '20000000',
  nombre: 'Gerente',
  apellido: 'General',
  email: 'gerente@fitzone.com',
  telefono: '1199998888',
  fotoUrl: null,
  tipoUsuario: 'GERENTE',
  idSede: 1,
};

const sesionGerente: AuthContextType = {
  usuario: gerente,
  token: 'token-gerente',
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({ token: 'token-gerente', usuario: gerente }),
  register: async () => ({ token: 'token-gerente', usuario: gerente }),
  reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
  logout: () => {},
};

const externo: UsuarioDTO = {
  idUsuario: 4,
  authId: null,
  dni: '12345678',
  nombre: 'Cliente',
  apellido: 'Externo',
  email: 'externo@email.com',
  telefono: '1155667788',
  fotoUrl: null,
  tipoUsuario: 'EXTERNO',
  idSede: null,
};

const sesionExterno: AuthContextType = {
  usuario: externo,
  token: 'token-externo',
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({ token: 'token-externo', usuario: externo }),
  register: async () => ({ token: 'token-externo', usuario: externo }),
  reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
  logout: () => {},
};

const recepcionista: UsuarioDTO = {
  idUsuario: 5,
  authId: 'auth-5',
  dni: '11223344',
  nombre: 'Recepcionista',
  apellido: 'Sede',
  email: 'recep@fitzone.com',
  telefono: '1166778899',
  fotoUrl: null,
  tipoUsuario: 'RECEPCIONISTA',
  idSede: 1,
};

const sesionRecepcionista: AuthContextType = {
  usuario: recepcionista,
  token: 'token-recep',
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({ token: 'token-recep', usuario: recepcionista }),
  register: async () => ({ token: 'token-recep', usuario: recepcionista }),
  reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
  logout: () => {},
};

/** Componente espía para registrar cambios de ruta dentro del MemoryRouter */
function LocationWatcher({ onLocationChange }: { onLocationChange: (pathname: string) => void }) {
  const location = useLocation();
  onLocationChange(location.pathname);
  return null;
}

/** Reservar exige la sesión de un socio o externo: el turno queda a su nombre. */
function renderWithProviders(
  ui: React.ReactElement,
  sesion: AuthContextType | boolean = false,
  onLocationChange?: (pathname: string) => void
) {
  const authValue = typeof sesion === 'boolean' ? (sesion ? sesionSocio : null) : sesion;
  const pagina = (
    <MemoryRouter initialEntries={['/canchas']}>
      {onLocationChange && <LocationWatcher onLocationChange={onLocationChange} />}
      <ToastProvider>
        <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
          {ui}
        </SedeProvider>
      </ToastProvider>
    </MemoryRouter>
  );
  return render(
    authValue ? <AuthContext.Provider value={authValue}>{pagina}</AuthContext.Provider> : pagina
  );
}

describe('CanchasPage (Integración)', () => {
  // Los datos usan el 2026-10-25: fijamos "hoy" antes para que la grilla no marque esos turnos como pasados.
  // Solo se falsea Date; los timers siguen reales para que waitFor funcione.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-20T10:00:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(canchasService, 'listarCanchas').mockResolvedValue([...initialCanchas]);
    vi.spyOn(canchasService, 'obtenerDisponibilidad').mockResolvedValue([...mockFranjas]);
    vi.spyOn(canchasService, 'listarMisReservas').mockResolvedValue([...mockReservas]);
    vi.spyOn(canchasService, 'cotizarTurno').mockImplementation(async (_id, horaInicio, esSocio) =>
      canchasService.calcularCotizacion(8000, horaInicio, esSocio)
    );
  });

  // ── RF-10 / RF-11: Flujo de Reserva de Canchas ─────────────────────────────
  it('permite ver horarios libres, cotización con franja pico y descuento socio, y abrir confirmación', async () => {
    renderWithProviders(<CanchasPage initialTab="reservar" fechaInicial="2026-10-25" />, true);

    // Verificar que renderiza el encabezado de reserva
    expect(screen.getByText(/reserva de canchas deportivas/i)).toBeInTheDocument();

    // Esperar a que se carguen las canchas y se muestre la disponibilidad
    await waitFor(() => {
      expect(screen.getByText('Cancha 1 — Pádel')).toBeInTheDocument();
      expect(screen.getByText('18:00 – 19:00')).toBeInTheDocument();
      expect(screen.getByText('19:00 – 20:00')).toBeInTheDocument();
    }, { timeout: 4000 });

    // Franja pico marcada visualmente
    expect(screen.getAllByText(/pico \+20%/i).length).toBeGreaterThanOrEqual(1);

    // Clic en el turno de las 19:00 (pico)
    const turnoPico = screen.getByRole('button', { name: /19:00 – 20:00/i });
    expect(turnoPico).not.toBeDisabled();
    fireEvent.click(turnoPico);

    // Aparece el resumen inferior con precio cotizado
    await waitFor(() => {
      expect(screen.getByText(/tu turno seleccionado/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirmar turno/i })).toBeInTheDocument();
    });

    // Abrir modal de confirmación
    fireEvent.click(screen.getByRole('button', { name: /confirmar turno/i }));

    // Verificar modal y desglose de precio
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/confirmar reserva de cancha/i)).toBeInTheDocument();
    expect(screen.getByText(/detalle del precio/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error y refresca la grilla si el horario ya fue tomado (409)', async () => {
    const spyCrear = vi.spyOn(canchasService, 'crearReserva').mockRejectedValueOnce(
      new Error('El horario ya fue tomado por otro usuario')
    );

    renderWithProviders(<CanchasPage initialTab="reservar" fechaInicial="2026-10-25" />, true);

    await waitFor(() => {
      expect(screen.getByText('18:00 – 19:00')).toBeInTheDocument();
    });

    // Seleccionar turno y abrir modal
    const slot = screen.getByRole('button', { name: /18:00 – 19:00/i });
    expect(slot).not.toBeDisabled();
    fireEvent.click(slot);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmar turno/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /confirmar turno/i }));

    // Confirmar reserva en modal
    const btnConfirmar = screen.getByRole('button', { name: /^confirmar reserva$/i });
    fireEvent.click(btnConfirmar);

    // Verificar llamada y captura de error 409
    await waitFor(() => {
      expect(spyCrear).toHaveBeenCalled();
      expect(
        screen.getByText(/el horario ya fue tomado por otro usuario/i)
      ).toBeInTheDocument();
    });

    // Verifica que se volvió a consultar la disponibilidad para refrescar
    expect(canchasService.obtenerDisponibilidad).toHaveBeenCalled();
  });

  // ── Pantalla 2: Mis Reservas ───────────────────────────────────────────────
  it('permite consultar mis reservas y cancelar un turno pendiente de pago', async () => {
    const spyCancelar = vi.spyOn(canchasService, 'cancelarReserva').mockResolvedValue({
      ...mockReservas[0],
      estado: 'CANCELADA',
    });

    renderWithProviders(<CanchasPage initialTab="mis-reservas" />);

    // Verificar título
    expect(screen.getByText(/mis reservas de cancha/i)).toBeInTheDocument();

    // Esperar listado de reservas
    await waitFor(() => {
      expect(screen.getByText(/1029/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    // Clic en Cancelar
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    // ConfirmDialog de advertencia
    expect(screen.getByText(/¿cancelar esta reserva\?/i)).toBeInTheDocument();

    // Confirmar cancelación
    fireEvent.click(screen.getByRole('button', { name: /sí, cancelar reserva/i }));

    await waitFor(() => {
      expect(spyCancelar).toHaveBeenCalledWith(1029);
    });
  });

  it('permite cancelar una reserva con estado CONFIRMADA y liberar el turno', async () => {
    const reservaConfirmada: ReservaCanchaDTO = {
      ...mockReservas[0],
      idReservaCancha: 2040,
      estado: 'CONFIRMADA',
      // Turno futuro: una reserva paga y ya jugada pasa a FINALIZADA
      fechaHoraInicio: '2099-01-10T19:00:00',
      fechaHoraFin: '2099-01-10T20:00:00',
    };
    vi.spyOn(canchasService, 'listarMisReservas').mockResolvedValueOnce([reservaConfirmada]);
    // Está confirmada porque tiene un pago aprobado
    vi.spyOn(pagosService, 'listarMisPagos').mockResolvedValueOnce([
      { reservaCanchaId: 2040, estadoPago: 'CONFIRMADO' } as TransaccionDTO,
    ]);
    const spyCancelar = vi.spyOn(canchasService, 'cancelarReserva').mockResolvedValueOnce({
      ...reservaConfirmada,
      estado: 'CANCELADA',
    });

    renderWithProviders(<CanchasPage initialTab="mis-reservas" />);

    await waitFor(() => {
      expect(screen.getByText(/2040/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ver comprobante/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByText(/¿cancelar esta reserva\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sí, cancelar reserva/i }));

    await waitFor(() => {
      expect(spyCancelar).toHaveBeenCalledWith(2040);
    });
  });

  it('SCRUM-146: al tocar "Ver comprobante" en una reserva confirmada descarga el PDF oficial sin navegar a /pagos', async () => {
    const reservaConfirmada: ReservaCanchaDTO = {
      ...mockReservas[0],
      idReservaCancha: 3050,
      estado: 'CONFIRMADA',
      fechaHoraInicio: '2099-01-10T19:00:00',
      fechaHoraFin: '2099-01-10T20:00:00',
    };
    vi.spyOn(canchasService, 'listarMisReservas').mockResolvedValueOnce([reservaConfirmada]);
    vi.spyOn(pagosService, 'listarMisPagos').mockResolvedValueOnce([
      { idTransaccion: 88, reservaCanchaId: 3050, estadoPago: 'CONFIRMADO' } as TransaccionDTO,
    ]);
    const spyObtenerComp = vi.spyOn(pagosService, 'obtenerComprobantePorTransaccion').mockResolvedValueOnce({
      idComprobante: 15,
      numeroFactura: 'FAC-0001-00000015',
      transaccion: { idTransaccion: 88 } as TransaccionDTO,
    });
    const fakeBlob = new Blob(['%PDF-1.4 mock'], { type: 'application/pdf' });
    const spyDescargarPdf = vi.spyOn(pagosService, 'descargarComprobantePdf').mockResolvedValueOnce(fakeBlob);
    const spyDescargarBlob = vi.spyOn(pagosService, 'descargarBlobEnNavegador').mockImplementation(() => {});

    const rutasVisitadas: string[] = [];
    renderWithProviders(<CanchasPage initialTab="mis-reservas" />, false, (path) => {
      rutasVisitadas.push(path);
    });

    await waitFor(() => {
      expect(screen.getByText(/3050/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ver comprobante/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /ver comprobante/i }));

    await waitFor(() => {
      expect(spyObtenerComp).toHaveBeenCalledWith(88);
      expect(spyDescargarPdf).toHaveBeenCalledWith(15);
      expect(spyDescargarBlob).toHaveBeenCalledWith(fakeBlob, 'comprobante-FAC-0001-00000015.pdf');
    });

    // Verifica explícitamente que no se navegó a /pagos
    expect(rutasVisitadas).not.toContain('/pagos');
    expect(rutasVisitadas[rutasVisitadas.length - 1]).toBe('/canchas');
  });

  // ── RF-09 / RF-12: Gestión de Canchas (Admin) ──────────────────────────────
  it('carga y muestra las canchas de la sede activa y sus métricas', async () => {
    renderWithProviders(<CanchasPage initialTab="admin" />);

    expect(screen.getByText(/cargando canchas/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cancha 1 — Pádel')).toBeInTheDocument();
      expect(screen.getByText('Cancha 2 — Fútbol 5')).toBeInTheDocument();
    });

    // Métricas
    expect(screen.getByText('Total Canchas')).toBeInTheDocument();
    expect(screen.getByText('Habilitadas')).toBeInTheDocument();
    expect(screen.getAllByText('En Mantenimiento').length).toBeGreaterThanOrEqual(1);
  });

  it('permite abrir el modal, crear una nueva cancha y verla en la lista', async () => {
    const nuevaCanchaMock: CanchaDTO = {
      idCancha: 3,
      sede: mockSede,
      nombre: 'Cancha 3 — Tenis',
      tipo: 'TENIS',
      precioBaseHora: 15000,
      enMantenimiento: false,
    };

    const spyCrear = vi
      .spyOn(canchasService, 'crearCancha')
      .mockResolvedValue(nuevaCanchaMock);

    renderWithProviders(<CanchasPage initialTab="admin" />);

    // Esperar carga inicial
    await waitFor(() => {
      expect(screen.getByText('Cancha 1 — Pádel')).toBeInTheDocument();
    });

    // Clic en Nueva Cancha
    fireEvent.click(screen.getByRole('button', { name: /nueva cancha/i }));

    // Modal abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Registrar una nueva cancha para FitZone Palermo')).toBeInTheDocument();

    // Completar formulario
    fireEvent.change(screen.getByLabelText(/nombre de la cancha/i), {
      target: { value: 'Cancha 3 — Tenis' },
    });
    fireEvent.change(screen.getByLabelText(/tipo de deporte/i), {
      target: { value: 'TENIS' },
    });
    fireEvent.change(screen.getByLabelText(/precio base por hora/i), {
      target: { value: '15000' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /crear cancha/i }));

    await waitFor(() => {
      expect(spyCrear).toHaveBeenCalledWith(
        mockSede.idSede,
        {
          nombre: 'Cancha 3 — Tenis',
          tipo: 'TENIS',
          precioBaseHora: 15000,
          enMantenimiento: false,
        },
        mockSede.nombre
      );
    });

    // Verificar que la nueva cancha aparece en pantalla y el modal se cerró
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Cancha 3 — Tenis')).toBeInTheDocument();
    });
  });

  it('permite alternar el estado de mantenimiento mediante confirmación', async () => {
    const canchaActualizada: CanchaDTO = {
      ...initialCanchas[0],
      enMantenimiento: true,
    };

    const spyToggle = vi
      .spyOn(canchasService, 'cambiarMantenimiento')
      .mockResolvedValue(canchaActualizada);

    renderWithProviders(<CanchasPage initialTab="admin" />);

    await waitFor(() => {
      expect(screen.getByText('Cancha 1 — Pádel')).toBeInTheDocument();
    });

    // Clic en switch de mantenimiento de Cancha 1
    const switchBtn = screen.getByRole('switch', {
      name: /alternar mantenimiento para cancha 1 — pádel/i,
    });
    fireEvent.click(switchBtn);

    // Diálogo con advertencia de reservas mantenidas
    expect(
      screen.getByText(/las reservas ya tomadas se mantienen intactas/i)
    ).toBeInTheDocument();

    // Confirmar
    fireEvent.click(screen.getByRole('button', { name: /confirmar mantenimiento/i }));

    await waitFor(() => {
      expect(spyToggle).toHaveBeenCalledWith(1, true);
    });
  });

  // ── Segregación de Vistas por Rol (SCRUM-127 / Fix Gerente) ────────────────
  it('el GERENTE ve únicamente la vista de gestión y no las pestañas de reserva de socio', async () => {
    renderWithProviders(<CanchasPage />, sesionGerente);

    await waitFor(() => {
      expect(screen.getByText('Cancha 1 — Pádel')).toBeInTheDocument();
    });

    // No debe existir selector de pestañas de reserva ni mis reservas
    expect(screen.queryByRole('tab', { name: /reservar cancha/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /mis reservas/i })).not.toBeInTheDocument();

    // Debe mostrar la gestión de canchas y opciones de administración
    expect(screen.getByRole('tab', { name: /gestión de canchas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nueva cancha/i })).toBeInTheDocument();
  });

  it('el SOCIO ve las pestañas de reserva y mis reservas pero no la pestaña de gestión de canchas', async () => {
    renderWithProviders(<CanchasPage />, true);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /reservar cancha/i })).toBeInTheDocument();
    });

    // El socio ve pestañas de reserva
    expect(screen.getByRole('tab', { name: /reservar cancha/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /mis reservas/i })).toBeInTheDocument();

    // El socio no ve gestión de canchas
    expect(screen.queryByRole('tab', { name: /gestión de canchas/i })).not.toBeInTheDocument();
  });

  // ── Nuevos casos cubiertos por la review de Sourcery ──────────────────────

  it('el EXTERNO ve Reservar Cancha y Mis Reservas pero NO gestión de canchas', async () => {
    renderWithProviders(<CanchasPage />, sesionExterno);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /reservar cancha/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /mis reservas/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /gestión de canchas/i })).not.toBeInTheDocument();
    // La vista de reserva está activa (título presente)
    expect(screen.getByText(/reserva de canchas deportivas/i)).toBeInTheDocument();
  });

  it('el RECEPCIONISTA ve Reservar Cancha (consulta disponibilidad) pero NO Mis Reservas ni admin', async () => {
    renderWithProviders(<CanchasPage />, sesionRecepcionista);

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /reservar cancha/i })).toBeInTheDocument();
    });

    // Recepcionista tiene CANCHAS_VER y ve la pestaña de reservar
    expect(screen.getByRole('tab', { name: /reservar cancha/i })).toBeInTheDocument();
    // No tiene CANCHAS_ADMIN ni es GERENTE, no ve gestión
    expect(screen.queryByRole('tab', { name: /gestión de canchas/i })).not.toBeInTheDocument();
    // No puede reservar para sí mismo: no ve Mis Reservas
    expect(screen.queryByRole('tab', { name: /mis reservas/i })).not.toBeInTheDocument();
  });

  it('el GERENTE restaurado con isLoading=true no muestra flujo de invitado mientras carga', () => {
    // Simula el estado de carga: auth en curso, usuario aún null
    const sesionCargando: AuthContextType = {
      usuario: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      login: async () => { throw new Error('fuera de provider'); },
      register: async () => { throw new Error('fuera de provider'); },
      reintentarCuenta: async () => { throw new Error('fuera de provider'); },
      logout: () => {},
    };

    renderWithProviders(<CanchasPage />, sesionCargando);

    // Con isLoading=true el componente no debe considerar al usuario como invitado:
    // ni el flujo de reserva de invitado ni las pestañas de reserva deben verse.
    expect(screen.queryByRole('tab', { name: /reservar cancha/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /mis reservas/i })).not.toBeInTheDocument();
    // El encabezado de reserva de invitado tampoco
    expect(screen.queryByText(/reserva de canchas deportivas/i)).not.toBeInTheDocument();
  });

  it('el GERENTE forzado a initialTab="reservar" aterriza en gestión, no en página en blanco', async () => {
    renderWithProviders(<CanchasPage initialTab="reservar" />, sesionGerente);

    // A pesar de initialTab="reservar", el GERENTE (soloAdmin) redirige a 'admin'
    await waitFor(() => {
      expect(screen.getByText('Cancha 1 — Pádel')).toBeInTheDocument();
    });

    expect(screen.getByRole('tab', { name: /gestión de canchas/i })).toBeInTheDocument();
    // La vista admin está activa (h1 con el título presente)
    expect(screen.getByRole('heading', { name: /gestión de canchas/i })).toBeInTheDocument();
    // No hay pestañas de reserva
    expect(screen.queryByRole('tab', { name: /reservar cancha/i })).not.toBeInTheDocument();
  });
});
