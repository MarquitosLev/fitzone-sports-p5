import { httpClient } from './httpClient';
import type { TransaccionDTO } from '../types';
import { USE_MOCK } from '../config';

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────
const MOCK_PAGOS: TransaccionDTO[] = [
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
    tokenTransaccionPasarela: 'mp_token_abc123',
    fechaHoraCreacion: '2026-10-15T14:00:00',
    fechaHoraConfirmacion: '2026-10-15T14:01:30',
  },
  {
    idTransaccion: 2,
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
  },
];

// ─── FUNCIONES DEL SERVICIO ───────────────────────────────────────────────────

/**
 * Lista las transacciones de pago de una sede.
 */
export async function listarPagos(idSede: number): Promise<TransaccionDTO[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_PAGOS.filter((p) => p.sede.idSede === idSede);
  }

  return httpClient.get<TransaccionDTO[]>(`/v1/pagos?idSede=${idSede}`);
}
