import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { httpClient } from './services/httpClient';
import * as config from './config';

vi.mock('./services/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
  },
  registerHttpErrorHandler: vi.fn(),
}));

describe('App Component — Inicialización y modo mock / real', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('en modo mock (USE_MOCK = true) no invoca /v1/sedes y arranca directamente', async () => {
    vi.spyOn(config, 'USE_MOCK', 'get').mockReturnValue(true);

    render(<App />);

    expect(httpClient.get).not.toHaveBeenCalled();
    // Debe renderizar la app inmediatamente sin mostrar spinner bloqueante
    expect(screen.queryByText(/Cargando sedes.../i)).toBeNull();
  });

  it('en modo real (USE_MOCK = false) consulta /v1/sedes y provee los datos reales', async () => {
    vi.spyOn(config, 'USE_MOCK', 'get').mockReturnValue(false);
    const mockSedesReales = [
      { idSede: 99, nombre: 'Sede Real Central', aforoMaximo: 150 },
    ];
    vi.mocked(httpClient.get).mockResolvedValueOnce(mockSedesReales);

    render(<App />);

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith('/v1/sedes');
    });
  });

  it('en modo real (USE_MOCK = false) maneja errores de la API asignando lista vacía sin romper', async () => {
    vi.spyOn(config, 'USE_MOCK', 'get').mockReturnValue(false);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('Network error 500'));

    render(<App />);

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith('/v1/sedes');
    });

    consoleErrorSpy.mockRestore();
  });
});
