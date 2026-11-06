import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DesglosePrecio } from './DesglosePrecio';
import type { CotizacionReservaDTO } from '../../types';

describe('DesglosePrecio Component', () => {
  it('renderiza tarifa base y total estándar sin recargo ni descuento', () => {
    render(
      <DesglosePrecio
        precioBase={8000}
        esPico={false}
        esSocio={false}
      />
    );

    expect(screen.getByText('Tarifa base · 1 hora')).toBeInTheDocument();
    expect(screen.getByText('Total final')).toBeInTheDocument();
    expect(screen.getAllByText((content) => content.includes('8.000')).length).toBeGreaterThanOrEqual(2);
  });

  it('muestra el recargo de horario pico que trae la cotización', () => {
    render(
      <DesglosePrecio
        precioBase={10000}
        esPico={true}
        recargoPico={2000}
        esSocio={false}
        total={12000}
      />
    );

    expect(screen.getByText(/recargo horario pico/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('+') && content.includes('2.000'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('12.000'))).toBeInTheDocument();
  });

  it('muestra el descuento de socio de la cotización y el precio tachado', () => {
    const cotizacion: CotizacionReservaDTO = {
      precioBase: 10000,
      esPico: true,
      recargoPico: 2000,
      porcentajeRecargoPico: 20,
      descuentoSocio: 1800,
      porcentajeDescuentoSocio: 15,
      esSocio: true,
      total: 10200,
    };

    render(<DesglosePrecio cotizacion={cotizacion} />);

    expect(screen.getByText(/descuento socio · −15%/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('−') && content.includes('1.800'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('10.200'))).toBeInTheDocument();
    // Subtotal tachado
    const elements12000 = screen.getAllByText((content) => content.includes('12.000'));
    expect(elements12000.some((el) => el.classList.contains('line-through'))).toBe(true);
    expect(screen.getByText(/beneficio socio/i)).toBeInTheDocument();
  });

  it('no inventa recargo ni descuento si la cotización no los trae', () => {
    render(<DesglosePrecio precioBase={8000} esPico={true} esSocio={true} mostrarExplicacion={true} />);

    expect(screen.queryByText(/recargo horario pico/i)).toBeNull();
    expect(screen.queryByText(/descuento socio ·/i)).toBeNull();
    expect(screen.getByText(/los socios con la membresía vigente tienen descuento/i)).toBeInTheDocument();
  });
});
