# ADR-004 — Bloqueo pesimista para la reserva de canchas

- **Estado:** Aceptado
- **Fecha:** 2026-10-20
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (redacción: Leiva, Marcos Joel)
- **Sprint:** 6

## Contexto
RN-02 exige que dos reservas simultáneas de la misma cancha y franja horaria terminen con exactamente una confirmación. Los turnos son de horas enteras entre las 08:00 y las 23:00, y una reserva puede abarcar más de una hora, así que el conflicto se da por solapamiento de rangos y no por igualdad de horario. Si se consulta primero si hay solapamiento y después se inserta, dos transacciones pueden pasar la verificación a la vez y confirmar las dos (condición de carrera entre el SELECT y el INSERT). El esquema lo genera Hibernate (ADR-016), así que lo que no se pueda expresar con anotaciones JPA queda fuera de la base salvo que se escriba un script.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Bloqueo optimista (`@Version` en `Cancha`) | No bloquea lecturas; barato cuando hay poca contención | El perdedor recibe una `OptimisticLockException` y hay que reintentar o devolver error; si la reserva no modifica la cancha, la versión no cambia y no protege nada | Con turnos populares (horario pico) la contención es real, y forzar un `UPDATE` de la versión solo para bloquear es más confuso que bloquear explícitamente |
| Restricción única `(id_cancha, fecha_hora_inicio)` | La base la garantiza sola | Solo detecta reservas que empiezan a la misma hora; dos reservas de 18-20 y 19-21 se solapan y la pasan | No cubre turnos de más de una hora |
| Restricción de exclusión `EXCLUDE USING gist (id_cancha WITH =, tsrange(inicio, fin) WITH &&)` | Garantía en la base para cualquier solapamiento, aunque alguien escriba sin pasar por la API | Requiere la extensión `btree_gist` y SQL fuera de JPA; con `ddl-auto` no se crea sola | Era la opción documentada en el DER inicial, pero quedó sin implementar por la falta de migraciones (ver Deuda) |
| Nivel de aislamiento `SERIALIZABLE` | Lo resuelve el motor | Afecta a toda la transacción y obliga a reintentar ante fallos de serialización | Demasiado amplio para un problema acotado a una cancha |
| **Bloqueo pesimista sobre la cancha + verificación de solapamiento** | Serializa solo las reservas de esa cancha; el segundo pedido espera, ve la reserva confirmada y recibe 409 | La garantía vive en el servicio y no en el esquema | — |

## Decisión
Vamos a reservar dentro de una transacción que primero toma un bloqueo `PESSIMISTIC_WRITE` sobre la fila de la cancha (`CanchaRepository.findByIdForUpdate`, es decir `SELECT … FOR UPDATE`) y recién después verifica `existsSolapamiento(inicio < fin_existente AND fin > inicio_existente)` y guarda (`CanchaService.guardarReserva`). El mismo patrón se usa para RN-01 (bloqueo de la membresía del socio en `AccesoService`), el aforo (bloqueo de la sede), los cupos de clases y el alta de membresías (bloqueo del usuario). Lo decidió que serializa exactamente el recurso disputado, con una sola línea de código por caso y sin reintentos.

## Consecuencias
- **Positivas:** dos pedidos concurrentes sobre la misma cancha se atienden uno detrás del otro: el primero confirma y el segundo recibe `409 Conflicto` ("La cancha ya se encuentra reservada en el horario solicitado"). Las reservas de canchas distintas no se bloquean entre sí.
- **Negativas:** la garantía depende de que toda escritura pase por `CanchaService`. Un `INSERT` manual en la base o un servicio nuevo que no tome el bloqueo puede crear un solapamiento. Mientras dura la transacción, los pedidos sobre esa cancha esperan.
- **Deuda asumida:** la cátedra pide la garantía **también en la base de datos**, y hoy no está. Para cumplirlo falta agregar con un script SQL versionado (o con Flyway, SCRUM-133) la restricción `EXCLUDE USING gist` sobre `fz_cch_reservas`, más el índice `(id_cancha, fecha_hora_inicio)` que pide RNF-03.

## Requisitos relacionados
RN-02, RNF-03, RF-10
