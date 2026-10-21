import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultadoPago } from './ResultadoPago';
import type { TransaccionDTO, ComprobanteDTO } from '../../types';

describe('ResultadoPago Component', () => {
  const transaccionConfirmada: TransaccionDTO = {
    idTransaccion: 10,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-socio-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas@fitzone.com',
      telefono: '11-1234-5678',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    membresiaId: null,
    reservaCanchaId: 5,
    concepto: 'RESERVA_SOCIO',
    monto: 6800,
    estadoPago: 'CONFIRMADO',
    tokenTransaccionPasarela: 'tok_mock_aprobado',
    fechaHoraCreacion: '2026-10-20T19:00:00',
    fechaHoraConfirmacion: '2026-10-20T19:01:00',
    descripcion: 'Pádel · Cancha 1 (Turno 19 a 20 hs)',
  };

  const comprobanteMock: ComprobanteDTO = {
    idComprobante: 10,
    transaccion: transaccionConfirmada,
    numeroFactura: 'FAC-0001-00000842',
    tipoComprobante: 'FACTURA_B',
    cae: '71239845612304',
    fechaVencimientoCae: '30/10/2026',
    urlDescargaPdf: '',
  };

  const transaccionRechazada: TransaccionDTO = {
    ...transaccionConfirmada,
    idTransaccion: 11,
    estadoPago: 'RECHAZADO',
    fechaHoraConfirmacion: null,
    motivoRechazo: 'Límite diario de compras excedido en la tarjeta bancaria.',
  };

  it('renderiza vista de éxito con número de factura, CAE y botón de descarga cuando estado es CONFIRMADO', () => {
    render(
      <ResultadoPago
        transaccion={transaccionConfirmada}
        comprobante={comprobanteMock}
      />
    );

    expect(screen.getByText('¡Pago Confirmado!')).toBeInTheDocument();
    expect(screen.getByText('FAC-0001-00000842')).toBeInTheDocument();
    expect(screen.getByText(/71239845612304/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descargar pdf/i })).toBeInTheDocument();
  });

  it('renderiza vista de rechazo con Alert explicativo y botón Reintentar cuando estado es RECHAZADO', () => {
    const handleReintentar = vi.fn();

    render(
      <ResultadoPago
        transaccion={transaccionRechazada}
        onReintentar={handleReintentar}
      />
    );

    expect(screen.getByText('Pago Rechazado')).toBeInTheDocument();
    expect(screen.getByText(/límite diario de compras excedido/i)).toBeInTheDocument();

    const botonReintentar = screen.getByRole('button', { name: /reintentar pago/i });
    expect(botonReintentar).toBeInTheDocument();

    fireEvent.click(botonReintentar);
    expect(handleReintentar).toHaveBeenCalledTimes(1);
  });

  it('permite regresar mediante el botón Volver si onVolver es provisto', () => {
    const handleVolver = vi.fn();

    render(
      <ResultadoPago
        transaccion={transaccionConfirmada}
        comprobante={comprobanteMock}
        onVolver={handleVolver}
      />
    );

    const botonVolver = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(botonVolver);

    expect(handleVolver).toHaveBeenCalledTimes(1);
  });
});
