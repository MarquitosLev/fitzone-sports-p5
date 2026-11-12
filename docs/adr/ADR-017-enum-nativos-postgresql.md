# ADR-017 — Dominios cerrados con ENUM nativos de PostgreSQL

- **Estado:** Reemplazado por ADR-016
- **Fecha:** 2026-09-14
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (equipo de DER; registrado originalmente como "ADR-007" en el documento del Drive)
- **Sprint:** 3

## Contexto
Varios atributos tienen un conjunto cerrado de valores: tipo de usuario, estado de pago, estado de membresía, estado de reserva de clase, tipo de cancha y concepto de transacción. En la primera versión del DER eran texto libre, sin validación en la base: un error de tipeo o un valor obsoleto escrito directo en la base pasaba sin aviso.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| CHECK con la lista de valores | Valida en la base | No se reutiliza entre tablas; no queda como tipo en el catálogo | No sirve como estándar general |
| Tabla de referencia (lookup) por dominio | Administrable sin migración | Un JOIN más por dominio; exagerado para dominios chicos | Se dejaba como opción solo para `tipo_cancha` si crecía |
| **Tipos ENUM nativos (`CREATE TYPE fz_enum_<dominio> AS ENUM`)** | El motor rechaza valores inválidos; pesan poco | `ALTER TYPE … ADD VALUE` no puede usarse en la misma transacción que lo usa | — |

## Decisión
Migrar esos campos a tipos ENUM nativos de PostgreSQL, uno por dominio, con la nomenclatura `fz_enum_<dominio>`.

## Por qué se reemplazó
Hibernate no genera tipos ENUM nativos con `ddl-auto`, y mapearlos requería tipos personalizados en cada entidad. Por eso el equipo usó `@Enumerated(EnumType.STRING)` sobre columnas de texto (ADR-016). Lo que se quería proteger se cubrió en parte con los CHECK que Hibernate agrega al crear cada tabla, y con el script `docs/sql/SCRUM-93-restricciones.sql`, que actualiza el CHECK de `concepto` en bases ya existentes. Para RF-09 (sumar tenis u otros tipos de cancha), un tipo nuevo es un valor más del enum en Java, sin `ALTER TYPE`.

## Requisitos relacionados
RF-09, RNF-04
