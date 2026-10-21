/**
 * pagosService.test.ts — Pruebas unitarias para pagosService (RF-13, RF-14, SCRUM-86).
 * Valida flujos de pago aprobado, pago rechazado, reintentos con prevención de BUG-03 y emisión de comprobantes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  listarPagos,
  procesarPago,
  reintentarPago,
  obtenerComprobantePorTransaccion,
  descargarComprobantePdf,
  _resetMockPagos,
} from '../pagosService';
import type { ProcesarPagoPayload } from '../../types';

describe('pagosService (SCRUM-86, RF-13, RF-14)', () => {
  beforeEach(() => {
    _resetMockPagos();
  });

  describe('listarPagos', () => {
    it('obtiene las transacciones filtrando por sede', async () => {
      const pagosSede1 = await listarPagos(1);
      expect(pagosSede1.length).toBeGreaterThan(0);
      expect(pagosSede1.every((p) => p.sede.idSede === 1)).toBe(true);
    });

    it('permite filtrar transacciones por idUsuario', async () => {
      const pagosLucas = await listarPagos(1, 1);
      expect(pagosLucas.every((p) => p.usuario.idUsuario === 1)).toBe(true);
    });
  });

  describe('procesarPago (Checkout Simulado)', () => {
    it('aprueba un pago con token exitoso y emite automáticamente el comprobante fiscal', async () => {
      const payload: ProcesarPagoPayload = {
        idSede: 1,
        idUsuario: 1,
        concepto: 'RESERVA_SOCIO',
        monto: 6800,
        tokenTransaccionPasarela: 'tok_mock_aprobado',
        idReservaCancha: 20,
        tipoComprobante: 'FACTURA_B',
        detalleItem: {
          tipo: 'CANCHA',
          titulo: 'Pádel · Cancha 1 (Turno 19 a 20 hs)',
        },
      };

      const resultado = await procesarPago(payload);

      expect(resultado.aprobado).toBe(true);
      expect(resultado.transaccion.estadoPago).toBe('CONFIRMADO');
      expect(resultado.transaccion.monto).toBe(6800);
      expect(resultado.transaccion.fechaHoraConfirmacion).toBeTruthy();
      expect(resultado.comprobante).not.toBeNull();
      expect(resultado.comprobante?.numeroFactura).toMatch(/^FAC-0001-/);
      expect(resultado.comprobante?.cae).toBeTruthy();
    });

    it('registra una transacción en estado RECHAZADO cuando la pasarela deniega la operación', async () => {
      const payload: ProcesarPagoPayload = {
        idSede: 1,
        idUsuario: 1,
        concepto: 'MEMBRESIA_SOCIO',
        monto: 15000,
        tokenTransaccionPasarela: 'tok_mock_rechazado',
        idMembresia: 5,
        detalleItem: {
          tipo: 'MEMBRESIA',
          titulo: 'Plan Premium Mensual',
        },
      };

      const resultado = await procesarPago(payload);

      expect(resultado.aprobado).toBe(false);
      expect(resultado.transaccion.estadoPago).toBe('RECHAZADO');
      expect(resultado.transaccion.fechaHoraConfirmacion).toBeNull();
      expect(resultado.transaccion.motivoRechazo).toContain('Límite diario');
      expect(resultado.comprobante).toBeNull();
    });
  });

  describe('reintentarPago y Prevención de BUG-03', () => {
    it('CRÍTICO (BUG-03): al reintentar un pago rechazado de cancha, preserva la reserva y el arancel original', async () => {
      // La transacción mock ID 2 es un pago rechazado de Cancha por $8.000
      const pagosIniciales = await listarPagos(1);
      const txRechazada = pagosIniciales.find((p) => p.idTransaccion === 2);

      expect(txRechazada).toBeDefined();
      expect(txRechazada?.estadoPago).toBe('RECHAZADO');
      expect(txRechazada?.concepto).toBe('RESERVA_SOCIO');
      expect(txRechazada?.reservaCanchaId).toBe(4);
      expect(txRechazada?.monto).toBe(8000);

      // Reintentamos con pasarela aprobada
      const resultadoReintento = await reintentarPago(2, 'tok_mock_aprobado');

      expect(resultadoReintento.aprobado).toBe(true);
      // BUG-03 CHECK: No debe mutar a membresía ($15.000) ni perder la referencia a la cancha
      expect(resultadoReintento.transaccion.idTransaccion).toBe(2);
      expect(resultadoReintento.transaccion.concepto).toBe('RESERVA_SOCIO');
      expect(resultadoReintento.transaccion.reservaCanchaId).toBe(4);
      expect(resultadoReintento.transaccion.monto).toBe(8000);
      expect(resultadoReintento.transaccion.estadoPago).toBe('CONFIRMADO');
      expect(resultadoReintento.transaccion.fechaHoraConfirmacion).toBeTruthy();

      // Debe haber generado el comprobante correspondiente
      expect(resultadoReintento.comprobante).not.toBeNull();
      expect(resultadoReintento.comprobante?.numeroFactura).toBeTruthy();
    });

    it('si el reintento vuelve a fallar con token rechazado, permanece en estado RECHAZADO', async () => {
      const resultado = await reintentarPago(2, 'tok_mock_rechazado');

      expect(resultado.aprobado).toBe(false);
      expect(resultado.transaccion.estadoPago).toBe('RECHAZADO');
      expect(resultado.comprobante).toBeNull();
    });

    it('lanza error si la transacción a reintentar no existe', async () => {
      await expect(reintentarPago(99999)).rejects.toThrow('no encontrada');
    });
  });

  describe('obtenerComprobantePorTransaccion y descargarComprobantePdf', () => {
    it('obtiene el comprobante existente de una transacción confirmada', async () => {
      const comprobante = await obtenerComprobantePorTransaccion(1);
      expect(comprobante).not.toBeNull();
      expect(comprobante?.numeroFactura).toBe('FAC-0001-00000123');
    });

    it('devuelve null si la transacción no posee comprobante emitido', async () => {
      const comprobante = await obtenerComprobantePorTransaccion(2); // tx 2 arranca rechazada
      expect(comprobante).toBeNull();
    });

    it('genera y descarga un Blob PDF-1.4 estructuralmente válido y renderizable', async () => {
      const blob = await descargarComprobantePdf(1);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(100);

      const textoPdf = await blob.text();
      // Validar estándar PDF-1.4
      expect(textoPdf.startsWith('%PDF-1.4')).toBe(true);
      expect(textoPdf).toContain('/Type /Catalog');
      expect(textoPdf).toContain('/Type /Pages');
      expect(textoPdf).toContain('/Type /Page');
      expect(textoPdf).toContain('/Font');
      expect(textoPdf).toContain('stream');
      expect(textoPdf).toContain('endstream');
      expect(textoPdf).toContain('xref');
      expect(textoPdf).toContain('trailer');
      expect(textoPdf).toContain('startxref');
      expect(textoPdf.trim().endsWith('%%EOF')).toBe(true);
    });
  });

  describe('Validaciones de seguridad y payload de checkout', () => {
    it('rechaza montos menores o iguales a cero', async () => {
      const payloadInvalido = {
        idSede: 1,
        idUsuario: 1,
        concepto: 'RESERVA_SOCIO' as const,
        monto: 0,
        tokenTransaccionPasarela: 'tok_mock_aprobado',
      };
      await expect(procesarPago(payloadInvalido)).rejects.toThrow('monto a debitar debe ser un número positivo');
    });

    it('rechaza cuando no se especifica token de pasarela', async () => {
      const payloadSinToken = {
        idSede: 1,
        idUsuario: 1,
        concepto: 'RESERVA_SOCIO' as const,
        monto: 5000,
        tokenTransaccionPasarela: '   ',
      };
      await expect(procesarPago(payloadSinToken)).rejects.toThrow('token de transacción');
    });

    it('rechaza sede o usuario inválidos', async () => {
      const payloadSedeInvalida = {
        idSede: 0,
        idUsuario: 1,
        concepto: 'RESERVA_SOCIO' as const,
        monto: 5000,
        tokenTransaccionPasarela: 'tok_mock_aprobado',
      };
      await expect(procesarPago(payloadSedeInvalida)).rejects.toThrow('sede especificada no es válida');
    });

    it('exige CUIT válido con formato XX-XXXXXXXX-X para Factura A', async () => {
      const payloadFacturaA = {
        idSede: 1,
        idUsuario: 1,
        concepto: 'RESERVA_SOCIO' as const,
        monto: 5000,
        tokenTransaccionPasarela: 'tok_mock_aprobado',
        tipoComprobante: 'FACTURA_A' as const,
        cuitFacturaA: '20123456789', // Formato sin guiones
      };
      await expect(procesarPago(payloadFacturaA)).rejects.toThrow('CUIT válido (formato XX-XXXXXXXX-X)');
    });

    it('protege contra doble cobro si se intenta reintentar una transacción ya confirmada', async () => {
      // La transacción 1 ya está confirmada
      await expect(reintentarPago(1, 'tok_mock_aprobado')).rejects.toThrow('ya se encuentra confirmada');
    });

    it('retorna transacciones en estado REEMBOLSADO en el historial de la sede', async () => {
      const pagos = await listarPagos(1);
      const reembolsado = pagos.find((p) => p.estadoPago === 'REEMBOLSADO');
      expect(reembolsado).toBeDefined();
      expect(reembolsado?.idTransaccion).toBe(5);
      expect(reembolsado?.monto).toBe(7500);
    });
  });
});
