import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QrDinamico } from './QrDinamico';

describe('QrDinamico Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza el código QR en SVG a partir del token recibido', () => {
    render(<QrDinamico token="FITZONE-TEST-TOKEN-12345" duracionSegundos={60} />);

    expect(screen.getByTestId('qr-dinamico')).toBeInTheDocument();
    expect(screen.getByTestId('qr-svg')).toBeInTheDocument();
    // Verifica que el QR contenga el atributo aria-label con el token
    const svg = screen.getByLabelText(/Código QR de acceso con token FITZONE-TEST-TOKEN-12345/i);
    expect(svg).toBeInTheDocument();
  });

  it('incluye el componente CuentaRegresiva con el tiempo inicial configurado', () => {
    render(<QrDinamico token="TOKEN-1" duracionSegundos={60} />);

    expect(screen.getByTestId('cuenta-regresiva')).toBeInTheDocument();
    expect(screen.getByTestId('segundos-restantes')).toHaveTextContent('60s');
  });

  it('solicita automáticamente un nuevo token cuando el contador llega a cero', () => {
    const onSolicitarMock = vi.fn();

    render(
      <QrDinamico
        token="TOKEN-AUTO-REFRESH"
        duracionSegundos={10}
        onSolicitarNuevoToken={onSolicitarMock}
      />
    );

    expect(onSolicitarMock).not.toHaveBeenCalled();

    // Avanzamos 5 segundos
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId('segundos-restantes')).toHaveTextContent('5s');
    expect(onSolicitarMock).not.toHaveBeenCalled();

    // Avanzamos los 5 segundos restantes para llegar a 0
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSolicitarMock).toHaveBeenCalledTimes(1);
  });

  it('dispara onSolicitarNuevoToken al hacer clic en el botón de actualización manual', () => {
    const onSolicitarMock = vi.fn();

    render(
      <QrDinamico
        token="TOKEN-MANUAL"
        duracionSegundos={60}
        onSolicitarNuevoToken={onSolicitarMock}
      />
    );

    const btnActualizar = screen.getByTestId('btn-actualizar-qr');
    fireEvent.click(btnActualizar);

    expect(onSolicitarMock).toHaveBeenCalledTimes(1);
  });

  it('muestra estado de carga mientras se solicita un nuevo token', () => {
    render(<QrDinamico token="TOKEN-LOADING" cargando={true} />);

    expect(screen.getByTestId('qr-cargando')).toBeInTheDocument();
    expect(screen.getByText('Generando nuevo token...')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-svg')).not.toBeInTheDocument();
  });

  it('muestra mensaje de error y botón de reintento si la solicitud falla', () => {
    const onReintentarMock = vi.fn();

    render(
      <QrDinamico
        token=""
        error="Fallo en el servicio de tokens"
        onSolicitarNuevoToken={onReintentarMock}
      />
    );

    expect(screen.getByTestId('qr-error')).toBeInTheDocument();
    expect(screen.getByText('Fallo en el servicio de tokens')).toBeInTheDocument();

    const btnReintentar = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(btnReintentar);
    expect(onReintentarMock).toHaveBeenCalledTimes(1);
  });

  it('resetea el contador cuando la prop token se actualiza', () => {
    const { rerender } = render(<QrDinamico token="TOKEN-A" duracionSegundos={60} />);

    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(screen.getByTestId('segundos-restantes')).toHaveTextContent('40s');

    // Cambia el token
    rerender(<QrDinamico token="TOKEN-B" duracionSegundos={60} />);
    expect(screen.getByTestId('segundos-restantes')).toHaveTextContent('60s');
  });
});
