# Bitácora — Coppes, Matías — Rol P3

## Sprint 1 — Unidad I — Semana del 2026-08-17

### 2026-08-22 · 2 h
* **Actividad:** Primera reunión de análisis. Quedé en el equipo de frontend junto con Luciano y Maxi.
* **Decisión:** Diseño *mobile-first* desde el principio, considerando la experiencia principal del socio en dispositivos móviles.
* **Commits:** Sin commits (todavía no existía el repositorio).

---

## Sprint 2 — Unidad I — Semana del 2026-08-31

### 2026-09-06 · 2 h
* **Actividad:** Diseño del Diagrama Entidad-Relación (DER) junto con Marcos y Luciano.
* **Problema o bloqueo:** Para el prototipo dudábamos entre Figma y Stitch, así que lo dejamos abierto a evaluación.
* **Commits:** Sin commits.

---

## Sprint 3 — Unidad IV — Semana del 2026-09-14

### 2026-09-20 · 3 h
* **Actividad:** Arranqué con el diseño y maquetación del prototipo de la aplicación (flujos de socio, recepción y gerencia).
* **Commits:** Sin commits (el prototipo se trabajó fuera del repositorio).

---

## Sprint 5 — Unidad IV — Semana del 2026-10-05

### 2026-10-07 · 4 h
* **Actividad:** Terminé el prototipo completo de las pantallas del sistema y ajustes visuales de identidad.
* **Commits:** Sin commits (se integró al repositorio la semana siguiente).

---

## Sprint 5 — Unidad IV — Semana del 2026-10-12

### 2026-10-15 · 3 h
* **Actividad:** Subí el prototipo interactuable a `docs` para que todo el equipo lo use de referencia. Revisé y mergeé la librería base de componentes UI de Maxi.
* **Commits:** `3e32ead` prototipo interactuable · `6aa186c` archivos del prototipo

### 2026-10-16 · 5 h
* **Actividad:** Desarrollé el ABM de usuarios con vista de perfil y sus pruebas unitarias en Vitest, además de la agenda semanal de clases (`AgendaSemanal`, `ClaseForm`, `CupoIndicator`) integrada en `ClasesPage` y `PlaygroundPage`. Mergeé el esqueleto base de la app de Luciano.
* **Decisión:** Utilizar un único formulario reutilizable (`ClaseForm` / formulario de usuario) para el alta y la edición. Evitar divisiones por cero en los indicadores de cupo y unificar notificaciones con `useToast`.
* **Commits:** `4afbe9e` ABM de usuarios · `3272d4e` agenda de clases

### 2026-10-17 · 4 h
* **Actividad:** Implementé el módulo de gestión de planes y estado de membresía (`PlanCard`, `MembresiaEstadoCard`, `AccionesMembresia`, `MembresiasPage`) y el pase de acceso con QR dinámico y cuenta regresiva (`QrDinamico`, `CuentaRegresiva`, `AccesoPage`), junto con sus suites de tests en Vitest.
* **Decisión:** Bloquear estrictamente la generación del QR en pantalla cuando la membresía está vencida, suspendida o inexistente, mostrando el motivo y el acceso a regularización.
* **Commits:** `efe590e` planes y membresía · `35d6a72` QR dinámico

---

## Sprint 6 — Unidad IV — Semana del 2026-10-19

### 2026-10-22 · 2 h
* **Actividad:** Revisé y mergeé el flujo de login y registro público de Luciano, verificando las reglas de roles y validación de formularios.
* **Commits:** Sin commits (revisión y aprobación del PR #53).

---

## Sprint 7 — Cierre — Semana del 2026-11-02

### 2026-11-07 · 3 h
* **Actividad:** Corregí el bug de cálculo de días restantes en membresías vencidas (SCRUM-124) y ajusté las pruebas unitarias tras la revisión de Sourcery.
* **Problema o bloqueo:** Una membresía vencida mostraba "Días restantes: 14" (y al aplicar `Math.ceil` sin normalizar la hora, un vencimiento del día anterior daba `0` en lugar de negativo).
* **Decisión:** Normalizar tanto la fecha actual como la de vencimiento al inicio del día calendario (`00:00:00`) para obtener la diferencia exacta con signo y validar en Vitest que fechas pasadas devuelvan un número estrictamente menor a cero.
* **Commits:** `a1c9837` días restantes · `a91ef6e` inicio de día

### 2026-11-08 · 3 h
* **Actividad:** Corregí la búsqueda por DNI de socios sin membresía en recepción (SCRUM-125) y actualicé los tests de integración.
* **Problema o bloqueo:** Buscar un socio sin membresía disparaba una alerta global de "Error de servidor" por el `404` del backend, y silenciar toda la petición ocultaba otros fallos reales en pantallas como Pagos.
* **Decisión:** Capturar específicamente el `404` en `membresiasService` para tratarlo como un estado normal de UI (`SIN_MEMBRESIA`) sin disparar toasts de error, relanzando cualquier otro error HTTP, y configurar el botón "Asociar Membresía" para abrir el modal con el socio ya precargado.
* **Commits:** `fab8f2e` búsqueda sin membresía · `20a39b6` solo 404