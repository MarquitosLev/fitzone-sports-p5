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

// ─── GENERADOR DE PDF MOCK BIEN FORMADO Y RENDERIZABLE ───────────────────────
export interface DatosPdfMock {
  numeroFactura: string;
  monto: number;
  titular?: string;
  concepto?: string;
  sede?: string;
  fecha?: string;
  cae?: string;
}

/**
 * Genera un Blob PDF-1.4 binariamente válido y renderizable en navegadores
 * y visores de PDF estándar (Chrome, Firefox, Acrobat, PDF.js).
 */
export function generarPdfMockValido(datos: DatosPdfMock): Blob {
  const {
    numeroFactura,
    monto,
    titular = 'Lucas Martinez',
    concepto = 'Servicios Deportivos FitZone',
    sede = 'FitZone Palermo',
    fecha = new Date().toLocaleDateString('es-AR'),
    cae = '74125896301245',
  } = datos;

  // Sanitizamos a caracteres ASCII estándar para coincidencia 1 a 1 de bytes en la tabla xref
  const sanitizar = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');

  const lineas = [
    sanitizar(`FitZone Sports - Comprobante de Pago Oficial`),
    sanitizar(`Factura N: ${numeroFactura}`),
    sanitizar(`Titular: ${titular}`),
    sanitizar(`Concepto: ${concepto}`),
    sanitizar(`Sede: ${sede}`),
    sanitizar(`Fecha de emision: ${fecha}`),
    sanitizar(`Importe Total: ARS $${monto.toLocaleString('es-AR')}`),
    sanitizar(`CAE: ${cae} - Comprobante Autorizado por AFIP`),
  ];

  let stream = 'BT\n/F1 16 Tf\n50 720 Td\n(' + lineas[0] + ') Tj\n/F1 11 Tf\n';
  for (let i = 1; i < lineas.length; i++) {
    stream += `0 -24 Td\n(${lineas[i]}) Tj\n`;
  }
  stream += 'ET';

  const streamLength = stream.length;

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const obj5 = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`;

  const off1 = header.length;
  const off2 = off1 + obj1.length;
  const off3 = off2 + obj2.length;
  const off4 = off3 + obj3.length;
  const off5 = off4 + obj4.length;
  const startxref = off5 + obj5.length;

  const pad = (n: number) => String(n).padStart(10, '0');

  const xref =
    `xref\n` +
    `0 6\n` +
    `0000000000 65535 f \n` +
    `${pad(off1)} 00000 n \n` +
    `${pad(off2)} 00000 n \n` +
    `${pad(off3)} 00000 n \n` +
    `${pad(off4)} 00000 n \n` +
    `${pad(off5)} 00000 n \n`;

  const trailer =
    `trailer\n` +
    `<< /Size 6 /Root 1 0 R >>\n` +
    `startxref\n` +
    `${startxref}\n` +
    `%%EOF\n`;

  const pdfStr = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return new Blob([pdfStr], { type: 'application/pdf' });
}

// ─── VALIDACIONES DE SEGURIDAD Y NEGOCIO ──────────────────────────────────────
function validarPayloadCheckout(payload: ProcesarPagoPayload): void {
  if (!payload) {
    throw new Error('El payload de checkout es requerido.');
  }
  if (!payload.idSede || payload.idSede <= 0) {
    throw new Error('La sede especificada no es válida.');
  }
  if (!payload.idUsuario || payload.idUsuario <= 0) {
    throw new Error('El usuario especificado no es válido.');
  }
  if (typeof payload.monto !== 'number' || isNaN(payload.monto) || payload.monto <= 0) {
    throw new Error('El monto a debitar debe ser un número positivo mayor a 0.');
  }
  if (!payload.tokenTransaccionPasarela || !payload.tokenTransaccionPasarela.trim()) {
    throw new Error('El token de transacción de la pasarela es requerido.');
  }
  const conceptosValidos = ['RESERVA_SOCIO', 'RESERVA_EXTERNO', 'MEMBRESIA_SOCIO'];
  if (!conceptosValidos.includes(payload.concepto)) {
    throw new Error(`El concepto ${payload.concepto} no es válido.`);
  }
  if (payload.tipoComprobante === 'FACTURA_A') {
    if (!payload.cuitFacturaA || !/^\d{2}-\d{8}-\d{1}$/.test(payload.cuitFacturaA.trim())) {
      throw new Error('Para emitir Factura A debe proporcionar un CUIT válido (formato XX-XXXXXXXX-X).');
    }
  }
}

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
  {
    idTransaccion: 5,
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
    reservaCanchaId: 8,
    concepto: 'RESERVA_SOCIO',
    monto: 7500,
    estadoPago: 'REEMBOLSADO',
    tokenTransaccionPasarela: 'tok_mock_reembolsado',
    fechaHoraCreacion: '2026-10-10T11:00:00',
    fechaHoraConfirmacion: '2026-10-10T15:30:00',
    descripcion: 'Pádel · Cancha 2 (Turno cancelado con aviso > 24hs — Reembolsado)',
  },
];

let mockPagos: TransaccionDTO[] = JSON.parse(JSON.stringify(MOCK_PAGOS_INICIALES));

const MOCK_COMPROBANTES_INICIALES: ComprobanteDTO[] = [
  {
    idComprobante: 1,
    transaccion: mockPagos[0]!,
    numeroFactura: 'FAC-0001-00000123',
    tipoComprobante: 'FACTURA_B',
    cae: '74100000000001',
    fechaVencimientoCae: '25/10/2026',
    urlDescargaPdf: '',
  },
  {
    idComprobante: 2,
    transaccion: mockPagos[2]!,
    numeroFactura: 'FAC-0001-00000105',
    tipoComprobante: 'FACTURA_B',
    cae: '74100000000002',
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
 * Si es aprobado, genera el comprobante fiscal automáticamente con CAE determinístico.
 */
export async function procesarPago(payload: ProcesarPagoPayload): Promise<ResultadoPagoDTO> {
  // Validación estricta del payload antes de procesar
  validarPayloadCheckout(payload);

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const esRechazado = payload.tokenTransaccionPasarela === 'tok_mock_rechazado';
    const ahoraIso = toLocalISOString(new Date());
    const nuevoIdTransaccion = mockPagos.length + 1;

    const nuevaTransaccion: TransaccionDTO = {
      idTransaccion: nuevoIdTransaccion,
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
      const nuevoIdComp = mockComprobantes.length + 1;
      const facturaNum = `FAC-0001-${String(nuevoIdComp).padStart(8, '0')}`;
      const caeDeterminista = `741${String(10000000000 + nuevoIdTransaccion * 7393).padStart(11, '0')}`;

      nuevoComprobante = {
        idComprobante: nuevoIdComp,
        transaccion: nuevaTransaccion,
        numeroFactura: facturaNum,
        tipoComprobante: payload.tipoComprobante || 'FACTURA_B',
        cae: caeDeterminista,
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
  if (!idTransaccion || idTransaccion <= 0) {
    throw new Error('El identificador de la transacción debe ser un número positivo.');
  }
  if (!nuevoTokenPasarela || !nuevoTokenPasarela.trim()) {
    throw new Error('El token de pasarela para el reintento es requerido.');
  }

  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const transaccion = mockPagos.find((p) => p.idTransaccion === idTransaccion);
    if (!transaccion) {
      throw new Error(`Transacción con ID ${idTransaccion} no encontrada.`);
    }

    // Regla de idempotencia y prevención de doble cobro:
    if (transaccion.estadoPago === 'CONFIRMADO') {
      throw new Error(
        `La transacción ID ${idTransaccion} ya se encuentra confirmada. No se permite duplicar el cobro.`
      );
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
      comprobante = mockComprobantes.find((c) => c.transaccion.idTransaccion === idTransaccion) || null;
      if (!comprobante) {
        const nuevoIdComp = mockComprobantes.length + 1;
        const facturaNum = `FAC-0001-${String(nuevoIdComp).padStart(8, '0')}`;
        const caeDeterminista = `741${String(10000000000 + idTransaccion * 7393).padStart(11, '0')}`;

        comprobante = {
          idComprobante: nuevoIdComp,
          transaccion,
          numeroFactura: facturaNum,
          tipoComprobante: 'FACTURA_B',
          cae: caeDeterminista,
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
 * En modo mock, sintetiza un PDF-1.4 válido y renderizable sin necesidad de pegarle al backend.
 */
export async function descargarComprobantePdf(idComprobante: number): Promise<Blob> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const comp = mockComprobantes.find((c) => c.idComprobante === idComprobante);
    const numFactura = comp?.numeroFactura || `FAC-0001-${String(idComprobante).padStart(8, '0')}`;

    return generarPdfMockValido({
      numeroFactura: numFactura,
      monto: comp?.transaccion.monto || 6800,
      titular: comp
        ? `${comp.transaccion.usuario.nombre} ${comp.transaccion.usuario.apellido}`
        : 'Lucas Martinez',
      concepto: comp?.transaccion.descripcion || 'Servicios Deportivos FitZone',
      sede: comp?.transaccion.sede.nombre || 'FitZone Palermo',
      fecha: comp?.transaccion.fechaHoraConfirmacion || new Date().toISOString(),
      cae: comp?.cae || '74125896301245',
    });
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
 * Dispara la descarga en el navegador de un Blob PDF de forma segura.
 *
 * NOTA DE SEGURIDAD Y ESTABILIDAD:
 * Utiliza setTimeout para demorar la revocación de la URL (URL.revokeObjectURL),
 * evitando cancelaciones prematuras en navegadores asíncronos.
 */
export function descargarBlobEnNavegador(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revocación diferida garantizada tras la captura del stream por el navegador
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}
