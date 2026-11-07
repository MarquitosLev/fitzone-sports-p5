import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FormularioInvitado } from './FormularioInvitado';

function renderForm(props: Partial<React.ComponentProps<typeof FormularioInvitado>> = {}) {
  return render(
    <MemoryRouter>
      <FormularioInvitado onSubmit={vi.fn()} onCancelar={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('FormularioInvitado', () => {
  it('valida los campos antes de enviar', () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    fireEvent.click(screen.getByRole('button', { name: /reservar e ir a pagar/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/el dni debe tener/i)).toBeInTheDocument();
  });

  it('envía los datos normalizados: DNI sin puntos y email en minúsculas', () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Pérez' } });
    fireEvent.change(screen.getByLabelText('DNI'), { target: { value: '30.111.222' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '11 5555 0000' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'Ana@Mail.com' } });
    fireEvent.click(screen.getByRole('button', { name: /reservar e ir a pagar/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellido: 'Pérez',
      dni: '30111222',
      email: 'ana@mail.com',
      telefono: '11 5555 0000',
    });
  });

  it('si los datos son de una cuenta, ofrece iniciar sesión', () => {
    renderForm({ error: 'Esos datos pertenecen a una cuenta de FitZone.', pedirInicioSesion: true });

    expect(screen.getByText(/pertenecen a una cuenta/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /inici[aá] sesión/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('Volver cancela sin enviar', () => {
    const onCancelar = vi.fn();
    renderForm({ onCancelar });

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onCancelar).toHaveBeenCalled();
  });
});
