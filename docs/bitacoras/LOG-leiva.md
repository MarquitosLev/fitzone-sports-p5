# Bitácora — Leiva, Marcos Joel — Rol P1

## Sprint 1 — Unidad I — Semana del 2026-08-17

### 2026-08-22 · 2 h

**Actividad**
Primera reunión de análisis. Propuse React para el front con Maxi como referente, y Java con Spring Boot y PostgreSQL para el back.

**Decisión**
Elegí PostgreSQL por el RLS, que permite separar sedes en una sola base. También propuse proteger develop y main para que todo entre por PR.

**Commits**
Sin commits: todavía no existía el repositorio.

---

## Sprint 2 — Unidad I — Semana del 2026-08-24

### 2026-08-28 · ? h

**Actividad**
Quedó armado el tablero en Jira con las primeras tareas: diagramas C4 e inicializar front y back.

**Commits**
Sin commits.

---

## Sprint 2 — Unidad I — Semana del 2026-08-31

### 2026-08-31 · 1 h

**Actividad**
Propuse arrancar por el modelo C4 para tener el sistema resumido, y quedamos en trabajar con Scrum en sprints de dos semanas.

**Problema o bloqueo**
Nadie sabía bien cómo redactar un ADR. Lo dejamos para consultarlo con el profe en la clase del jueves.

**Commits**
Sin commits.

### 2026-09-06 · 2 h

**Actividad**
Cerramos el alcance y me tocó el DER con Matías y Luciano.

**Decisión**
Gimnasio único con varias sedes en lugar de un SaaS para varias cadenas, login con Supabase Auth en lugar de uno propio y pago simulado.

**Problema o bloqueo**
En Jira había problemas de permisos para ver los equipos. Como todos podían mover y asignarse tarjetas, no nos frenó.

**Commits**
Sin commits.

---

## Sprint 3 — Unidad II — Semana del 2026-09-07

### 2026-09-13 · ? h

**Actividad**
Creé el repositorio con fz-frontend y fz-backend.

**Commits**
`6d6e6ee` commit inicial

---

## Sprint 3 — Unidad II — Semana del 2026-09-14

### 2026-09-14 · ? h

**Actividad**
Configuré Postgres en Docker, los perfiles por entorno y el Dockerfile del back. Inicialicé el front con Vite y una vista que consulta el /ping.

**Problema o bloqueo**
El front no podía llamar al back por CORS, así que lo habilité en el endpoint de ping.

**Commits**
`e9d33ac` docker y perfiles · `e183395` extensiones de init.sql · `f4fe95e` ping · `6a98ddc` front con Vite

### 2026-09-16 · ? h

**Actividad**
Dejé andando los entornos en Supabase, Vercel y Render. El back despliega desde develop.

**Decisión**
Front en Vercel, back en Render con Docker y base en Supabase, todo en plan gratuito.

**Commits**
Sin commits nuevos: la configuración se hizo en los paneles (PR #1 y #2).

### 2026-09-20 · ? h

**Actividad**
Rehice el Docker de Postgres local y escribí la guía de desarrollo para trabajar con agentes de IA.

**Decisión**
Saqué el init script del Docker para que el esquema lo genere Hibernate y todos tengan la misma base.

**Commits**
`9587f66` docker sin init script · `a864de2` guía para agentes

---

## Sprint 4 — Unidad II — Semana del 2026-09-21

### 2026-09-26 · ? h

**Actividad**
Hice la entidad Usuario sobre la BaseEntity de Benja, vinculada al usuario de Supabase Auth.

**Commits**
`cb64b02` entidad Usuario

---

## Sprint 4 — Unidad II — Semana del 2026-09-28

### 2026-09-29 · ? h

**Actividad**
Agregué las entidades Plan, Membresía y Cancha con sus repositorios, y cerré la capacitación de Spring Boot.

**Commits**
`86611d4` Plan · `02e8747` Membresía · `ef3cd7d` Cancha

### 2026-10-03 · ? h

**Actividad**
Corregí la entidad Cancha después de la revisión de Agustín.

**Problema o bloqueo**
Una variable no respetaba la nomenclatura del equipo; la renombré.

**Commits**
`839ac68` nombre de variable

---

## Sprint 5 — Unidad II — Semana del 2026-10-05

### 2026-10-07 · ? h

**Actividad**
Agregué Comprobante con su FK a Transacción.

**Problema o bloqueo**
MembresiaRepository hacía fallar el arranque por un método findByBetweenFechas que Spring Data no podía interpretar. Lo saqué y le agregué @Repository.

**Commits**
`d5de98f` Comprobante · `a9f6fb5` fix MembresiaRepository

---

## Sprint 5 — Unidad II — Semana del 2026-10-12

### 2026-10-14 · ? h

**Actividad**
Revisé el PR de Agustín con la base de la API: prefijo /api/v1, formato de error y Swagger.

**Commits**
Sin commits: revisión del PR #22.

### 2026-10-18 · ? h

**Actividad**
Hice los endpoints de alta, perfil, búsqueda y edición de usuarios contra Supabase Auth, con la colección de Bruno y datos de prueba.

**Problema o bloqueo**
La revisión marcó varias correcciones y las resolví en el mismo PR.

**Commits**
`1ec1f40` endpoints de usuarios · `e83c58e` Bruno y datos de prueba · `876bc40` correcciones de la revisión

---

## Sprint 6 — Unidad II — Semana del 2026-10-19

### 2026-10-19 · ? h

**Actividad**
Agregué un endpoint protegido /admin/database/query para consultar la base y terminé la conexión con Supabase.

**Commits**
`a010a36` endpoint de consulta

### 2026-10-24 · ? h

**Actividad**
Revisé el PR de Agustín con los guards por rol y el panel de permisos.

**Commits**
Sin commits: revisión del PR #54.

---

## Sprint 6 — Unidad II — Semana del 2026-10-26

### 2026-10-26 · ? h

**Actividad**
Revisé y mergeé el PR de Benja que integra el módulo 2 (QR, ingreso y aforo) con la API real.

**Commits**
Sin commits: revisión del PR #57.

### 2026-11-01 · ? h

**Actividad**
Integré clases con el usuario autenticado. También relevé lo que faltaba de la consigna y lo cargué como historias de usuario y backlog técnico.

**Problema o bloqueo**
En reservas y lista de espera el socio venía en el body, así que cualquiera podía reservar a nombre de otro.

**Decisión**
Tomar el usuario del token con UsuarioActual y permitir cancelar solo lo propio.

**Commits**
`c11b569` clases con usuario autenticado · `1214c42` historias y backlog · `d73483c` correcciones del backlog

---

## Sprint 7 — Unidad II — Semana del 2026-11-02

### 2026-11-05 · ? h

**Actividad**
Cerré la API: ahora exige sesión y rol en todo menos las rutas públicas.

**Problema o bloqueo**
Casi toda la API seguía con permitAll y los 401 y 403 no usaban el formato de error del resto.

**Decisión**
Dejar en SecurityConfig solo la lista de rutas públicas y exigir JWT en todas las demás.

**Commits**
`6006a25` sesión y rol en toda la API

### 2026-11-06 · ? h

**Actividad**
Integré canchas y pagos con el usuario autenticado. Les puse nombre a las FK y agregué CHECK en la base.

**Problema o bloqueo**
El CHECK de concepto de transacción aceptaba solo 2 de los 4 valores. Armé un script para corregirlo en las bases ya creadas.

**Decisión**
La sede del cobro sale siempre de la cancha de la reserva, no del request.

**Commits**
`fa4533b` canchas · `cdfa2e5` pagos · `5626e36` sede del cobro · `50ebc69` FK y CHECK · `f161158` comentarios

### 2026-11-06 · ? h

**Actividad**
Conecté clases, canchas, pagos y la sesión del front con la API real, saqué los mocks de la interfaz y publiqué develop en main.

**Problema o bloqueo**
Las reservas de las próximas 3 horas no aparecían para pagar porque se comparaba en UTC; lo pasé a hora local. Además, en Vercel recargar una ruta daba 404, y lo resolví redirigiendo todo a index.html.

**Decisión**
Reintentar un pago rechazado es un pago nuevo sobre la misma reserva o membresía (ADR-012).

**Commits**
`bc0254e` clases · `c8baabc` canchas · `7d193dd` pagos · `b7fa922` sesión y rutas · `d1f2a4b` motivo del 403 · `f37bb45` · `4c81a93` · `17d7134` hora local · `cbf9e7a` sin mocks · `fdcabca` Vercel

### 2026-11-07 · ? h

**Actividad**
Armé el pipeline de GitHub Actions con reporte de cobertura, que era lo que faltaba de la Unidad V.

**Decisión**
Back y front en jobs paralelos, con JaCoCo y la cobertura de vitest publicadas como artefactos.

**Commits**
`fd6f8e7` pipeline CI y cobertura

### 2026-11-08 · ? h

**Actividad**
Aislé la sesión por pestaña.

**Problema o bloqueo**
Iniciar sesión con otro rol en otra pestaña pisaba la sesión abierta, porque localStorage se comparte entre pestañas.

**Decisión**
Guardar la sesión en sessionStorage.

**Commits**
`218ce09` sesión en sessionStorage
