/**
 * ValidadorIngreso.test.tsx — Pruebas unitarias para el lector/validador de tokens de ingreso (RF-04).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ValidadorIngreso } from '../../components/acceso/ValidadorIngreso';

describe('ValidadorIngreso Component', () => {
  it('renderiza el campo de texto y botón de validación', () => {
    render(<ValidadorIngreso onValidar={vi.fn()} />);

    expect(screen.getByLabelText(/Código o Token del Pase QR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Validar Ingreso/i })).toBeInTheDocument();
  });

  it('deshabilita el botón de validación si el campo está vacío', () => {
    render(<ValidadorIngreso onValidar={vi.fn()} />);

    const btn = screen.getByRole('button', { name: /Validar Ingreso/i });
    expect(btn).toBeDisabled();
  });

  it('dispara onValidar con el token ingresado al enviar el formulario', () => {
    const onValidarMock = vi.fn();
    render(<ValidadorIngreso onValidar={onValidarMock} />);

    const input = screen.getByLabelText(/Código o Token del Pase QR/i);
    fireEvent.change(input, { target: { value: 'FZ-QR-9900' } });

    const btn = screen.getByRole('button', { name: /Validar Ingreso/i });
    expect(btn).toBeEnabled();

    fireEvent.click(btn);
    expect(onValidarMock).toHaveBeenCalledWith('FZ-QR-9900');
  });

  it('dispara onValidar al seleccionar un botón rápido de prueba de caso de error', () => {
    const onValidarMock = vi.fn();
    render(<ValidadorIngreso onValidar={onValidarMock} />);

    const btnQrVencido = screen.getByRole('button', { name: /QR Vencido/i });
    fireEvent.click(btnQrVencido);

    expect(onValidarMock).toHaveBeenCalledWith('TEST-QR-VENCIDO');
    expect(screen.getByLabelText(/Código o Token del Pase QR/i)).toHaveValue('TEST-QR-VENCIDO');
  });

  it('permite limpiar el campo mediante el botón Limpiar', () => {
    render(<ValidadorIngreso onValidar={vi.fn()} />);

    const input = screen.getByLabelText(/Código o Token del Pase QR/i);
    fireEvent.change(input, { target: { value: 'TOKEN-A-LIMPIAR' } });
    expect(input).toHaveValue('TOKEN-A-LIMPIAR');

    const btnLimpiar = screen.getByRole('button', { name: /Limpiar/i });
    fireEvent.click(btnLimpiar);

    expect(input).toHaveValue('');
  });

  it('respeta el estado loading deshabilitando las acciones', () => {
    render(<ValidadorIngreso onValidar={vi.fn()} loading={true} />);

    const input = screen.getByLabelText(/Código o Token del Pase QR/i);
    expect(input).toBeDisabled();
    expect(screen.getByRole('button', { name: /Validar Ingreso/i })).toBeDisabled();
  });
});
