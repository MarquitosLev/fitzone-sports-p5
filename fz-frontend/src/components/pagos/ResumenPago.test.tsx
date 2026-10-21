import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumenPago } from './ResumenPago';
import type { DetalleItemPago } from '../../types';

describe('ResumenPago Component', () => {
  const detalleCancha: DetalleItemPago = {
    tipo: 'CANCHA',
    titulo: 'Pádel · Cancha 1 — Horario Pico',
    subtitulo: 'Sede FitZone Palermo',
    canchaNombre: 'Pádel Cristal',
    fecha: '20/10/2026',
    horario: '19:00 a 20:00 hs',
    cotizacion: {
      precioBase: 6667,
      esPico: true,
      recargoPico: 1333,
      porcentajeRecargoPico: 20,
      descuentoSocio: 1200,
      porcentajeDescuentoSocio: 15,
      esSocio: true,
      total: 6800,
    },
  };

  const detalleMembresia: DetalleItemPago = {
    tipo: 'MEMBRESIA',
    titulo: 'Renovación Membresía · Plan Trimestral',
    subtitulo: 'Acceso Total',
    planNombre: 'Plan Trimestral FitZone',
    duracionMeses: 3,
    fechaVencimiento: '31/01/2027',
  };

  it('renderiza título del ítem, detalles informativos y monto formateado', () => {
    render(
      <ResumenPago
        detalle={detalleCancha}
        montoTotal={6800}
        onConfirmarPago={vi.fn()}
      />
    );

    expect(screen.getByText('Pádel · Cancha 1 — Horario Pico')).toBeInTheDocument();
    expect(screen.getByText('Sede FitZone Palermo')).toBeInTheDocument();
    expect(screen.getByText('19:00 a 20:00 hs')).toBeInTheDocument();
    expect(screen.getAllByText((content) => content.includes('6.800')).length).toBeGreaterThanOrEqual(1);
  });

  it('integra el componente DesglosePrecio cuando el ítem es de tipo CANCHA', () => {
    render(
      <ResumenPago
        detalle={detalleCancha}
        montoTotal={6800}
        onConfirmarPago={vi.fn()}
      />
    );

    // Debe mostrar los conceptos de DesglosePrecio
    expect(screen.getByText(/desglose del turno/i)).toBeInTheDocument();
    expect(screen.getByText(/beneficio socio/i)).toBeInTheDocument();
    expect(screen.getByText(/descuento socio activo · −15%/i)).toBeInTheDocument();
  });

  it('renderiza resumen de abono cuando el ítem es de tipo MEMBRESIA', () => {
    render(
      <ResumenPago
        detalle={detalleMembresia}
        montoTotal={38000}
        onConfirmarPago={vi.fn()}
      />
    );

    expect(screen.getByText('Renovación Membresía · Plan Trimestral')).toBeInTheDocument();
    expect(screen.getByText(/período de cobertura:/i)).toBeInTheDocument();
    expect(screen.getByText('3 meses')).toBeInTheDocument();
    expect(screen.getByText('31/01/2027')).toBeInTheDocument();
    expect(screen.getAllByText((content) => content.includes('38.000')).length).toBeGreaterThanOrEqual(1);
  });

  it('ejecuta onConfirmarPago con token aprobado por defecto al presionar Pagar', () => {
    const handlePagar = vi.fn();
    render(
      <ResumenPago
        detalle={detalleCancha}
        montoTotal={6800}
        onConfirmarPago={handlePagar}
      />
    );

    const botonPagar = screen.getByRole('button', { name: /pagar/i });
    fireEvent.click(botonPagar);

    expect(handlePagar).toHaveBeenCalledWith('tok_mock_aprobado');
  });

  it('permite alternar el token simulado para probar rechazos en pasarela (RNF-02)', () => {
    const handlePagar = vi.fn();
    render(
      <ResumenPago
        detalle={detalleCancha}
        montoTotal={6800}
        onConfirmarPago={handlePagar}
        permitirSimularRechazo={true}
      />
    );

    const radioRechazo = screen.getByLabelText(/simular rechazo/i);
    fireEvent.click(radioRechazo);

    const botonPagar = screen.getByRole('button', { name: /pagar/i });
    fireEvent.click(botonPagar);

    expect(handlePagar).toHaveBeenCalledWith('tok_mock_rechazado');
  });

  it('deshabilita el botón Pagar mientras isProcessing es true para prevenir doble cobro', () => {
    const handlePagar = vi.fn();
    render(
      <ResumenPago
        detalle={detalleCancha}
        montoTotal={6800}
        isProcessing={true}
        onConfirmarPago={handlePagar}
      />
    );

    const botonPagar = screen.getByRole('button');
    expect(botonPagar).toBeDisabled();
    expect(screen.getByText(/procesando pago seguro/i)).toBeInTheDocument();

    fireEvent.click(botonPagar);
    expect(handlePagar).not.toHaveBeenCalled();
  });
});
