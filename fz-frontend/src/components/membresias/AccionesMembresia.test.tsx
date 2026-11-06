import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccionesMembresia } from './AccionesMembresia';

describe('AccionesMembresia Component', () => {
  it('para estado ACTIVO: muestra Renovar, Suspender y Cancelar (pero no Reactivar)', () => {
    render(<AccionesMembresia estado="ACTIVO" />);

    expect(screen.getByRole('button', { name: /Renovar Membresía/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Suspender/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar Membresía/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reactivar Membresía/i })).not.toBeInTheDocument();
  });

  it('para estado SUSPENDIDO: muestra Reactivar y Cancelar (pero no Suspender ni Renovar)', () => {
    render(<AccionesMembresia estado="SUSPENDIDO" />);

    expect(screen.getByRole('button', { name: /Reactivar Membresía/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar Membresía/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Suspender$/i })).not.toBeInTheDocument();
  });

  it('para estado VENCIDO: muestra Renovar y Cancelar (pero no Suspender ni Reactivar)', () => {
    render(<AccionesMembresia estado="VENCIDO" />);

    expect(screen.getByRole('button', { name: /Renovar Membresía/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar Membresía/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Suspender$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reactivar Membresía/i })).not.toBeInTheDocument();
  });

  it('para estado CANCELADO: muestra opción de reactivar nuevo plan', () => {
    render(<AccionesMembresia estado="CANCELADO" />);

    expect(screen.getByRole('button', { name: /Reactivar Nuevo Plan/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Suspender$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancelar Membresía/i })).not.toBeInTheDocument();
  });

  it('abre ConfirmDialog y ejecuta onRenovar al confirmar', async () => {
    const handleRenovar = vi.fn().mockResolvedValue(undefined);
    render(<AccionesMembresia estado="ACTIVO" onRenovar={handleRenovar} />);

    // Clic en botón para abrir modal
    const botonRenovar = screen.getByRole('button', { name: /Renovar Membresía/i });
    fireEvent.click(botonRenovar);

    // Diálogo debe estar visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('¿Confirmar renovación de membresía?')).toBeInTheDocument();

    // Clic en el botón de confirmar dentro del diálogo
    const botonesConfirmar = screen.getAllByRole('button', { name: /Renovar Membresía/i });
    // El segundo es el botón dentro del ConfirmDialog
    fireEvent.click(botonesConfirmar[botonesConfirmar.length - 1]);

    await waitFor(() => {
      expect(handleRenovar).toHaveBeenCalledTimes(1);
    });
  });

  it('abre ConfirmDialog y ejecuta onSuspender al confirmar', async () => {
    const handleSuspender = vi.fn().mockResolvedValue(undefined);
    render(<AccionesMembresia estado="ACTIVO" onSuspender={handleSuspender} />);

    const botonSuspender = screen.getByRole('button', { name: /Suspender/i });
    fireEvent.click(botonSuspender);

    expect(screen.getByText('¿Suspender membresía temporalmente?')).toBeInTheDocument();

    const botonConfirmar = screen.getByRole('button', { name: 'Suspender Acceso' });
    fireEvent.click(botonConfirmar);

    await waitFor(() => {
      expect(handleSuspender).toHaveBeenCalledTimes(1);
    });
  });

  it('cierra el diálogo sin ejecutar el callback al presionar Volver', async () => {
    const handleCancelar = vi.fn();
    render(<AccionesMembresia estado="ACTIVO" onCancelar={handleCancelar} />);

    const botonCancelar = screen.getByRole('button', { name: /Cancelar Membresía/i });
    fireEvent.click(botonCancelar);

    expect(screen.getByText('¿Dar de baja definitiva la membresía?')).toBeInTheDocument();

    const botonVolver = screen.getByRole('button', { name: 'Volver' });
    fireEvent.click(botonVolver);

    await waitFor(() => {
      expect(screen.queryByText('¿Dar de baja definitiva la membresía?')).not.toBeInTheDocument();
    });

    expect(handleCancelar).not.toHaveBeenCalled();
  });
});
