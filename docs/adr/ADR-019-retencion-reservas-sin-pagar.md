# ADR-019 — Una reserva de socio sin pagar retiene el turno 5 minutos

- **Estado:** Aceptado
- **Fecha:** 2026-11-19
- **Autor:** Equipo Grupo 5
- **Sprint:** 8
- **Ticket:** SCRUM-148

## Contexto
El socio reserva una cancha y paga en un segundo paso desde *Pagos*. ADR-012 dejó como deuda que una reserva sin pagar ocupaba el turno para siempre: si el socio no pagaba, o la pasarela rechazaba el pago y no reintentaba, nadie más podía reservar ese horario. `ReservaCancha` no tiene un estado; está pagada si tiene una transacción `CONFIRMADO` (ADR-012).

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Reservar y pagar en un solo paso, como el externo (ADR-018) | No existen reservas impagas | Cambia el flujo del socio, el checkout de *Pagos* y sus tests | Más cambio del que pide el ticket a días de la entrega |
| Tarea programada que borra las impagas vencidas | El dato queda limpio | Un proceso más que monitorear; entre ejecuciones el turno sigue tomado | La regla igual tiene que estar en la consulta |
| Columna `estado` en la reserva con su transición | Estado explícito | Otra columna que mantener en sincronía con las transacciones y que llevar a prod | Duplica lo que ya dicen las transacciones |
| **Retención por tiempo calculada en la consulta** | Sin columnas nuevas ni procesos; el turno se libera solo | La reserva vencida queda en la base | — |

## Decisión
Una reserva ocupa el turno si tiene un pago `CONFIRMADO` o si se creó hace menos de 5 minutos (`ReservaCancha.RETENCION_SIN_PAGO`). La condición vive en una sola constante JPQL del repositorio (`OCUPA_EL_TURNO`), que usan la grilla de disponibilidad y el chequeo de solapamiento de ADR-004, dentro de la misma transacción con bloqueo pesimista. Una reserva sin `created_at` se considera vigente.

Pagar una reserva vencida responde 422: el turno pudo tomarlo otra persona y cobrarla generaría una doble reserva. El backend expone `retencionVencida` en el JSON de la reserva, calculado con su propio reloj, y *Mis Reservas* la muestra como *Vencida*, sin botón de pago. El frontend no compara fechas porque el servidor guarda `created_at` en su zona horaria (UTC en Docker y Render).

## Consecuencias
- **Positivas:** se cierra la deuda de ADR-012 sin tocar el esquema. Una reserva con el pago rechazado libera el turno a los 5 minutos.
- **Negativas:** las reservas vencidas quedan en `fz_cch_reservas` y aparecen en el historial del socio. El plazo es fijo en el código.
- **Riesgo:** un pago que empieza a los 4:59 minutos y termina después se acepta, porque la validación ocurre al inicio del cobro. Con la pasarela simulada el cobro es instantáneo.

## Requisitos relacionados
RF-10, RF-13, RN-02. Modifica la deuda asumida en ADR-012.
