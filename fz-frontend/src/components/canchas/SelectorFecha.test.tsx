import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectorFecha } from './SelectorFecha';

describe('SelectorFecha Component', () => {
  it('renderiza la fecha seleccionada con formato legible y botón de flechas', () => {
    const handleFechaChange = vi.fn();
    render(
      <SelectorFecha
        fechaSeleccionada="2026-10-20"
        onFechaChange={handleFechaChange}
        fechaMinima="2026-10-20"
      />
    );

    expect(screen.getByText(/martes 20 de octubre de 2026/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Día anterior')).toBeDisabled();
    expect(screen.getByLabelText('Día siguiente')).not.toBeDisabled();
  });

  it('permite avanzar al día siguiente con la flecha', () => {
    const handleFechaChange = vi.fn();
    render(
      <SelectorFecha
        fechaSeleccionada="2026-10-20"
        onFechaChange={handleFechaChange}
        fechaMinima="2026-10-20"
      />
    );

    fireEvent.click(screen.getByLabelText('Día siguiente'));
    expect(handleFechaChange).toHaveBeenCalledWith('2026-10-21');
  });

  it('permite retroceder al día anterior si no excede la fecha mínima', () => {
    const handleFechaChange = vi.fn();
    render(
      <SelectorFecha
        fechaSeleccionada="2026-10-25"
        onFechaChange={handleFechaChange}
        fechaMinima="2026-10-20"
      />
    );

    const prevBtn = screen.getByLabelText('Día anterior');
    expect(prevBtn).not.toBeDisabled();
    fireEvent.click(prevBtn);
    expect(handleFechaChange).toHaveBeenCalledWith('2026-10-24');
  });

  it('permite seleccionar fechas desde los botones rápidos (Hoy, Mañana...)', () => {
    const handleFechaChange = vi.fn();
    render(
      <SelectorFecha
        fechaSeleccionada="2026-10-20"
        onFechaChange={handleFechaChange}
      />
    );

    const mananaBtn = screen.getByRole('button', { name: /mañana/i });
    expect(mananaBtn).toBeInTheDocument();
    fireEvent.click(mananaBtn);
    expect(handleFechaChange).toHaveBeenCalled();
  });

  it('permite cambiar la fecha mediante el input nativo de tipo date', () => {
    const handleFechaChange = vi.fn();
    render(
      <SelectorFecha
        fechaSeleccionada="2026-10-20"
        onFechaChange={handleFechaChange}
        fechaMinima="2026-10-20"
      />
    );

    const inputDate = screen.getByLabelText('Seleccionar fecha');
    fireEvent.change(inputDate, { target: { value: '2026-10-28' } });
    expect(handleFechaChange).toHaveBeenCalledWith('2026-10-28');
  });
});
