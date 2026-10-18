import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CanchasPage } from './CanchasPage';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider } from '../context/ToastContext';
import * as canchasService from '../services/canchasService';
import type { CanchaDTO, SedeDTO, FranjaHorariaDTO, ReservaCanchaDTO } from '../types';

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

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
          {ui}
        </SedeProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('CanchasPage (Integración)', () => {
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
    renderWithProviders(<CanchasPage initialTab="reservar" fechaInicial="2026-10-25" />);

    // Verificar que renderiza el encabezado de reserva
    expect(screen.getByText(/reserva de canchas deportivas/i)).toBeInTheDocument();

    // Esperar a que se carguen las canchas y se muestre la disponibilidad
    await waitFor(() => {
      expect(screen.getByText('Cancha 1 — Pádel')).toBeInTheDocument();
      expect(screen.getByText('18:00 – 19:00')).toBeInTheDocument();
      expect(screen.getByText('19:00 – 20:00')).toBeInTheDocument();
    });

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

    renderWithProviders(<CanchasPage initialTab="reservar" fechaInicial="2026-10-25" />);

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
});
