import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MembresiasPage } from './MembresiasPage';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider, ToastContext } from '../context/ToastContext';
import * as membresiasService from '../services/membresiasService';
import * as usuariosService from '../services/usuariosService';
import { AppError } from '../services/httpClient';
import type { MembresiaDTO, PlanDTO, SedeDTO, UsuarioDTO } from '../types';

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

  // ── SCRUM-125: Manejo de socio sin membresía en /membresias ─────────────────
  it('SCRUM-125: al buscar un socio sin membresía muestra "Sin Membresía Activa" sin toasts de error y abrir "Asociar Membresía" precarga al socio en el modal', async () => {
    const mockSocioSinMembresia: UsuarioDTO = {
      idUsuario: 99,
      authId: 'uuid-socio-99',
      dni: '11222333',
      nombre: 'Carlos',
      apellido: 'SinMembresia',
      email: 'carlos@fitzone.com',
      telefono: '11-9999-8888',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    };

    vi.spyOn(usuariosService, 'buscarUsuariosPorDni').mockResolvedValue([mockSocioSinMembresia]);
    vi.spyOn(membresiasService, 'obtenerMembresiaPorUsuario').mockResolvedValue(null);

    const mockAddToast = vi.fn();

    render(
      <ToastContext.Provider value={{ toasts: [], addToast: mockAddToast, removeToast: vi.fn() }}>
        <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
          <MembresiasPage />
        </SedeProvider>
      </ToastContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Membresías del Socio/i })).toBeInTheDocument();
    });

    // 1. Buscar socio por DNI
    const inputBuscador = screen.getByPlaceholderText(/Buscar socio por DNI/i);
    fireEvent.change(inputBuscador, { target: { value: '11222333' } });

    const botonBuscar = screen.getByRole('button', { name: /^Buscar$/i });
    fireEvent.click(botonBuscar);

    // 2. Verificar que se despliega la tarjeta de estado con "Sin Membresía Activa"
    await waitFor(() => {
      expect(screen.getByText(/Sin Membresía Activa/i)).toBeInTheDocument();
      expect(screen.getByText(/Carlos SinMembresia no posee un plan vigente asignado/i)).toBeInTheDocument();
    });

    // 3. Confirmar que NO se disparó ningún toast de tipo 'error'
    const errorToasts = mockAddToast.mock.calls.filter(([toast]) => toast?.type === 'error');
    expect(errorToasts).toHaveLength(0);

    // 4. Hacer clic en "Asociar Membresía"
    const botonAsociar = screen.getByTestId('btn-asociar-membresia');
    expect(botonAsociar).toBeInTheDocument();
    fireEvent.click(botonAsociar);

    // 5. Debe abrir directamente el modal con el socio precargado
    await waitFor(() => {
      expect(screen.getByText('Asociar o Renovar Plan de Membresía')).toBeInTheDocument();
      // El socio debe estar visible dentro del modal como titular precargado
      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('Carlos SinMembresia')).toBeInTheDocument();
      expect(within(modal).getByText('DNI 11222333')).toBeInTheDocument();
    });
  });

  it('SCRUM-125: si el backend responde con error 404 o mensaje de "sin membresía", la UI lo trata como SIN_MEMBRESIA sin disparar toast de error', async () => {
    const mockSocioSinMembresia: UsuarioDTO = {
      idUsuario: 88,
      authId: 'uuid-socio-88',
      dni: '44556677',
      nombre: 'Mariana',
      apellido: 'SinPlan',
      email: 'mariana@fitzone.com',
      telefono: '11-7777-6666',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    };

    vi.spyOn(usuariosService, 'buscarUsuariosPorDni').mockResolvedValue([mockSocioSinMembresia]);
    // Simula que el backend responde con 404 y el mensaje reportado en el bug
    vi.spyOn(membresiasService, 'obtenerMembresiaPorUsuario').mockRejectedValue(
      new AppError('El usuario no posee una membresía activa o suspendida', 404, {
        codigo: 404,
        mensaje: 'El usuario no posee una membresía activa o suspendida',
        timestamp: new Date().toISOString(),
      })
    );

    const mockAddToast = vi.fn();

    render(
      <ToastContext.Provider value={{ toasts: [], addToast: mockAddToast, removeToast: vi.fn() }}>
        <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
          <MembresiasPage />
        </SedeProvider>
      </ToastContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Membresías del Socio/i })).toBeInTheDocument();
    });

    const inputBuscador = screen.getByPlaceholderText(/Buscar socio por DNI/i);
    fireEvent.change(inputBuscador, { target: { value: '44556677' } });

    const botonBuscar = screen.getByRole('button', { name: /^Buscar$/i });
    fireEvent.click(botonBuscar);

    await waitFor(() => {
      expect(screen.getByText(/Sin Membresía Activa/i)).toBeInTheDocument();
      expect(screen.getByText(/Mariana SinPlan no posee un plan vigente asignado/i)).toBeInTheDocument();
    });

    // Tampoco debe haberse disparado toast de error
    const errorToasts = mockAddToast.mock.calls.filter(([toast]) => toast?.type === 'error');
    expect(errorToasts).toHaveLength(0);
  });
});
