import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CuentaRegresiva } from './CuentaRegresiva';

describe('CuentaRegresiva Component', () => {
  it('renderiza correctamente los segundos restantes y el total', () => {
    render(<CuentaRegresiva segundosRestantes={45} totalSegundos={60} />);

    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByTestId('segundos-restantes')).toHaveTextContent('45s');
    expect(screen.getByText('/ 60s')).toBeInTheDocument();
  });

  it('calcula y aplica el ancho de la barra de progreso correctamente', () => {
    render(<CuentaRegresiva segundosRestantes={30} totalSegundos={60} />);

    const barra = screen.getByTestId('barra-progreso');
    expect(barra).toHaveStyle({ width: '50%' });
    expect(barra.className).toContain('bg-emerald-500');
  });

  it('aplica estilo de alerta (ámbar) cuando faltan entre 10 y 20 segundos', () => {
    render(<CuentaRegresiva segundosRestantes={15} totalSegundos={60} />);

    const barra = screen.getByTestId('barra-progreso');
    expect(barra.className).toContain('bg-amber-400');
    expect(screen.getByTestId('segundos-restantes').className).toContain('text-amber-600');
  });

  it('aplica estilo crítico/urgente (coral) cuando faltan menos de 10 segundos', () => {
    render(<CuentaRegresiva segundosRestantes={5} totalSegundos={60} />);

    const barra = screen.getByTestId('barra-progreso');
    expect(barra.className).toContain('bg-fitzone-coral');
    expect(screen.getByTestId('segundos-restantes').className).toContain('text-fitzone-coral');
  });

  it('permite ocultar la barra de progreso si mostrarBarra es false', () => {
    render(
      <CuentaRegresiva
        segundosRestantes={40}
        totalSegundos={60}
        mostrarBarra={false}
      />
    );

    expect(screen.queryByTestId('barra-progreso')).not.toBeInTheDocument();
    expect(screen.getByTestId('segundos-restantes')).toBeInTheDocument();
  });

  it('permite ocultar el contador textual si mostrarTexto es false', () => {
    render(
      <CuentaRegresiva
        segundosRestantes={40}
        totalSegundos={60}
        mostrarTexto={false}
      />
    );

    expect(screen.queryByTestId('segundos-restantes')).not.toBeInTheDocument();
    expect(screen.getByTestId('barra-progreso')).toBeInTheDocument();
  });

  it('restringe valores fuera del rango (menores a 0 o mayores a totalSegundos)', () => {
    const { rerender } = render(<CuentaRegresiva segundosRestantes={-5} totalSegundos={60} />);
    expect(screen.getByTestId('segundos-restantes')).toHaveTextContent('0s');
    expect(screen.getByTestId('barra-progreso')).toHaveStyle({ width: '0%' });

    rerender(<CuentaRegresiva segundosRestantes={100} totalSegundos={60} />);
    expect(screen.getByTestId('segundos-restantes')).toHaveTextContent('60s');
    expect(screen.getByTestId('barra-progreso')).toHaveStyle({ width: '100%' });
  });
});
