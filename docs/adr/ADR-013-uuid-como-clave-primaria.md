# ADR-013 — UUID como tipo de clave primaria

- **Estado:** Reemplazado por ADR-016
- **Fecha:** 2026-09-14
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (equipo de DER; registrado originalmente como "ADR-005" en el documento del Drive)
- **Sprint:** 3

## Contexto
El sistema combina tablas operativas de mucho volumen (reservas, transacciones, accesos) con catálogos chicos y estáticos (planes de membresía). Un id secuencial expuesto en una URL o en una respuesta de la API puede revelar información de negocio (volumen, orden temporal) y facilita enumerar recursos.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| UUID sin excepciones | Uniforme | Complejidad innecesaria en catálogos de pocas filas | Sobredimensionado para `fz_pag_planes` |
| Enteros autoincrementales en todas las tablas | Simples, livianos, legibles | Exponen el volumen y permiten enumerar | Riesgo en endpoints semipúblicos (comprobantes) |
| **UUID por defecto, entero solo en `fz_pag_planes`** | Ids no adivinables | Más peso en índices; menos legibles al depurar | — |

## Decisión
Usar UUID como clave primaria por defecto, con la única excepción de `fz_pag_planes`.

## Por qué se reemplazó
Al implementar las entidades, el equipo usó `Long` con `GenerationType.IDENTITY` en todas las tablas, que es la convención más directa con Spring Data JPA y la más fácil de depurar con los datos de prueba. El riesgo de enumeración se resolvió donde de verdad había un recurso semipúblico: la reserva de cancha como invitado se consulta por `codigo_reserva` (UUID), no por su id (SCRUM-134). La convención vigente se registra en el ADR-016.

## Requisitos relacionados
RNF-02
