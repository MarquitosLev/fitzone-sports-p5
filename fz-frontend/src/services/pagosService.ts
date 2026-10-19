/**
 * pagosService.ts — Servicio de pagos, checkout simulado y comprobantes (SCRUM-86, RF-13, RF-14).
 *
 * Conforme a ADR-003 y RNF-02, no procesa ni almacena datos de tarjetas.
 * La pasarela de pago es simulada y se comunica mediante tokens (ej: 'tok_mock_aprobado').
 *
 * Resuelve el hallazgo BUG-03: al reintentar un pago rechazado, se preserva íntegramente
 * la referencia original (cancha o membresía) y el monto calculado sin mutar a otro concepto.
 */

import { httpClient } from './httpClient';
import type {
  TransaccionDTO,
  ComprobanteDTO,
  ProcesarPagoPayload,
  ResultadoPagoDTO,
} from '../types';
import { USE_MOCK } from '../config';
import { toLocalISOString } from '../utils/formatters';

// ─── ENDPOINTS REST (SCRUM-76 y SCRUM-77) ────────────────────────────────────
export const PAGOS_ENDPOINTS = {
  listar: '/v1/pagos',
  procesarCheckout: '/v1/pagos/checkout',
  reintentar: (idTransaccion: number) => `/v1/pagos/${idTransaccion}/reintentar`,
  comprobantePorTransaccion: (idTransaccion: number) => `/v1/comprobantes/transaccion/${idTransaccion}`,
  descargarComprobantePdf: (idComprobante: number) => `/v1/comprobantes/${idComprobante}/pdf`,
} as const;

// ─── ESTADO MOCK EN MEMORIA ───────────────────────────────────────────────────
const MOCK_PAGOS_INICIALES: TransaccionDTO[] = [
  {
    idTransaccion: 1,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-socio-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas.martinez@email.com',
      telefono: '11-4567-8901',
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
    descripcion: 'Pádel · Cancha 1 (Turno 19:00 a 20:00 hs con 15% desc. socio)',
  },
  {
    idTransaccion: 2,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-socio-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas.martinez@email.com',
      telefono: '11-4567-8901',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    membresiaId: null,
    reservaCanchaId: 4,
    concepto: 'RESERVA_SOCIO',
    monto: 8000,
    estadoPago: 'RECHAZADO',
    tokenTransaccionPasarela: 'tok_mock_rechazado',
    fechaHoraCreacion: '2026-10-16T18:00:00',
    fechaHoraConfirmacion: null,
    descripcion: 'Fútbol 5 · Cancha 1 (Turno 20:00 a 21:00 hs)',
    motivoRechazo: 'Límite diario excedido. El banco emisor rechazó la operación.',
  },
  {
    idTransaccion: 3,
    usuario: {
      idUsuario: 1,
      authId: 'uuid-socio-1',
      dni: '30123456',
      nombre: 'Lucas',
      apellido: 'Martínez',
      email: 'lucas.martinez@email.com',
      telefono: '11-4567-8901',
      fotoUrl: null,
      tipoUsuario: 'SOCIO',
      idSede: 1,
    },
    sede: { idSede: 1, nombre: 'FitZone Palermo', aforoMaximo: 80 },
    membresiaId: 1,
    reservaCanchaId: null,
    concepto: 'MEMBRESIA_SOCIO',
    monto: 15000,
    estadoPago: 'CONFIRMADO',
    tokenTransaccionPasarela: 'tok_mock_aprobado',
    fechaHoraCreacion: '2026-10-01T10:00:00',
    fechaHoraConfirmacion: '2026-10-01T10:00:45',
    descripcion: 'Renovación Plan Premium Mensual',
  },
  {
    idTransaccion: 4,
    usuario: {
      idUsuario: 3,
      authId: null,
      dni: '35789012',
      nombre: 'Martín',
      apellido: 'López',
      email: 'mlopez@email.com',
      telefono: '11-6789-0123',
      fotoUrl: null,
      tipoUsuario: 'EXTERNO',
      idSede: 2,
    },
    sede: { idSede: 2, nombre: 'FitZone Belgrano', aforoMaximo: 60 },
    membresiaId: null,
    reservaCanchaId: 5,
    concepto: 'RESERVA_EXTERNO',
    monto: 10000,
    estadoPago: 'PENDIENTE',
    tokenTransaccionPasarela: null,
    fechaHoraCreacion: '2026-10-15T16:00:00',
    fechaHoraConfirmacion: null,
    descripcion: 'Tenis · Cancha 1 (Checkout Invitado)',
  },
];

let mockPagos: TransaccionDTO[] = JSON.parse(JSON.stringify(MOCK_PAGOS_INICIALES));

const MOCK_COMPROBANTES_INICIALES: ComprobanteDTO[] = [
  {
    idComprobante: 1,
    transaccion: mockPagos[0]!,
    numeroFactura: 'FAC-0001-00000123',
    tipoComprobante: 'FACTURA_B',
    cae: '74125896301245',
    fechaVencimientoCae: '25/10/2026',
    urlDescargaPdf: '',
  },
  {
    idComprobante: 2,
    transaccion: mockPagos[2]!,
    numeroFactura: 'FAC-0001-00000105',
    tipoComprobante: 'FACTURA_B',
    cae: '65478932145698',
    fechaVencimientoCae: '11/10/2026',
    urlDescargaPdf: '',
  },
];

let mockComprobantes: ComprobanteDTO[] = JSON.parse(JSON.stringify(MOCK_COMPROBANTES_INICIALES));

/** Permite restaurar el estado mock inicial para aislar las pruebas unitarias */
export function _resetMockPagos(): void {
  mockPagos = JSON.parse(JSON.stringify(MOCK_PAGOS_INICIALES));
  mockComprobantes = JSON.parse(JSON.stringify(MOCK_COMPROBANTES_INICIALES));
}

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista las transacciones de pago de una sede, con filtro opcional por socio.
 */
export async function listarPagos(idSede: number, idUsuario?: number): Promise<TransaccionDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockPagos.filter((p) => {
      const matchSede = p.sede.idSede === idSede;
      const matchUser = idUsuario ? p.usuario.idUsuario === idUsuario : true;
      return matchSede && matchUser;
    });
  }

  const query = idUsuario ? `?idSede=${idSede}&idUsuario=${idUsuario}` : `?idSede=${idSede}`;
  return httpClient.get<TransaccionDTO[]>(`${PAGOS_ENDPOINTS.listar}${query}`);
}

/**
 * Obtiene el comprobante legal asociado a una transacción confirmada.
 */
export async function obtenerComprobantePorTransaccion(
  idTransaccion: number
): Promise<ComprobanteDTO | null> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const comp = mockComprobantes.find((c) => c.transaccion.idTransaccion === idTransaccion);
    return comp || null;
  }

  try {
    return await httpClient.get<ComprobanteDTO>(
      PAGOS_ENDPOINTS.comprobantePorTransaccion(idTransaccion)
    );
  } catch {
    return null;
  }
}

/**
 * Procesa un nuevo pago a través del checkout con la pasarela simulada.
 * Si el token es 'tok_mock_rechazado', genera la transacción en estado RECHAZADO.
 * Si es aprobado, genera el comprobante fiscal automáticamente.
 */
export async function procesarPago(payload: ProcesarPagoPayload): Promise<ResultadoPagoDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const esRechazado = payload.tokenTransaccionPasarela === 'tok_mock_rechazado';
    const ahoraIso = toLocalISOString(new Date());

    const nuevaTransaccion: TransaccionDTO = {
      idTransaccion: mockPagos.length + 1,
      usuario: {
        idUsuario: payload.idUsuario,
        authId: 'uuid-socio-' + payload.idUsuario,
        dni: '30123456',
        nombre: 'Lucas',
        apellido: 'Martínez',
        email: 'lucas.martinez@email.com',
        telefono: '11-4567-8901',
        fotoUrl: null,
        tipoUsuario: 'SOCIO',
        idSede: payload.idSede,
      },
      sede: { idSede: payload.idSede, nombre: 'FitZone Palermo', aforoMaximo: 80 },
      membresiaId: payload.idMembresia ?? null,
      reservaCanchaId: payload.idReservaCancha ?? null,
      concepto: payload.concepto,
      monto: payload.monto,
      estadoPago: esRechazado ? 'RECHAZADO' : 'CONFIRMADO',
      tokenTransaccionPasarela: payload.tokenTransaccionPasarela,
      fechaHoraCreacion: ahoraIso,
      fechaHoraConfirmacion: esRechazado ? null : ahoraIso,
      descripcion:
        payload.detalleItem?.titulo ||
        (payload.concepto === 'MEMBRESIA_SOCIO'
          ? 'Renovación de Membresía'
          : 'Reserva de Cancha Deportiva'),
      motivoRechazo: esRechazado
        ? 'Límite diario excedido. El banco emisor rechazó la operación en la pasarela.'
        : null,
    };

    mockPagos.unshift(nuevaTransaccion);

    let nuevoComprobante: ComprobanteDTO | null = null;
    if (!esRechazado) {
      const facturaNum = `FAC-0001-${String(100 + mockComprobantes.length + 1).padStart(8, '0')}`;
      nuevoComprobante = {
        idComprobante: mockComprobantes.length + 1,
        transaccion: nuevaTransaccion,
        numeroFactura: facturaNum,
        tipoComprobante: payload.tipoComprobante || 'FACTURA_B',
        cae: `7${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
        fechaVencimientoCae: '30/10/2026',
        urlDescargaPdf: '',
      };
      mockComprobantes.unshift(nuevoComprobante);
    }

    return {
      transaccion: nuevaTransaccion,
      comprobante: nuevoComprobante,
      aprobado: !esRechazado,
      mensaje: esRechazado
        ? nuevaTransaccion.motivoRechazo || 'Pago rechazado'
        : '¡Pago acreditado exitosamente!',
    };
  }

  return httpClient.post<ResultadoPagoDTO>(PAGOS_ENDPOINTS.procesarCheckout, {
    body: JSON.stringify(payload),
  });
}

/**
 * Reintenta una transacción en estado RECHAZADO.
 *
 * PREVENCIÓN DE BUG-03:
 * Mantiene estrictamente el mismo idTransaccion, concepto, reservaCanchaId, membresiaId
 * y monto original de la transacción que había fallado, sin mutar a membresía genérica ni
 * alterar los valores originales.
 */
export async function reintentarPago(
  idTransaccion: number,
  nuevoTokenPasarela: string = 'tok_mock_aprobado'
): Promise<ResultadoPagoDTO> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const transaccion = mockPagos.find((p) => p.idTransaccion === idTransaccion);
    if (!transaccion) {
      throw new Error(`Transacción con ID ${idTransaccion} no encontrada.`);
    }

    const esRechazado = nuevoTokenPasarela === 'tok_mock_rechazado';
    const ahoraIso = toLocalISOString(new Date());

    // Actualizamos la misma transacción sin alterar su concepto ni entidades asociadas (BUG-03 fix)
    transaccion.tokenTransaccionPasarela = nuevoTokenPasarela;
    transaccion.estadoPago = esRechazado ? 'RECHAZADO' : 'CONFIRMADO';
    transaccion.fechaHoraConfirmacion = esRechazado ? null : ahoraIso;
    transaccion.motivoRechazo = esRechazado
      ? 'Reintento fallido: La tarjeta sigue registrando fondos insuficientes.'
      : null;

    let comprobante: ComprobanteDTO | null = null;
    if (!esRechazado) {
      // Verificamos si ya tenía comprobante o emitimos uno nuevo
      comprobante = mockComprobantes.find((c) => c.transaccion.idTransaccion === idTransaccion) || null;
      if (!comprobante) {
        const facturaNum = `FAC-0001-${String(100 + mockComprobantes.length + 1).padStart(8, '0')}`;
        comprobante = {
          idComprobante: mockComprobantes.length + 1,
          transaccion,
          numeroFactura: facturaNum,
          tipoComprobante: 'FACTURA_B',
          cae: `7${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
          fechaVencimientoCae: '30/10/2026',
          urlDescargaPdf: '',
        };
        mockComprobantes.unshift(comprobante);
      }
    }

    return {
      transaccion,
      comprobante,
      aprobado: !esRechazado,
      mensaje: esRechazado ? 'El reintento fue rechazado.' : '¡Reintento aprobado con éxito!',
    };
  }

  return httpClient.post<ResultadoPagoDTO>(PAGOS_ENDPOINTS.reintentar(idTransaccion), {
    body: JSON.stringify({ tokenTransaccionPasarela: nuevoTokenPasarela }),
  });
}

/**
 * Descarga el comprobante en formato PDF como Blob.
 * En modo mock, sintetiza un PDF válido sin necesidad de pegarle al backend.
 */
export async function descargarComprobantePdf(idComprobante: number): Promise<Blob> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const comp = mockComprobantes.find((c) => c.idComprobante === idComprobante);
    const numFactura = comp?.numeroFactura || `FAC-0001-${idComprobante}`;
    const contenidoPdf = `%PDF-1.4
% FitZone Sports - Factura Oficial Electrónica
% N°: ${numFactura}
% Monto: ARS ${comp?.transaccion.monto || '0.00'}
1 0 obj
<< /Title (Comprobante ${numFactura}) /Author (FitZone Sports S.A.) >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
    return new Blob([contenidoPdf], { type: 'application/pdf' });
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
  const url = `${baseUrl}${PAGOS_ENDPOINTS.descargarComprobantePdf(idComprobante)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/pdf' },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: no se pudo descargar el comprobante en PDF`);
  }

  return response.blob();
}

/**
 * Utilidad auxiliar para disparar la descarga en el navegador de un Blob PDF.
 */
export function descargarBlobEnNavegador(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
