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

  it('muestra recargo por horario pico (+20%) cuando esPico es true', () => {
    render(
      <DesglosePrecio
        precioBase={10000}
        esPico={true}
        recargoPico={2000}
        esSocio={false}
        total={12000}
      />
    );

    expect(screen.getByText(/horario pico \(19 a 21 hs\) · \+20%/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('+') && content.includes('2.000'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('12.000'))).toBeInTheDocument();
  });

  it('muestra beneficio de socio (-15%) y precio tachado cuando esSocio es true', () => {
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

    expect(screen.getByText(/descuento socio activo · −15%/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('−') && content.includes('1.800'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('10.200'))).toBeInTheDocument();
    // Subtotal tachado
    const elements12000 = screen.getAllByText((content) => content.includes('12.000'));
    expect(elements12000.some((el) => el.classList.contains('line-through'))).toBe(true);
    expect(screen.getByText(/beneficio socio/i)).toBeInTheDocument();
  });

  it('renderiza nota explicativa sobre el cálculo de descuentos', () => {
    render(
      <DesglosePrecio
        precioBase={8000}
        esSocio={true}
        mostrarExplicacion={true}
      />
    );

    expect(
      screen.getByText(/el beneficio del 15% para socios se aplica sobre la tarifa calculada/i)
    ).toBeInTheDocument();
  });
});
