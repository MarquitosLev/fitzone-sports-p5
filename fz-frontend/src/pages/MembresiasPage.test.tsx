import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MembresiasPage } from './MembresiasPage';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider } from '../context/ToastContext';
import * as membresiasService from '../services/membresiasService';
import type { MembresiaDTO, PlanDTO, SedeDTO } from '../types';

const mockSede: SedeDTO = {
  idSede: 1,
  nombre: 'FitZone Palermo',
  aforoMaximo: 80,
};

const mockPlanes: PlanDTO[] = [
  {
    idPlan: 1,
    nombre: 'Plan Mensual',
    precioBase: 15000,
    duracionMeses: 1,
    descripcion: 'Musculación y cardio.',
    beneficios: ['Musculación', 'Cardio'],
    destacado: false,
  },
  {
    idPlan: 2,
    nombre: 'Plan Trimestral',
    precioBase: 40000,
    duracionMeses: 3,
    descripcion: 'Multi-sede con clases.',
    beneficios: ['Todas las sedes', 'Clases grupales'],
    destacado: true,
  },
];

const mockMembresias: MembresiaDTO[] = [
  {
    idMembresia: 1,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas.martinez@email.com',
      telefono: '11-4567-8901',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    plan: mockPlanes[0],
    fechaInicio: '2026-09-01',
    fechaVencimiento: '2026-10-01',
    fechaCancelacion: null,
    estado: 'VENCIDO',
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

describe('MembresiasPage (Integración)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(membresiasService, 'listarPlanes').mockResolvedValue([...mockPlanes]);
    vi.spyOn(membresiasService, 'listarMembresias').mockResolvedValue([...mockMembresias]);
    vi.spyOn(membresiasService, 'obtenerMembresiaPorUsuario').mockResolvedValue(mockMembresias[0]);
  });

  it('carga y renderiza la cabecera, catálogo de planes y tabla de membresías', async () => {
    renderWithProviders(<MembresiasPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Membresías del Socio/i })).toBeInTheDocument();

    await waitFor(() => {
      // Planes en el catálogo
      expect(screen.getAllByText('Plan Mensual').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Plan Trimestral')).toBeInTheDocument();
      // Fila de la tabla con el socio
      expect(screen.getByText('Lucas Martínez')).toBeInTheDocument();
      expect(screen.getByText('DNI 30123456')).toBeInTheDocument();
    });
  });

  it('permite abrir el modal para asociar o renovar plan', async () => {
    renderWithProviders(<MembresiasPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Plan Mensual').length).toBeGreaterThanOrEqual(1);
    });

    const botonModal = screen.getByRole('button', { name: /Asociar \/ Renovar Plan/i });
    fireEvent.click(botonModal);

    expect(
      screen.getByText('Asociar o Renovar Plan de Membresía')
    ).toBeInTheDocument();
    expect(screen.getByText(/1\. Socio Titular/i)).toBeInTheDocument();
  });

  it('al presionar Gestionar en la tabla, selecciona al socio y muestra su estado de membresía', async () => {
    renderWithProviders(<MembresiasPage />);

    await waitFor(() => {
      expect(screen.getByText('Lucas Martínez')).toBeInTheDocument();
    });

    const botonGestionar = screen.getByRole('button', { name: /Gestionar/i });
    fireEvent.click(botonGestionar);

    await waitFor(() => {
      // Debe aparecer UsuarioPerfilHeader del socio
      expect(screen.getByText('Cambiar Socio')).toBeInTheDocument();
      // Y la tarjeta de acciones
      expect(screen.getByText(/Acciones de Membresía/i)).toBeInTheDocument();
    });
  });
});
