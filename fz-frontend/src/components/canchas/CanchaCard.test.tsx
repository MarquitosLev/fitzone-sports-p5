import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CanchaCard } from './CanchaCard';
import type { CanchaDTO } from '../../types';

describe('CanchaCard', () => {
  const mockCancha: CanchaDTO = {
    idCancha: 1,
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    nombre: 'Cancha 1 — Pádel',
    tipo: 'PADEL',
    precioBaseHora: 8000,
    enMantenimiento: false,
  };

  it('renderiza el nombre, tipo, precio y estado disponible', () => {
    render(<CanchaCard cancha={mockCancha} />);

    expect(screen.getByText('Cancha 1 — Pádel')).toBeInTheDocument();
    expect(screen.getByText('Pádel')).toBeInTheDocument();
    expect(screen.getByText(/disponible/i)).toBeInTheDocument();
    // Precio formateado
    expect(screen.getByText(/8\.000/)).toBeInTheDocument();
  });

  it('renderiza correctamente el estado de mantenimiento', () => {
    const canchaMantenimiento: CanchaDTO = {
      ...mockCancha,
      enMantenimiento: true,
    };

    render(<CanchaCard cancha={canchaMantenimiento} />);

    expect(screen.getByText(/en mantenimiento/i)).toBeInTheDocument();
  });

  it('ejecuta onEditar al hacer clic en el botón de edición', () => {
    const handleEditar = vi.fn();
    render(<CanchaCard cancha={mockCancha} onEditar={handleEditar} />);

    const editBtn = screen.getByRole('button', { name: /editar/i });
    fireEvent.click(editBtn);

    expect(handleEditar).toHaveBeenCalledWith(mockCancha);
  });

  it('soporta modo de selección para reserva de turnos cuando showAdminControls es false', () => {
    const handleSelect = vi.fn();
    render(
      <CanchaCard
        cancha={mockCancha}
        showAdminControls={false}
        onSelect={handleSelect}
      />
    );

    const selectBtn = screen.getByRole('button', { name: /seleccionar cancha/i });
    fireEvent.click(selectBtn);

    expect(handleSelect).toHaveBeenCalledWith(mockCancha);
  });
});
