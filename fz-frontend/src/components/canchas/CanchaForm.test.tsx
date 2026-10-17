import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CanchaForm } from './CanchaForm';

describe('CanchaForm', () => {
  it('renderiza correctamente los campos en modo alta', () => {
    render(
      <CanchaForm
        modo="alta"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/nombre de la cancha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de deporte/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/precio base por hora/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear cancha/i })).toBeInTheDocument();
  });

  it('muestra errores de validación si los campos requeridos están vacíos', async () => {
    const handleSubmit = vi.fn();
    render(
      <CanchaForm
        modo="alta"
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /crear cancha/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/el nombre de la cancha es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/el precio base por hora debe ser mayor a 0/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos correctos cuando el formulario es válido', async () => {
    const handleSubmit = vi.fn();
    render(
      <CanchaForm
        modo="alta"
        onSubmit={handleSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText(/nombre de la cancha/i), {
      target: { value: 'Cancha 4 — Pádel' },
    });
    fireEvent.change(screen.getByLabelText(/tipo de deporte/i), {
      target: { value: 'PADEL' },
    });
    fireEvent.change(screen.getByLabelText(/precio base por hora/i), {
      target: { value: '9500' },
    });

    fireEvent.click(screen.getByRole('button', { name: /crear cancha/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        nombre: 'Cancha 4 — Pádel',
        tipo: 'PADEL',
        precioBaseHora: 9500,
        enMantenimiento: false,
      });
    });
  });

  it('carga los valores iniciales en modo edición y muestra Guardar Cambios', () => {
    render(
      <CanchaForm
        modo="edicion"
        valoresIniciales={{
          idCancha: 1,
          nombre: 'Cancha Central Tenis',
          tipo: 'TENIS',
          precioBaseHora: 15000,
          enMantenimiento: false,
          sede: { idSede: 1, nombre: 'Palermo', aforoMaximo: 80 },
        }}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByDisplayValue('Cancha Central Tenis')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('muestra el mensaje de error de negocio devuelto por el backend', () => {
    render(
      <CanchaForm
        modo="alta"
        onSubmit={vi.fn()}
        errorNegocio="Ya existe una cancha con ese nombre en la sede seleccionada"
      />
    );

    const errorElements = screen.getAllByText(
      'Ya existe una cancha con ese nombre en la sede seleccionada'
    );
    expect(errorElements.length).toBeGreaterThanOrEqual(1);
  });
});
