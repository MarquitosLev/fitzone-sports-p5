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
      precioBase: 20000,
      esPico: true,
      recargoPico: 4000,
      porcentajeRecargoPico: 20,
      descuentoSocio: 3000,
      porcentajeDescuentoSocio: 15,
      esSocio: true,
      total: 21000,
    };

    render(<DesglosePrecio cotizacion={cotizacion} />);

    expect(screen.getByText(/descuento socio · −15%/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('−') && content.includes('3.000'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('21.000'))).toBeInTheDocument();
    expect(screen.getByText(/el descuento de socio se aplica sobre la tarifa base.*20\.000/i)).toBeInTheDocument();
    // Subtotal tachado
    const elements24000 = screen.getAllByText((content) => content.includes('24.000'));
    expect(elements24000.some((el) => el.classList.contains('line-through'))).toBe(true);
    expect(screen.getByText(/beneficio socio/i)).toBeInTheDocument();
  });

  it('no inventa recargo ni descuento si la cotización no los trae', () => {
    render(<DesglosePrecio precioBase={8000} esPico={true} esSocio={true} mostrarExplicacion={true} />);

    expect(screen.queryByText(/recargo horario pico/i)).toBeNull();
    expect(screen.queryByText(/descuento socio ·/i)).toBeNull();
    expect(screen.getByText(/los socios con la membresía vigente tienen descuento/i)).toBeInTheDocument();
  });
});
