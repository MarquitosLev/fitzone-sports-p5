# ADR-012 — La transacción apunta a la reserva, no la reserva a la transacción

- **Estado:** Aceptado
- **Fecha:** 2026-09-14
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (equipo de DER; registrado originalmente como "ADR-004" en el documento del Drive)
- **Sprint:** 3

## Contexto
Una reserva de cancha tiene que quedar asociada a su pago, procesado por la pasarela externa (ADR-009). La pasarela puede rechazar un intento (fondos insuficientes, timeout, datos inválidos), y en un flujo real la confirmación llega de forma asincrónica. El modelo tenía que permitir varios intentos de pago sobre el mismo turno sin bloquear de nuevo ni duplicar la reserva. Lo mismo pasa con la renovación de una membresía.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| FK en `fz_cch_reservas` hacia una única transacción | JOIN 1 a 1 directo | Cada reintento obliga a modificar o recrear la reserva; se pierde el historial de intentos fallidos | Complica RN-02 y la auditoría |
| Tabla intermedia `fz_pag_intentos` | Separa intentos de pagos confirmados | Una tabla extra para un caso que ya cubre una FK opcional + estado | Innecesaria |
| Asociación polimórfica (`tipo_referencia` + `id_referencia`) | Una sola columna para cualquier destino | PostgreSQL no puede tener FK real contra "cualquier tabla" | Se pierde la integridad referencial |
| **FK opcional `id_reserva_cancha` (y `id_membresia`) en `fz_pag_transacciones`** | Cero, uno o varios intentos por reserva; cada intento queda como fila inmutable | El "pago vigente" se obtiene consultando la transacción confirmada más reciente | — |

## Decisión
La relación vive en `fz_pag_transacciones`, con dos FK opcionales, `id_reserva_cancha` e `id_membresia`, y un `concepto` (`TipoOrigenTransaccion`) que indica cuál corresponde. El CHECK `ck_pag_transacciones_origen` (SCRUM-93) obliga a que el destino coincida con el concepto. Reintentar un pago rechazado crea una transacción nueva sobre la misma reserva o membresía.

## Consecuencias
- **Positivas:** se puede reintentar sin tocar la reserva. Cada intento queda auditado (estado, token de la pasarela, fechas). Una reserva está pagada si existe una transacción `CONFIRMADO` asociada (`ReservaCanchaRepository.contarPendientesDePago`).
- **Negativas:** saber "cuál es el pago" de una reserva requiere una subconsulta. Una reserva con el pago rechazado y sin reintento sigue ocupando el horario.
- **Deuda asumida:** falta una expiración de las reservas impagas. Nota de transcripción: el documento original mencionaba que el turno queda bloqueado "vía la restricción de exclusión de RN-02". Esa restricción no se implementó: la protección actual es la del ADR-004.

## Requisitos relacionados
RF-10, RF-13, RN-02
