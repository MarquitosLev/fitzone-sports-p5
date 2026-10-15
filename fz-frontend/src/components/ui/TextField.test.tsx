import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextField } from './TextField';

describe('TextField Component', () => {
  it('renders label and input correctly', () => {
    render(<TextField label="Email" placeholder="ejemplo@fitzone.com" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ejemplo@fitzone.com/i)).toBeInTheDocument();
  });

  it('handles typing and onChange events', () => {
    const handleChange = vi.fn();
    render(<TextField label="Nombre" onChange={handleChange} />);
    const input = screen.getByLabelText(/nombre/i);
    fireEvent.change(input, { target: { value: 'Maximiliano' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders error message and marks aria-invalid', () => {
    render(<TextField label="DNI" error="El DNI es obligatorio" />);
    const input = screen.getByLabelText(/dni/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('El DNI es obligatorio')).toBeInTheDocument();
  });

  it('toggles password visibility when button is clicked', () => {
    render(<TextField label="Clave de acceso" type="password" />);
    const input = screen.getByLabelText('Clave de acceso');
    expect(input).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /ver contraseña/i });
    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(input).toHaveAttribute('type', 'password');
  });
});
