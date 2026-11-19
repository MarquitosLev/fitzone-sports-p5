import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsuarioForm } from './UsuarioForm';
import { SedeProvider } from '../../context/SedeContext';
import type { SedeDTO } from '../../types';

const operadorMock = vi.hoisted(() => ({ actual: null as null | { tipoUsuario: string; idSede: number | null } }));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ usuario: operadorMock.actual }),
}));

const sedes: SedeDTO[] = [
  { idSede: 1, nombre: 'Sede Central', aforoMaximo: 150 },
  { idSede: 2, nombre: 'Sede Norte', aforoMaximo: 100 },
];

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(
    <SedeProvider sedes={sedes}>
      <UsuarioForm modo="alta" onSubmit={onSubmit} />
    </SedeProvider>
  );
  return onSubmit;
}

function completarDatosGerente() {
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Gerente' } });
  fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Central' } });
  fireEvent.change(screen.getByLabelText(/dni/i), { target: { value: '30123456' } });
  fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'central@fitzone.com' } });
  fireEvent.change(screen.getByLabelText(/rol en el sistema/i), { target: { value: 'GERENTE' } });
}

describe('UsuarioForm · gerente central (sin sede)', () => {
  beforeEach(() => {
    operadorMock.actual = null;
  });

  it('el gerente central puede dar de alta un gerente para todas las sedes (idSede null)', async () => {
    operadorMock.actual = { tipoUsuario: 'GERENTE', idSede: null };
    const onSubmit = renderForm();
    completarDatosGerente();

    const opcionCentral = screen.getByRole('option', { name: /todas las sedes/i }) as HTMLOptionElement;
    expect(opcionCentral.disabled).toBe(false);

    fireEvent.change(screen.getByLabelText(/asignación de sede operativa/i), { target: { value: 'CENTRAL' } });
    fireEvent.click(screen.getByRole('button', { name: /dar de alta usuario/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ tipoUsuario: 'GERENTE', idSede: null });
  });

  it('un gerente de sede ve la opción de gerente central deshabilitada', () => {
    operadorMock.actual = { tipoUsuario: 'GERENTE', idSede: 1 };
    renderForm();
    completarDatosGerente();

    const opcionCentral = screen.getByRole('option', { name: /todas las sedes/i }) as HTMLOptionElement;
    expect(opcionCentral.disabled).toBe(true);
  });

  it('el recepcionista no tiene la opción de todas las sedes', () => {
    operadorMock.actual = { tipoUsuario: 'GERENTE', idSede: null };
    renderForm();
    fireEvent.change(screen.getByLabelText(/rol en el sistema/i), { target: { value: 'RECEPCIONISTA' } });

    expect(screen.queryByRole('option', { name: /todas las sedes/i })).not.toBeInTheDocument();
  });
});
