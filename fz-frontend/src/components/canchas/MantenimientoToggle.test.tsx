import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MantenimientoToggle } from './MantenimientoToggle';

describe('MantenimientoToggle', () => {
  it('muestra estado habilitada cuando enMantenimiento es false', () => {
    render(
      <MantenimientoToggle
        idCancha={1}
        nombreCancha="Cancha 1"
        enMantenimiento={false}
        onToggle={vi.fn()}
      />
    );

    const switchBtn = screen.getByRole('switch', {
      name: /alternar mantenimiento para cancha 1/i,
    });
    expect(switchBtn).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Habilitada')).toBeInTheDocument();
  });

  it('muestra estado mantenimiento cuando enMantenimiento es true', () => {
    render(
      <MantenimientoToggle
        idCancha={2}
        nombreCancha="Cancha 2"
        enMantenimiento={true}
        onToggle={vi.fn()}
      />
    );

    const switchBtn = screen.getByRole('switch', {
      name: /alternar mantenimiento para cancha 2/i,
    });
    expect(switchBtn).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
  });

  it('abre el ConfirmDialog aclarando que las reservas ya tomadas se mantienen al hacer clic', () => {
    render(
      <MantenimientoToggle
        idCancha={1}
        nombreCancha="Cancha Pádel"
        enMantenimiento={false}
        onToggle={vi.fn()}
      />
    );

    const switchBtn = screen.getByRole('switch');
    fireEvent.click(switchBtn);

    // Debe mostrar la advertencia requerida de que las reservas tomadas se mantienen
    expect(
      screen.getByText(/las reservas ya tomadas se mantienen intactas/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /confirmar mantenimiento/i })
    ).toBeInTheDocument();
  });

  it('llama a onToggle con el nuevo estado al confirmar', async () => {
    const handleToggle = vi.fn().mockResolvedValue(undefined);
    render(
      <MantenimientoToggle
        idCancha={1}
        nombreCancha="Cancha Pádel"
        enMantenimiento={false}
        onToggle={handleToggle}
      />
    );

    fireEvent.click(screen.getByRole('switch'));

    const confirmBtn = screen.getByRole('button', { name: /confirmar mantenimiento/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleToggle).toHaveBeenCalledWith(true);
    });
  });

  it('no llama a onToggle si el usuario cancela en el diálogo', () => {
    const handleToggle = vi.fn();
    render(
      <MantenimientoToggle
        idCancha={1}
        nombreCancha="Cancha Pádel"
        enMantenimiento={false}
        onToggle={handleToggle}
      />
    );

    fireEvent.click(screen.getByRole('switch'));

    const cancelBtn = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(cancelBtn);

    expect(handleToggle).not.toHaveBeenCalled();
  });
});
