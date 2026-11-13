import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccesoPage } from './AccesoPage';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../context/AuthContext';
import * as membresiasService from '../services/membresiasService';
import * as accesoService from '../services/accesoService';
import type { MembresiaDTO, SedeDTO, QrTokenDTO, AccesoDTO, UsuarioDTO } from '../types';

const mockSede: SedeDTO = {
  idSede: 1,
  nombre: 'FitZone Palermo',
  aforoMaximo: 80,
};

const mockMembresiaActiva: MembresiaDTO = {
  idMembresia: 2,
  usuario: {
    idUsuario: 2,
    authId: 'uuid-socio-2',
    dni: '28456789',
    nombre: 'Valentina',
    apellido: 'García',
    email: 'vgarcia@email.com',
    telefono: '11-5432-1098',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  plan: {
    idPlan: 2,
    nombre: 'Plan Trimestral',
    precioBase: 40000,
  },
  fechaInicio: '2026-08-15',
  fechaVencimiento: '2026-11-15',
  fechaCancelacion: null,
  estado: 'ACTIVO',
};

const mockMembresiaVencida: MembresiaDTO = {
  idMembresia: 1,
  usuario: {
    idUsuario: 1,
    authId: 'uuid-socio-1',
    dni: '30123456',
    nombre: 'Lucas',
    apellido: 'Martínez',
    email: 'lucas.martinez@email.com',
    telefono: '11-4567-8901',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  plan: {
    idPlan: 1,
    nombre: 'Plan Mensual',
    precioBase: 15000,
  },
  fechaInicio: '2026-09-01',
  fechaVencimiento: '2026-10-01',
  fechaCancelacion: null,
  estado: 'VENCIDO',
};

const mockMembresiaSuspendida: MembresiaDTO = {
  idMembresia: 4,
  usuario: {
    idUsuario: 7,
    authId: null,
    dni: '39123890',
    nombre: 'Camila',
    apellido: 'Torres',
    email: 'camila.torres@email.com',
    telefono: '11-1234-5678',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: 1,
  },
  plan: {
    idPlan: 1,
    nombre: 'Plan Mensual',
    precioBase: 15000,
  },
  fechaInicio: '2026-07-01',
  fechaVencimiento: '2026-10-31',
  fechaCancelacion: null,
  estado: 'SUSPENDIDO',
};

const mockQrToken: QrTokenDTO = {
  token: 'FZ-QR-MOCK-TOKEN-VALENTINA',
  expiraEnSegundos: 60,
  generadoEn: '2026-10-17T20:00:00.000Z',
};

const mockAccesos: AccesoDTO[] = [
  {
    idAcceso: 101,
    usuario: mockMembresiaActiva.usuario,
    sede: mockSede,
    reservaClase: null,
    reservaCancha: null,
    fechaHoraIngreso: '2026-10-17T18:30:00',
    fechaHoraEgreso: null,
  },
];

/** Sesión de un socio: el pase QR es siempre el del socio logueado. */
function sesionSocio(idUsuario: number): AuthContextType {
  const usuario: UsuarioDTO = {
    idUsuario,
    authId: `auth-${idUsuario}`,
    dni: '30000000',
    nombre: 'Socio',
    apellido: 'Prueba',
    email: 'socio@fitzone.com',
    telefono: '1100000000',
    fotoUrl: null,
    tipoUsuario: 'SOCIO',
    idSede: null,
  };
  return {
    usuario,
    token: 'token',
    isAuthenticated: true,
    isLoading: false,
    login: async () => ({ token: 'token', usuario }),
    register: async () => ({ token: 'token', usuario }),
    reintentarCuenta: async () => ({ token: null, usuario: {} as UsuarioDTO }),
    logout: () => {},
  };
}

function renderAccesoPage(idSocio?: number) {
  const pagina = (
    <MemoryRouter>
      <ToastProvider>
        <SedeProvider sedes={[mockSede]} sedeInicial={mockSede}>
          <AccesoPage />
        </SedeProvider>
      </ToastProvider>
    </MemoryRouter>
  );
  return render(
    idSocio ? <AuthContext.Provider value={sesionSocio(idSocio)}>{pagina}</AuthContext.Provider> : pagina
  );
}

describe('AccesoPage (SCRUM-85 Código QR de Ingreso)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(accesoService, 'obtenerMiQr').mockResolvedValue(mockQrToken);
    vi.spyOn(accesoService, 'listarAccesos').mockResolvedValue(mockAccesos);
    vi.spyOn(membresiasService, 'obtenerMembresiaPorUsuario').mockImplementation(async (id) => {
      if (id === 2) return mockMembresiaActiva;
      if (id === 1) return mockMembresiaVencida;
      if (id === 7) return mockMembresiaSuspendida;
      return null;
    });
  });

  it('renderiza la cabecera del pase digital y el componente MembresiaEstadoCard', async () => {
    renderAccesoPage(2);

    expect(screen.getByRole('heading', { level: 1, name: /Pase Digital de Acceso/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('seccion-membresia-card')).toBeInTheDocument();
      expect(screen.getByText('Plan Trimestral')).toBeInTheDocument();
    });
  });

  it('para un socio con membresía ACTIVA: genera y renderiza el código QR dinámico y la cuenta regresiva', async () => {
    renderAccesoPage(2);

    await waitFor(() => {
      expect(screen.getByTestId('seccion-qr-activo')).toBeInTheDocument();
      expect(screen.getByTestId('qr-dinamico')).toBeInTheDocument();
      expect(screen.getByTestId('qr-svg')).toBeInTheDocument();
      expect(screen.getByTestId('cuenta-regresiva')).toBeInTheDocument();
    });

    // Confirma que NO muestra banner de bloqueo
    expect(screen.queryByTestId('seccion-qr-bloqueado')).not.toBeInTheDocument();
  });

  it('REGLA DE NEGOCIO CRÍTICA: si la membresía está VENCIDA, NO muestra el QR y exhibe el banner con el motivo', async () => {
    renderAccesoPage(1);

    await waitFor(() => {
      // Verifica MembresiaEstadoCard con estado vencido
      expect(screen.getByText('Plan Mensual')).toBeInTheDocument();
      // Verifica que el banner de bloqueo está presente
      expect(screen.getByTestId('seccion-qr-bloqueado')).toBeInTheDocument();
      expect(screen.getByText(/Ingreso Bloqueado · Membresía Vencida/i)).toBeInTheDocument();
      expect(screen.getByText(/Tu membresía ha caducado/i)).toBeInTheDocument();
    });

    // REGLA CRÍTICA: El código QR NO debe renderizarse
    expect(screen.queryByTestId('seccion-qr-activo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('qr-svg')).not.toBeInTheDocument();
  });

  it('REGLA DE NEGOCIO CRÍTICA: si la membresía está SUSPENDIDA, bloquea el QR e informa la suspensión', async () => {
    renderAccesoPage(7);

    await waitFor(() => {
      expect(screen.getByTestId('seccion-qr-bloqueado')).toBeInTheDocument();
      expect(screen.getByText(/Ingreso Inhabilitado · Membresía Suspendida/i)).toBeInTheDocument();
    });

    // El código QR no debe mostrarse
    expect(screen.queryByTestId('qr-svg')).not.toBeInTheDocument();
  });

  it('REGLA DE NEGOCIO CRÍTICA: si el usuario NO tiene membresía registrada, bloquea el QR y muestra aviso', async () => {
    renderAccesoPage(3);

    await waitFor(() => {
      expect(screen.getByTestId('seccion-qr-bloqueado')).toBeInTheDocument();
      expect(screen.getByText(/Acceso Denegado · Sin Membresía Registrada/i)).toBeInTheDocument();
    });

    // El código QR no debe mostrarse
    expect(screen.queryByTestId('qr-svg')).not.toBeInTheDocument();
  });

  it('permite cambiar a la pestaña de Molinete Recepción y visualizar el registro de accesos', async () => {
    renderAccesoPage();

    const tabHistorial = screen.getByTestId('tab-historial');
    fireEvent.click(tabHistorial);

    await waitFor(() => {
      expect(screen.getByText(/Molinete de Acceso Físico/i)).toBeInTheDocument();
      expect(screen.getByText('Valentina García')).toBeInTheDocument();
    });
  });
});
