import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BuscadorDni } from './BuscadorDni';

describe('BuscadorDni Component', () => {
  it('renders input with placeholder and submit button', () => {
    render(<BuscadorDni placeholder="Buscar por documento..." />);
    expect(screen.getByPlaceholderText('Buscar por documento...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeInTheDocument();
  });

  it('triggers onSearch when form is submitted', () => {
    const handleSearch = vi.fn();
    render(<BuscadorDni value="30123456" onSearch={handleSearch} />);

    const button = screen.getByRole('button', { name: /buscar/i });
    fireEvent.click(button);

    expect(handleSearch).toHaveBeenCalledWith('30123456');
  });

  it('clears input when clear button is clicked', () => {
    const handleChange = vi.fn();
    const handleClear = vi.fn();

    render(
      <BuscadorDni
        value="12345678"
        onChange={handleChange}
        onClear={handleClear}
      />
    );

    const clearButton = screen.getByRole('button', { name: /limpiar búsqueda/i });
    fireEvent.click(clearButton);

    expect(handleClear).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith('');
  });
});
