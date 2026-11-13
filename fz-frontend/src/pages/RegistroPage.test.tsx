import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegistroPage } from './RegistroPage';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../context/AuthContext';
import { SedeProvider } from '../context/SedeContext';
import { ToastProvider } from '../context/ToastContext';
import * as membresiasService from '../services/membresiasService';
import * as authService from '../services/authService';
import { AppError } from '../services/httpClient';
import type { UsuarioDTO } from '../types';

const plan = { idPlan: 1, nombre: 'Plan Mensual', precioBase: 15000, duracionMeses: 1 };
const sede = { idSede: 1, nombre: 'Palermo', aforoMaximo: 80 };
const socio = { idUsuario: 50, tipoUsuario: 'SOCIO', dni: '40111999', email: 'sofia@mail.com' } as UsuarioDTO;

function renderPagina(register: AuthContextType['register'], reintentarCuenta: AuthContextType['reintentarCuenta'] = vi.fn()) {
  const auth = {
    usuario: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register,
    reintentarCuenta,
  } as AuthContextType;

  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <ToastProvider>
        <AuthContext.Provider value={auth}>
          <SedeProvider sedes={[sede]} sedeInicial={sede}>
            <Routes>
              <Route path="/registro" element={<RegistroPage />} />
              <Route path="/mi-qr" element={<p>Pase QR</p>} />
              <Route path="/login" element={<p>Pantalla de login</p>} />
            </Routes>
          </SedeProvider>
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
}

async function completarDatosYContinuar() {
  await screen.findByText('Plan Mensual');
  fireEvent.change(screen.getByLabelText(/^nombre/i), { target: { value: 'Sofía' } });
  fireEvent.change(screen.getByLabelText(/^apellido/i), { target: { value: 'Nueva' } });
  fireEvent.change(screen.getByLabelText(/^dni/i), { target: { value: '40111999' } });
  fireEvent.change(screen.getByLabelText(/^teléfono/i), { target: { value: '1166660000' } });
  fireEvent.change(screen.getByLabelText(/^correo electrónico/i), { target: { value: 'sofia@mail.com' } });
  fireEvent.change(screen.getByLabelText(/^contraseña/i), { target: { value: 'secreta1' } });
  fireEvent.change(screen.getByLabelText(/^confirmar contraseña/i), { target: { value: 'secreta1' } });
  fireEvent.click(screen.getByRole('button', { name: /continuar al pago/i }));
}

describe('RegistroPage: Hacete socio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    vi.spyOn(membresiasService, 'listarPlanes').mockResolvedValue([plan]);
  });

  it('datos y plan, checkout y, con el pago aprobado, entra como socio', async () => {
    const register = vi.fn().mockResolvedValue({ token: 'jwt', usuario: socio, cuentaPendiente: false });
    renderPagina(register);
    await completarDatosYContinuar();

    fireEvent.click(await screen.findByRole('button', { name: /Pagar ·/i }));

    await waitFor(() => expect(screen.getByText('Pase QR')).toBeInTheDocument());
    expect(register).toHaveBeenCalledWith({
      nombre: 'Sofía',
      apellido: 'Nueva',
      dni: '40111999',
      email: 'sofia@mail.com',
      telefono: '1166660000',
      password: 'secreta1',
      idPlan: 1,
      idSede: 1,
    });
  });

  it('al volver desde el checkout conserva los datos que ya cargó', async () => {
    renderPagina(vi.fn());
    await completarDatosYContinuar();

    fireEvent.click(await screen.findByRole('button', { name: /volver a mis datos/i }));

    expect(screen.getByLabelText(/^nombre/i)).toHaveValue('Sofía');
    expect(screen.getByLabelText(/^dni/i)).toHaveValue('40111999');
    expect(screen.getByLabelText(/^correo electrónico/i)).toHaveValue('sofia@mail.com');
  });

  it('con el pago rechazado muestra el motivo y deja reintentar desde el mismo checkout', async () => {
    const register = vi.fn().mockRejectedValue(new AppError('El pago fue rechazado. No se creó la cuenta.', 422));
    renderPagina(register);
    await completarDatosYContinuar();

    fireEvent.click(await screen.findByRole('button', { name: /Pagar ·/i }));

    expect(await screen.findByText(/No se creó la cuenta/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar ·/i })).toBeEnabled();
  });

  it('sin plan elegido no avanza al pago', async () => {
    vi.spyOn(membresiasService, 'listarPlanes').mockResolvedValue([]);
    renderPagina(vi.fn());

    expect(await screen.findByText(/no hay planes disponibles/i)).toBeInTheDocument();
  });

  const pendiente = {
    token: null,
    usuario: socio,
    cuentaPendiente: true,
    mensaje: 'Tu pago quedó registrado',
    numeroFactura: '0001-00000003',
    codigoReintento: 'c0d1-g0',
  };

  it('si la cuenta quedó pendiente muestra el comprobante y reintenta con el código y la sesión que devuelve', async () => {
    const register = vi.fn().mockResolvedValue(pendiente);
    const reintentar = vi.fn().mockResolvedValue({ token: 'jwt', usuario: socio, cuentaPendiente: false });
    renderPagina(register, reintentar);
    await completarDatosYContinuar();
    fireEvent.click(await screen.findByRole('button', { name: /Pagar ·/i }));

    expect(await screen.findByText('0001-00000003')).toBeInTheDocument();
    expect(screen.queryByLabelText(/contraseña de tu cuenta/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reintentar crear mi acceso/i }));

    await waitFor(() => expect(screen.getByText('Pase QR')).toBeInTheDocument());
    expect(reintentar).toHaveBeenCalledWith({
      dni: '40111999',
      email: 'sofia@mail.com',
      password: 'secreta1',
      codigoReintento: 'c0d1-g0',
    });
    expect(sessionStorage.getItem(authService.ALTA_PENDIENTE_STORAGE_KEY)).toBeNull();
  });

  it('el alta pendiente se guarda sin la contraseña', async () => {
    renderPagina(vi.fn().mockResolvedValue(pendiente));
    await completarDatosYContinuar();
    fireEvent.click(await screen.findByRole('button', { name: /Pagar ·/i }));
    await screen.findByText('0001-00000003');

    const guardado = sessionStorage.getItem(authService.ALTA_PENDIENTE_STORAGE_KEY) ?? '';
    expect(JSON.parse(guardado)).toEqual({
      dni: '40111999',
      email: 'sofia@mail.com',
      numeroFactura: '0001-00000003',
      codigoReintento: 'c0d1-g0',
      mensaje: 'Tu pago quedó registrado',
    });
    expect(guardado).not.toContain('secreta1');
  });

  it('al recargar con un alta pendiente la recupera y pide la contraseña para reintentar', async () => {
    authService.guardarAltaPendiente({
      dni: '40111999',
      email: 'sofia@mail.com',
      numeroFactura: '0001-00000003',
      codigoReintento: 'c0d1-g0',
      mensaje: 'Tu pago quedó registrado',
    });
    const reintentar = vi.fn().mockResolvedValue({ token: 'jwt', usuario: socio, cuentaPendiente: false });
    renderPagina(vi.fn(), reintentar);

    expect(await screen.findByText('0001-00000003')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reintentar crear mi acceso/i }));
    expect(await screen.findByText(/ingresá la contraseña/i)).toBeInTheDocument();
    expect(reintentar).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/contraseña de tu cuenta/i), { target: { value: 'secreta1' } });
    fireEvent.click(screen.getByRole('button', { name: /reintentar crear mi acceso/i }));

    await waitFor(() => expect(screen.getByText('Pase QR')).toBeInTheDocument());
    expect(reintentar).toHaveBeenCalledWith({
      dni: '40111999',
      email: 'sofia@mail.com',
      password: 'secreta1',
      codigoReintento: 'c0d1-g0',
    });
  });

  it('si el reintento falla muestra el motivo y conserva el alta pendiente', async () => {
    renderPagina(
      vi.fn().mockResolvedValue(pendiente),
      vi.fn().mockRejectedValue(new AppError('Ese email ya tiene una cuenta con otra contraseña.', 422))
    );
    await completarDatosYContinuar();
    fireEvent.click(await screen.findByRole('button', { name: /Pagar ·/i }));
    await screen.findByText('0001-00000003');

    fireEvent.click(screen.getByRole('button', { name: /reintentar crear mi acceso/i }));

    expect(await screen.findByText(/otra contraseña/)).toBeInTheDocument();
    expect(sessionStorage.getItem(authService.ALTA_PENDIENTE_STORAGE_KEY)).not.toBeNull();
  });
});
