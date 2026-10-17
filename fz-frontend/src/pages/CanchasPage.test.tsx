import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanchasPage } from './CanchasPage';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider } from '../context/ToastContext';
import * as canchasService from '../services/canchasService';
import type { CanchaDTO, SedeDTO } from '../types';

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

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
        {ui}
      </SedeProvider>
    </ToastProvider>
  );
}

describe('CanchasPage (Integración)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(canchasService, 'listarCanchas').mockResolvedValue([...initialCanchas]);
  });

  it('carga y muestra las canchas de la sede activa y sus métricas', async () => {
    renderWithProviders(<CanchasPage />);

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

    renderWithProviders(<CanchasPage />);

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

    renderWithProviders(<CanchasPage />);

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
