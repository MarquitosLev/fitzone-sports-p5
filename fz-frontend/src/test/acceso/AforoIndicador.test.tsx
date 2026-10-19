/**
 * AforoIndicador.test.tsx — Pruebas unitarias para el monitor de aforo en tiempo real (RF-05).
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AforoIndicador } from '../../components/acceso/AforoIndicador';

describe('AforoIndicador Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza correctamente el porcentaje y el conteo de aforo', () => {
    render(
      <AforoIndicador
        aforo={{ aforoActual: 40, aforoMaximo: 80, porcentaje: 50 }}
        nombreSede="FitZone Palermo"
      />
    );

    expect(screen.getByTestId('aforo-indicador-porcentaje')).toHaveTextContent('50%');
    expect(screen.getByTestId('aforo-indicador-conteo')).toHaveTextContent('40 / 80 personas');
    expect(screen.getByTestId('aforo-indicador-disponibles')).toHaveTextContent('40 lugares');
    expect(screen.getByText('FitZone Palermo')).toBeInTheDocument();
  });

  it('aplica umbral verde (< 70%) en la barra de ocupación', () => {
    render(
      <AforoIndicador
        aforo={{ aforoActual: 30, aforoMaximo: 80, porcentaje: 37.5 }}
      />
    );

    const barra = screen.getByTestId('aforo-indicador-barra');
    expect(barra).toHaveAttribute('data-color', 'green');
    expect(screen.getByText('OCUPACIÓN NORMAL')).toBeInTheDocument();
    expect(screen.queryByTestId('aforo-indicador-alerta')).not.toBeInTheDocument();
  });

  it('aplica umbral ámbar (70% - 84%) cuando la ocupación es elevada', () => {
    render(
      <AforoIndicador
        aforo={{ aforoActual: 60, aforoMaximo: 80, porcentaje: 75 }}
      />
    );

    const barra = screen.getByTestId('aforo-indicador-barra');
    expect(barra).toHaveAttribute('data-color', 'amber');
    expect(screen.getByText('OCUPACIÓN ELEVADA')).toBeInTheDocument();
    expect(screen.queryByTestId('aforo-indicador-alerta')).not.toBeInTheDocument();
  });

  it('aplica umbral rojo (>= 85%) y muestra banner de alerta de capacidad crítica (RF-05)', () => {
    render(
      <AforoIndicador
        aforo={{ aforoActual: 72, aforoMaximo: 80, porcentaje: 90 }}
      />
    );

    const barra = screen.getByTestId('aforo-indicador-barra');
    expect(barra).toHaveAttribute('data-color', 'red');
    expect(screen.getByText('ALERTA DE CAPACIDAD')).toBeInTheDocument();
    expect(screen.getByTestId('aforo-indicador-alerta')).toBeInTheDocument();
    expect(screen.getByText(/Capacidad crítica de la sede/i)).toBeInTheDocument();
  });

  it('ejecuta polling periódico cada pollingIntervalMs si se proporciona onRefresh', () => {
    const onRefreshMock = vi.fn();
    render(
      <AforoIndicador
        aforo={{ aforoActual: 20, aforoMaximo: 80, porcentaje: 25 }}
        onRefresh={onRefreshMock}
        pollingIntervalMs={5000}
      />
    );

    expect(onRefreshMock).not.toHaveBeenCalled();

    // Avanzamos 5 segundos
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onRefreshMock).toHaveBeenCalledTimes(1);

    // Avanzamos otros 5 segundos
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onRefreshMock).toHaveBeenCalledTimes(2);
  });

  it('limpia el timer de polling al desmontar el componente', () => {
    const onRefreshMock = vi.fn();
    const { unmount } = render(
      <AforoIndicador
        aforo={{ aforoActual: 20, aforoMaximo: 80, porcentaje: 25 }}
        onRefresh={onRefreshMock}
        pollingIntervalMs={5000}
      />
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(onRefreshMock).not.toHaveBeenCalled();
  });

  it('permite refresco manual al hacer clic en el botón de actualización', () => {
    const onRefreshMock = vi.fn();
    render(
      <AforoIndicador
        aforo={{ aforoActual: 20, aforoMaximo: 80, porcentaje: 25 }}
        onRefresh={onRefreshMock}
      />
    );

    const btn = screen.getByRole('button', { name: /actualizar aforo manualmente/i });
    fireEvent.click(btn);

    expect(onRefreshMock).toHaveBeenCalledTimes(1);
  });
});
