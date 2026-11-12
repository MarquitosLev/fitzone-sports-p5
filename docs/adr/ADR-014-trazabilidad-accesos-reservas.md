# ADR-014 — Vincular el acceso físico con la reserva de clase o de cancha

- **Estado:** Aceptado
- **Fecha:** 2026-09-14
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (equipo de DER; registrado originalmente como "ADR-006" en el documento del Drive)
- **Sprint:** 3

## Contexto
`fz_gym_accesos` registra el ingreso y el egreso de cada socio (RN-01), pero no tenía forma de relacionar ese ingreso con una reserva. El negocio quería poder auditar si un socio asistió a la clase que reservó, o si se usó la cancha alquilada.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Asociación polimórfica (`tipo_referencia` + `id_referencia`) | Una sola columna | Sin FK real en PostgreSQL | Se pierde la integridad referencial |
| Tablas de asistencia separadas por módulo | Cada módulo maneja la suya | Duplica el concepto de "acceso físico" | Ya lo resuelve `fz_gym_accesos` |
| **Dos FK opcionales en `fz_gym_accesos` con un CHECK de exclusividad** | Integridad referencial; el uso libre del gimnasio sigue siendo el caso normal | Hay que resolver en el ingreso a qué reserva corresponde | — |

## Decisión
`fz_gym_accesos` tiene dos FK opcionales, `id_reserva_clase` e `id_reserva_cancha`. El CHECK `ck_gym_accesos_una_reserva` garantiza que, por acceso, haya como máximo una de las dos. Si las dos están en NULL, es un ingreso de uso libre.

## Consecuencias
- **Positivas:** permite reportar asistencia real contra reservas hechas. Deja lugar para reglas futuras de penalización por no presentarse, sin rediseñar el modelo.
- **Negativas:** quien inserte datos a mano en pruebas tiene que respetar el CHECK. En bases creadas antes de SCRUM-93, el CHECK se agrega con `docs/sql/SCRUM-93-restricciones.sql`.
- **Deuda asumida:** hoy el ingreso por QR no completa automáticamente la reserva asociada, así que los reportes de asistencia todavía no aprovechan estas columnas.

## Requisitos relacionados
RN-01, RF-04, RF-07
