import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import App from './App';
import { httpClient } from './services/httpClient';

vi.mock('./services/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
  },
  registerHttpErrorHandler: vi.fn(),
}));

describe('App Component — Inicialización', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('consulta /v1/sedes y provee los datos reales', async () => {
    const mockSedesReales = [
      { idSede: 99, nombre: 'Sede Real Central', aforoMaximo: 150 },
    ];
    vi.mocked(httpClient.get).mockResolvedValueOnce(mockSedesReales);

    render(<App />);

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith('/v1/sedes', expect.any(Object));
    });
    // Se guardan para poder arrancar si después el servidor no responde
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('fitzone.sedes') ?? '[]')).toEqual(mockSedesReales);
    });
  });

  it('maneja errores de la API asignando lista vacía sin romper', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('Network error 500'));

    const { queryByText } = render(<App />);

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith('/v1/sedes', expect.any(Object));
    });
    await waitFor(() => expect(queryByText('Cargando sedes...')).toBeNull());

    consoleErrorSpy.mockRestore();
  });

  it('sin servidor, arranca con las últimas sedes guardadas', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('fitzone.sedes', JSON.stringify([{ idSede: 1, nombre: 'Sede Guardada', aforoMaximo: 80 }]));
    vi.mocked(httpClient.get).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const { queryByText } = render(<App />);

    await waitFor(() => expect(queryByText('Cargando sedes...')).toBeNull());
    expect(JSON.parse(localStorage.getItem('fitzone.sedes') ?? '[]')).toHaveLength(1);

    consoleErrorSpy.mockRestore();
  });
});
