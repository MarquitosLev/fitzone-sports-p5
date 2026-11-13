# Bitácora — Chang, Maximiliano — Rol P3

## Sprint 1 — Unidad I — Semana del 2026-08-17

### 2026-08-22 · 2 h

**Actividad**
Primera reunión de análisis general. Quedé asignado como referente técnico de frontend para acompañar y guiar al equipo en la arquitectura de componentes, modularización y custom hooks en React.

**Decisión**
Frontend en React con Vite y TypeScript, priorizando componentes funcionales limpios, desacoplamiento de capas y Tailwind CSS para el diseño.

**Commits**
Sin commits: todavía no existía el repositorio.

---

## Sprint 2 — Unidad I — Semana del 2026-08-24

### 2026-08-28 · 1 h

**Actividad**
Con el tablero de Jira configurado, se definieron los primeros ítems del backlog y me asignaron la tarea técnica de inicialización de la estructura base del frontend.

**Commits**
Sin commits: planificación y relevamiento de dependencias.

---

## Sprint 2 — Unidad I — Semana del 2026-08-31

### 2026-09-06 · 2 h

**Actividad**
Trabajé en el modelado del diagrama de clases UML junto a Benjamín y Agustín, delimitando las entidades del dominio y su correspondencia con las interfaces necesarias en el cliente web.

**Commits**
Sin commits: trabajo sobre la documentación y diagramas en Drive.

---

## Sprint 3 — Unidad I — Semana del 2026-09-14

### 2026-09-20 · 2 h

**Actividad**
Cerramos la revisión del diagrama UML y dimos por completada la tarea de inicialización del frontend, coordinando con Marcos para verificar el despliegue continuo de la base de Vite en Vercel.

**Commits**
Sin commits propios: la base inicial del frontend quedó integrada en `6a98ddc`.

---

## Sprint 5 — Unidad IV — Semana del 2026-10-12

### 2026-10-15 · 4 h

**Actividad**
Creé la rama `SCRUM-64` desde `develop` para estructurar la base definitiva del frontend (`fz-frontend/`) y el kit de componentes de UI reutilizables. Migré la totalidad de componentes, páginas de prueba y contexto a TypeScript estricto. Abrí el PR #27 hacia `develop`.

**Problema o bloqueo**
En la revisión de código surgieron observaciones de tipado estricto en genéricos, problemas de accesibilidad (a11y) y atrapado de foco en el `Modal`. Los resolví implementando `useId()` para identificadores accesibles, tipado compuesto en `Card` y agregando la suite de tests unitarios con Vitest y React Testing Library.

**Commits**
`5581e7d` setup base y librería de componentes UI reutilizables · `5d76466` migración a TypeScript · `b2b0a86` correcciones de code review (a11y y tipado estricto) · `5b1b348` tests unitarios en Vitest

### 2026-10-16 · 3 h

**Actividad**
Creé la rama `SCRUM-78` desde `develop` para configurar la paleta corporativa `fitzone-*` en Tailwind CSS y el header institucional oscuro (PR #29). Luego, en la rama `SCRUM-79`, corregí la lógica del formulario y agenda de clases grupales (PR #30). Además, revisé e integré el módulo de ABM de usuarios desarrollado por Matías.

**Problema o bloqueo**
En la agenda de clases ocurría un error de división por cero en el cálculo del porcentaje de cupo ocupado, se permitía seleccionar fechas pasadas y el payload al backend enviaba campos innecesarios. Se sanitizó la carga útil, se agregó validación de fecha futura y se rediseñó la visualización de la agenda.

**Commits**
`20369ba` paleta FitZone de Tailwind y header institucional · `2050956` correcciones en agenda de clases (cupo y validación de fecha)

### 2026-10-17 · 3 h

**Actividad**
Creé la rama `SCRUM-80` desde `develop` para implementar el módulo de gestión de canchas y estado de mantenimiento exclusivo para el rol Gerente (RF-09). Configuré tests de integración con mocks y abrí el PR #31 hacia `develop`.

**Decisión**
Mapear los errores HTTP de conflicto (409) de manera explícita para alertar sobre solapamientos o canchas con reservas activas, y simplificar el toggle de inhabilitación por mantenimiento en un solo clic con confirmación.

**Commits**
`9ed5fa7` gestión de canchas y mantenimiento para gerente · `81dd906` tests de integración y mapeo de errores de conflicto

### 2026-10-18 · 5 h

**Actividad**
Creé la rama `SCRUM-84` desde `develop` para construir la grilla interactiva de turnos y el flujo de reserva de canchas para socios y clientes externos (RF-10 / RF-11), con su playground de pruebas (PR #37). Posteriormente, en la rama `fix/mocks-centralize-SCRUM-84`, corregí la configuración del cliente y las sedes (PR #38).

**Problema o bloqueo**
Cada servicio inspeccionaba la variable de entorno `VITE_USE_MOCK` con criterios distintos (`!= null`, booleanos, etc.), generando comportamientos erráticos donde algunas vistas usaban mocks y otras llamaban al backend. Además, en modo real no se cargaban las sedes desde la API.

**Decisión**
Centralizar la bandera en `src/config.ts` para que `USE_MOCK` se active exclusivamente cuando su valor sea la cadena `'true'`, y ajustar `App.tsx` para cargar las sedes reales mediante `fetch` al iniciar cuando los mocks están inactivos.

**Commits**
`3c8f6a6` reserva de canchas RF-10/RF-11 · `41acb24` interfaz y grilla de reserva de canchas · `def74b9` playground y corrección de JSX · `139dddf` unificación de lectura de VITE_USE_MOCK · `3f27d28` centralización de USE_MOCK en config.ts · `7ddd8cf` carga de sedes reales en App.tsx

---

## Sprint 6 — Unidad V — Semana del 2026-10-19

### 2026-10-22 · 2 h

**Actividad**
Creé la rama `SCRUM-90` desde `develop` para corregir la suite de pruebas automatizadas del formulario de clases en el pipeline de CI/CD.

**Problema o bloqueo**
El test de `ClaseForm` fallaba en las corridas automáticas porque utilizaba una fecha estática hardcodeada que, al transcurrir los días, quedó en el pasado e infringía la validación de negocio de fechas futuras. Se ajustó para generar fechas relativas dinámicas (`Date.now() + 48h`).

**Commits**
`3936508` fix de fecha dinámica en prueba de ClaseForm

---

## Sprint 7 — Cierre — Semana del 2026-11-02

### 2026-11-07 · 5 h

**Actividad**
Jornada intensiva de corrección de defectos detectados durante las pruebas de integración end-to-end:
1. En la rama `SCRUM-126`, corregí el flujo de lista de espera y cupos en clases (PR #80).
2. En la rama `SCRUM-127`, aseguré el control de acceso y visibilidad de pestañas por rol (PR #81).
3. En la rama `Scrum-124`, colaboré resolviendo el cálculo de vigencia de membresías (PR #75).

**Problema o bloqueo**
El socio en lista de espera no podía reservar inmediatamente cuando otro usuario cancelaba y se liberaba un cupo disponible. Además, el Gerente visualizaba de forma indebida las solapas operativas de reserva de clases y turnos que pertenecen únicamente al Socio. Por último, el cálculo de días restantes de la membresía difería por desfases de zona horaria y redondeo.

**Decisión**
Priorizar la acción de confirmación de reserva directa sobre la lista de espera ante cupo liberado, condicionar el renderizado de navegación y vistas estrictamente según el `tipoUsuario`, y estandarizar el cálculo de días de membresía con fechas calendario puras y tests unitarios estrictos.

**Commits**
`93002a6` priorización de reserva sobre lista de espera ante cupo libre · `a56126a` test de habilitación de reserva con cupo liberado · `2cd2f5f` corrección de cálculo de días restantes de membresía · `e82ac6b` sincronización de pestaña activa por rol · `9d4eef1` restricción de pestañas de reserva a rol socio · `1a54fe1` renderizado condicional de vistas de reserva · `2cb72c4` tests de visibilidad y accesos por rol
