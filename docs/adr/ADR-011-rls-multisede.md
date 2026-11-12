# ADR-011 — Aislamiento multisede con Row Level Security

- **Estado:** Reemplazado por ADR-015
- **Fecha:** 2026-09-06
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (acta de la reunión del 2026-09-06; registrado originalmente como "ADR-001" en el documento del Drive)
- **Sprint:** 2

## Contexto
La cadena tiene más de 25 sedes, y cada recepcionista opera solo los turnos, el aforo y los recursos de la suya. Al mismo tiempo, un socio no puede estar dentro de dos sedes a la vez (RN-01). El desafío era aislar los datos operativos de cada sede sin mantener 25 bases de datos.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Una base de datos por sede | Aislamiento físico total | Orquestar a qué base conectarse; costo de 25 instancias; reportes consolidados entre bases | Costo y complejidad |
| **Base única con columna `sede_id` y políticas RLS de PostgreSQL** | Aislamiento garantizado por el motor; reportes consolidados con una consulta | Todo el tráfico converge en un motor; las políticas dependen de claims del JWT | — |

## Decisión
Implementar un modelo multi-tenant en una única base compartida, con `sede_id` en cada tabla operativa y políticas RLS que filtren automáticamente por la sede del token de sesión.

## Consecuencias
- **Positivas (previstas):** se evitan filtraciones entre sedes; el gerente consulta todas las sedes en una sola base.
- **Negativas (previstas):** todo el tráfico va a un único motor de base de datos.

## Por qué se reemplazó
Al implementar, el backend se conecta a PostgreSQL con un único usuario técnico a través de JPA, no con el JWT de cada usuario. Para que RLS funcionara había que propagar el claim de sede a la sesión de base (`SET LOCAL`) en cada transacción, y las políticas iban a vivir fuera del código Java y fuera del esquema que genera Hibernate (ADR-016). Por eso decidimos validar la sede en la capa de servicio (ADR-015).

## Requisitos relacionados
RF-03, RN-01
