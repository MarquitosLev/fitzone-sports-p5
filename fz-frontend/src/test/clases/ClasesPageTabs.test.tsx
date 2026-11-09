import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClasesPage } from '../../pages/ClasesPage';
import { SedeProvider } from '../../context/SedeContext';
import { ToastProvider } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import type { AuthContextType } from '../../context/AuthContext';
import * as clasesService from '../../services/clasesService';
import type { SedeDTO, ClaseGrupalDTO, ReservaClaseDTO, ListaEsperaDTO, UsuarioDTO, TipoUsuario } from '../../types';

const mockSede: SedeDTO = {
  idSede: 1,
  nombre: 'FitZone Palermo',
  aforoMaximo: 80,
};

const mockClase: ClaseGrupalDTO = {
  idClase: 10,
  sede: mockSede,
  nombreActividad: 'Spinning Power',
  fechaHoraInicio: '2026-11-20T10:00:00',
  duracionMinutos: 45,
  cupoMaximo: 20,
  cupoDisponible: 12,
  yaReservada: false,
  posicionEspera: null,
};

function crearSesion(tipoUsuario: TipoUsuario): AuthContextType {
  const usuario: UsuarioDTO = {
    idUsuario: 1,
    authId: 'auth-user-1',
    dni: '30123456',
    nombre: 'Usuario',
    apellido: 'Test',
    email: 'test@fitzone.com',
    telefono: '11-1234-5678',
    fotoUrl: null,
    tipoUsuario,
    idSede: 1,
  };

  return {
    usuario,
    token: 'jwt-token-valido',
    isAuthenticated: true,
    isLoading: false,
    login: async () => ({ token: 'jwt-token-valido', usuario }),
    register: async () => ({ token: 'jwt-token-valido', usuario }),
    logout: () => {},
  };
}

function renderClasesPage(tipoUsuario: TipoUsuario) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={crearSesion(tipoUsuario)}>
        <ToastProvider>
          <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
            <ClasesPage />
          </SedeProvider>
        </ToastProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('ClasesPage (SCRUM-127 Visibilidad de pestañas por rol)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(clasesService, 'listarClases').mockResolvedValue([mockClase]);
    vi.spyOn(clasesService, 'listarMisReservas').mockResolvedValue([] as ReservaClaseDTO[]);
    vi.spyOn(clasesService, 'listarMiListaEspera').mockResolvedValue([] as ListaEsperaDTO[]);
  });

  it('el GERENTE ve únicamente la agenda semanal y no las pestañas de reserva de socio', async () => {
    renderClasesPage('GERENTE');

    await waitFor(() => {
      expect(screen.getByText('Clases Grupales')).toBeInTheDocument();
    });

    // No debe existir selector de pestañas de reserva
    expect(screen.queryByRole('button', { name: /clases disponibles/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mis reservas/i })).not.toBeInTheDocument();

    // Debe mostrar la agenda y la opción de programar clase
    expect(screen.getByRole('button', { name: /programar nueva clase/i })).toBeInTheDocument();
    expect(screen.getByTestId('agenda-semanal')).toBeInTheDocument();
  });

  it('el RECEPCIONISTA ve la agenda sin las pestañas de socio y sin botón de programar clase', async () => {
    renderClasesPage('RECEPCIONISTA');

    await waitFor(() => {
      expect(screen.getByText('Clases Grupales')).toBeInTheDocument();
    });

    // No debe ver pestañas de socio
    expect(screen.queryByRole('button', { name: /clases disponibles/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mis reservas/i })).not.toBeInTheDocument();

    // Ve la agenda operativa pero no puede dar de alta clases
    expect(screen.getByTestId('agenda-semanal')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /programar nueva clase/i })).not.toBeInTheDocument();
  });

  it('el SOCIO ve exclusivamente las pestañas de reserva y no la vista administrativa', async () => {
    renderClasesPage('SOCIO');

    await waitFor(() => {
      expect(screen.getByText('Clases Grupales')).toBeInTheDocument();
    });

    // El socio sí ve sus pestañas de reserva
    expect(screen.getByRole('button', { name: /clases disponibles/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mis reservas/i })).toBeInTheDocument();

    // No debe ver agenda admin ni botón de programar
    expect(screen.queryByRole('button', { name: /agenda \(admin\)/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /programar nueva clase/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('agenda-semanal')).not.toBeInTheDocument();
  });
});
