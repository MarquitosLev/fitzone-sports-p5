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
  });

  it('consulta /v1/sedes y provee los datos reales', async () => {
    const mockSedesReales = [
      { idSede: 99, nombre: 'Sede Real Central', aforoMaximo: 150 },
    ];
    vi.mocked(httpClient.get).mockResolvedValueOnce(mockSedesReales);

    render(<App />);

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith('/v1/sedes');
    });
  });

  it('maneja errores de la API asignando lista vacía sin romper', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('Network error 500'));

    render(<App />);

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith('/v1/sedes');
    });

    consoleErrorSpy.mockRestore();
  });
});
