# ADR-006 — React + TypeScript, Tailwind con componentes propios y Context para el estado global

- **Estado:** Aceptado
- **Fecha:** 2026-08-22
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (redacción: Leiva, Marcos Joel)
- **Sprint:** 1

## Contexto
El frontend web atiende a cuatro roles (socio, cliente externo, recepcionista y gerente) con pantallas distintas, tiene que ser mobile-first (lo acordamos en la primera reunión porque el socio usa el celular para mostrar su QR) y consume la API REST. El estado compartido entre pantallas es chico: la sesión (usuario, rol y token), la sede elegida y las notificaciones (toasts). Un integrante (Chang) ya tenía experiencia en React y podía guiar al resto.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Angular | Framework completo con DI, formularios y router | Curva más empinada; nadie del equipo lo conocía | No había referente en el equipo |
| Vue 3 | Más simple que React para empezar | Sin referente en el equipo; ecosistema algo menor | El conocimiento previo pesó más |
| Librería de componentes (MUI, Ant Design, shadcn) | Componentes accesibles listos | Estética genérica difícil de adaptar a la paleta FitZone; dependencia pesada (MUI/Ant) | Preferimos un set chico de componentes propios en `components/ui` con Tailwind |
| Redux Toolkit / Zustand para estado global | Herramientas de depuración; escala bien | Más conceptos (store, slices, acciones) para tres valores globales | Sobredimensionado para sesión + sede + toasts |
| TanStack Query para el estado del servidor | Caché, reintentos y revalidación | Otra capa de abstracción para aprender | Los hooks por dominio con `useEffect` alcanzaban para el MVP |
| **React 19 + TypeScript + Vite, Tailwind + `components/ui` propios, Context API** | Mínimas dependencias; tipado estricto; build rápido | Sin caché de datos del servidor; los componentes propios hay que mantenerlos | — |

## Decisión
Vamos a construir el frontend con React 19 y TypeScript sobre Vite, con estilos en Tailwind (paleta `fitzone-*`) y componentes presentacionales propios en `src/components/ui`. El estado global va en tres contextos (`AuthContext`, `SedeContext`, `ToastContext`), y el acceso a datos sigue las capas `pages → hooks → services → httpClient`. El router es React Router 7, y las rutas se protegen por rol con `RoleMiddleware` y `FeatureGate`. Lo decidió tener el menor número de conceptos nuevos posible para un equipo que mayormente estaba aprendiendo React.

## Consecuencias
- **Positivas:** todo el HTTP pasa por `httpClient.ts`, que agrega el token, normaliza errores en `AppError` y dispara toasts. Cada servicio tiene un modo mock (`VITE_USE_MOCK`) y el front se puede desarrollar sin backend. `tsc` con `erasableSyntaxOnly` y `verbatimModuleSyntax` funciona como chequeo de tipos en el pipeline.
- **Negativas:** los datos se vuelven a pedir en cada pantalla, sin caché. Los contextos re-renderizan a todos sus consumidores.
- **Deuda asumida:** si crece el estado compartido o hace falta trabajar offline (ADR-003), conviene incorporar TanStack Query o un store con persistencia.

## Requisitos relacionados
Unidad IV, RF-04, RF-05, RF-10
