# ADR-018 — El cliente externo no se registra: reserva y paga en un paso

- **Estado:** Aceptado
- **Fecha:** 2026-11-19
- **Registrado:** 2026-11-19
- **Autor:** Equipo Grupo 5 (redacción: Leiva, Marcos Joel)
- **Sprint:** 6
- **Modifica a:** ADR-012 (solo para la reserva del invitado)
- **Ticket:** SCRUM-147

## Contexto
El checkout de invitado tenía dos pasos: primero se reservaba el turno, con un usuario `EXTERNO` creado en `fz_usr_usuarios` a partir del DNI, y después se pagaba. Si el invitado no pagaba, la reserva quedaba hecha y el turno seguía ocupado (SCRUM-147). ADR-012 ya lo anotaba como deuda: «una reserva con el pago rechazado y sin reintento sigue ocupando el horario».

Además, guardar al externo como usuario contradice cómo el equipo entiende ese actor. Un externo no tiene cuenta, no inicia sesión y no vuelve a usar sus datos: los carga en el momento de pagar y lo único que necesita conservar es el comprobante.

Es un cambio de alcance funcional respecto del enunciado. RF-01 pide «Alta de usuarios (DNI, contacto, foto). Distingue entre Socio y Cliente Externo», y el actor se define como un usuario sin membresía que alquila canchas pagando por uso.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Mantener los dos pasos y vencer las reservas impagas con un job | No cambia el modelo | Un turno igual queda bloqueado hasta que corre el job; hace falta un scheduler | Más piezas y el bug sigue mientras tanto |
| Mantener los dos pasos y que la grilla ignore las reservas impagas | Arreglo chico | Dos invitados pueden «reservar» el mismo turno y solo uno paga; contradice RN-02 | Rompe la regla de concurrencia |
| **Reservar y pagar en una sola transacción, sin usuario** | El turno solo se ocupa si el pago se aprueba; no se guardan datos personales fuera del comprobante | El turno no se retiene en el servidor mientras el invitado completa el formulario | — |

## Decisión
1. El cliente externo no se guarda en `fz_usr_usuarios`. `fz_cch_reservas.id_usuario` y `fz_pag_transacciones.id_usuario` pasan a admitir nulo, y nulo significa «cliente externo».
2. `POST /v1/invitados/reservas` reserva y cobra dentro de una transacción. Primero bloquea la cancha y verifica el solapamiento (ADR-004): si el turno está tomado responde 409 sin cobrar. Si la pasarela rechaza, responde 422 y el rollback deshace la reserva y la transacción. Si aprueba, quedan la reserva, el pago y el comprobante.
3. Nombre, DNI y email del externo se guardan solo en `fz_pag_comprobantes` (`cliente_nombre`, `cliente_dni`, `cliente_email`), que es lo que se entrega e imprime. El teléfono deja de pedirse.
4. Mientras completa el formulario, la reserva se retiene 5 minutos en el `localStorage` del navegador, con cuenta regresiva. Al vencer se borra todo y se cierra la ventana. Esa retención es solo del cliente: no bloquea el turno para otros.
5. El alta manual de usuarios `EXTERNO` desde recepción se elimina. El valor `EXTERNO` del enum se conserva para leer los datos anteriores al cambio.
6. Si el DNI o el email pertenecen a una cuenta (socio o empleado), se pide iniciar sesión, como antes.

## Consecuencias
- **Positivas:** una reserva de invitado siempre está pagada, así que el bug desaparece por construcción. Menos datos personales en la base. Se elimina el límite de «3 reservas sin pagar» y el endpoint de pago separado.
- **Negativas:** dos invitados pueden completar el formulario para el mismo turno; el que paga segundo recibe 409 sin cargo. El historial de un mismo externo no se puede consultar: cada comprobante es independiente.
- **Desvío del enunciado:** RF-01 se cumple para el socio. El cliente externo existe como actor y como tipo de reserva, pero no como usuario registrado. Se deja asentado para la defensa.
- **Migración:** `docs/sql/SCRUM-147-externo-sin-usuario.sql`, a correr antes de desplegar (Hibernate no quita un `NOT NULL`). Las reservas de invitado anteriores conservan su usuario `EXTERNO` y se siguen consultando por código.

## Requisitos relacionados
RF-01, RF-09, RF-10, RF-13, RN-02, RN-03
