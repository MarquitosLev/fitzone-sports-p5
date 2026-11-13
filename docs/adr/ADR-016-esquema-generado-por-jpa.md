# ADR-016 — Esquema generado por JPA: ids `Long` IDENTITY y enums como texto

- **Estado:** Aceptado
- **Fecha:** 2026-09-28
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (redacción: Leiva, Marcos Joel)
- **Sprint:** 4
- **Reemplaza a:** ADR-013, ADR-017

## Contexto
El DER inicial proponía UUID como clave primaria (ADR-013) y tipos ENUM nativos de PostgreSQL (ADR-017). Al pasar a código, el equipo tenía que avanzar en paralelo con cinco módulos, recién aprendía JPA, y probaba con datos de semilla (`DataInitializer`) que se recrean seguido. Hibernate no genera `CREATE TYPE … AS ENUM`, y mapear enums nativos requiere tipos personalizados. Tampoco había todavía una herramienta de migraciones.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Seguir con UUID + ENUM nativos y migraciones a mano (Flyway) | Fiel al DER; validación del dominio en la base | Tipos personalizados en Hibernate; un `ALTER TYPE` por cada valor nuevo; migraciones desde el día uno | Frenaba el arranque de cinco módulos a la vez |
| UUID con enums como texto | Ids no enumerables | Ids ilegibles al depurar con datos de prueba; más peso en índices | La enumeración se resolvió donde hacía falta (`codigo_reserva`) |
| **`Long` IDENTITY, `@Enumerated(EnumType.STRING)` y esquema generado por Hibernate** | Convención directa de Spring Data; legible; agregar un valor de enum es solo código | La base no restringe los valores del enum por sí misma; el esquema no se versiona | — |

## Decisión
Todas las entidades extienden `BaseEntity` (auditoría y borrado lógico), declaran su propio `@Id Long` con `GenerationType.IDENTITY` y guardan los enums como texto con `EnumType.STRING`. Las tablas llevan el prefijo de su módulo (`fz_usr_`, `fz_gym_`, `fz_cls_`, `fz_cch_`, `fz_pag_`) y las FK tienen nombre explícito. El esquema lo genera Hibernate (`ddl-auto=update` en local y en dev, `validate` en prod). Las restricciones que JPA no crea en bases existentes se aplican con scripts idempotentes en `docs/sql/`.

## Consecuencias
- **Positivas:** una entidad nueva queda lista con una clase y un repositorio. Los datos de prueba son legibles (`id_usuario = 3`). Los recursos semipúblicos usan un UUID aparte (`codigo_reserva` de la reserva como invitado).
- **Negativas:** hay ids secuenciales expuestos en la API autenticada. Si alguien escribe directo en la base, nada impide un valor de enum inválido, salvo los CHECK que agrega Hibernate al crear la tabla. `update` nunca borra ni renombra columnas.
- **Deuda asumida:** sin migraciones versionadas, cada cambio de entidad hay que trasladarlo a mano a prod (`validate` falla si el esquema no coincide), como pasó con `codigo_reserva` (SCRUM-137). Lo resuelve SCRUM-133 (Flyway).

## Requisitos relacionados
RNF-03, RNF-04
