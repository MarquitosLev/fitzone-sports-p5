# ADR-007 — Pirámide de pruebas unitarias y de slice, con umbral de cobertura del 60 %

- **Estado:** Aceptado
- **Fecha:** 2026-11-10
- **Autor:** Leiva, Marcos Joel
- **Sprint:** 7

## Contexto
Seis personas mergean seguido en `develop`, y hasta SCRUM-111 la verificación se hacía a mano antes de cada PR. Las reglas que más importan (RN-01, RN-02, cupos, precio dinámico, permisos por rol) viven en los servicios del backend, y la UI condicional por rol, en el frontend. Los tests del backend tienen que correr sin base de datos para que cualquiera los ejecute sin Docker. El 2026-11-10, sobre `develop`, la suite daba: backend 263 tests en verde, con JaCoCo en 66,0 % de líneas y 48,7 % de ramas; frontend 400 tests en 61 archivos en verde, con V8 en 71,3 % de líneas y 66,2 % de ramas.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Tests de integración con base real (Testcontainers) como base de la pirámide | Prueban el SQL, los bloqueos y las restricciones de verdad | Necesitan Docker en cada máquina y en CI; suite lenta | Demasiado costo para el equipo; quedan como deuda para la concurrencia de RN-02 |
| End-to-end con Playwright o Cypress | Prueban el sistema como lo usa un rol | Frágiles; necesitan backend, front y base levantados | Sin entorno estable para correrlos en CI |
| Solo pruebas manuales con Bruno | Ya existían las colecciones por módulo | No se repiten solas ni frenan una regresión | Insuficiente como red de seguridad |
| Umbral alto (80 %) que bloquee el build | Fuerza a escribir tests | Hoy la suite está por debajo; frenaría todos los PR de cierre | Irreal para el plazo |
| **Base unitaria (servicios con Mockito, componentes y hooks con Vitest + Testing Library), capa media de slice (`@WebMvcTest` por controlador) y verificación manual con Bruno; umbral del 60 % de líneas** | Rápida, sin base de datos, corre en cada PR | No prueba SQL, bloqueos ni restricciones reales | — |

## Decisión
Vamos a sostener una pirámide de dos niveles automáticos. En la base, tests unitarios: servicios del backend con Mockito, y componentes, hooks y servicios del frontend con Vitest y Testing Library en modo mock. En el medio, tests de slice de controladores con `@WebMvcTest` + `GlobalExceptionHandler`, que verifican rutas, validación, códigos de error y permisos. Arriba quedan los recorridos manuales con las colecciones de Bruno (`docs/bruno/`). El pipeline (`.github/workflows/ci.yml`) corre las dos suites en cada PR hacia `develop` y publica los reportes de JaCoCo y V8. El umbral mínimo acordado es **60 % de líneas** en cada proyecto: hoy se mide y se publica, pero el build todavía no falla por debajo de ese valor.

## Consecuencias
- **Positivas:** un PR que rompe una regla de negocio no pasa el CI. Las suites corren en menos de un minuto cada una y sin infraestructura. Los tests usan `@DisplayName` en español y sirven como especificación ejecutable.
- **Negativas:** la concurrencia real de RN-02 y RN-01 (dos transacciones a la vez con `SELECT … FOR UPDATE`) no está probada automáticamente: el bloqueo se mockea. La cobertura de ramas del backend (48,7 %) está muy por debajo de la de líneas.
- **Deuda asumida:** (1) hacer cumplir el umbral en el build: regla `check` de `jacoco-maven-plugin` con `LINE COVEREDRATIO 0.60`, y `coverage.thresholds.lines: 60` en `vite.config.ts`; (2) agregar un test de integración con Testcontainers que lance dos reservas concurrentes de la misma cancha y verifique que solo una se confirma.

## Requisitos relacionados
Unidad V, RN-01, RN-02, RF-11
