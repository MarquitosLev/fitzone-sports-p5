import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PagoItem } from './PagoItem';
import type { TransaccionDTO, ComprobanteDTO } from '../../types';

describe('PagoItem Component', () => {
  const transaccionConfirmada: TransaccionDTO = {
    idTransaccion: 1,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-1',
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
    reservaCanchaId: 3,
    concepto: 'RESERVA_SOCIO',
    monto: 6800,
    estadoPago: 'CONFIRMADO',
    tokenTransaccionPasarela: 'tok_mock_aprobado',
    fechaHoraCreacion: '2026-10-15T14:00:00',
    fechaHoraConfirmacion: '2026-10-15T14:01:30',
    descripcion: 'Pádel · Cancha 1 (Turno 19:00 a 20:00 hs)',
  };

  const comprobante: ComprobanteDTO = {
    idComprobante: 1,
    transaccion: transaccionConfirmada,
    numeroFactura: 'FAC-0001-00000123',
    tipoComprobante: 'FACTURA_B',
    cae: '74125896301245',
    fechaVencimientoCae: '25/10/2026',
    urlDescargaPdf: '',
  };

  const transaccionRechazada: TransaccionDTO = {
    ...transaccionConfirmada,
    idTransaccion: 2,
    estadoPago: 'RECHAZADO',
    monto: 8000,
    fechaHoraConfirmacion: null,
    descripcion: 'Fútbol 5 · Cancha 1 (Turno 20:00 a 21:00 hs)',
    motivoRechazo: 'Límite diario de compras excedido.',
  };

  it('renderiza concepto, fecha formateada, monto y StatusBadge de confirmado', () => {
    render(
      <PagoItem
        transaccion={transaccionConfirmada}
        comprobante={comprobante}
      />
    );

    expect(screen.getByText('Pádel · Cancha 1 (Turno 19:00 a 20:00 hs)')).toBeInTheDocument();
    expect(screen.getByText(/FAC-0001-00000123/)).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('6.800'))).toBeInTheDocument();
    expect(screen.getByText(/confirmado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comprobante/i })).toBeInTheDocument();
  });

  it('muestra botón Reintentar y motivo cuando el pago está RECHAZADO', () => {
    const handleReintentar = vi.fn();

    render(
      <PagoItem
        transaccion={transaccionRechazada}
        onReintentar={handleReintentar}
      />
    );

    expect(screen.getByText('Fútbol 5 · Cancha 1 (Turno 20:00 a 21:00 hs)')).toBeInTheDocument();
    expect(screen.getByText(/motivo: límite diario de compras excedido/i)).toBeInTheDocument();
    expect(screen.getByText(/rechazado/i)).toBeInTheDocument();

    const botonReintentar = screen.getByRole('button', { name: /reintentar/i });
    expect(botonReintentar).toBeInTheDocument();

    fireEvent.click(botonReintentar);
    expect(handleReintentar).toHaveBeenCalledWith(transaccionRechazada);
  });
});
