# Bitácora — Aquino, Benjamín — Rol P2

## Sprint 1 — Unidad I — Semana del 2026-08-17

### 2026-08-22 · 2 h

**Actividad** Primera reunión de análisis. Quedé en el equipo de back con Marcos y Agustín, y acordamos una etapa de capacitación en Spring Boot antes de programar.

**Commits** Sin commits: todavía no existía el repositorio.

---

## Sprint 2 — Unidad I — Semana del 2026-08-31

### 2026-09-06 · 2 h

**Actividad** Me tocó el UML con Agustín y Maxi. Ya tenía asignada la tarea de inicializar el backend (SCRUM-16).

**Commits** Sin commits.

---

## Sprint 3 — Unidad I — Semana del 2026-09-14

### 2026-09-20 · ≈ 1,5 h

**Actividad** Cerramos el UML con Agustín y Maxi para arrancar con las entidades.

**Commits** Sin commits: el diagrama está en el Drive.

---

## Sprint 4 — Unidad II — Semana del 2026-09-21

### 2026-09-21 · ≈ 1,5 h

**Actividad** Hice la BaseEntity con auditoría, la configuración de JPA y los enums del dominio (SCRUM-42).

**Commits** `51c22f3` BaseEntity, JPA y enums

### 2026-09-23 · ≈ 1,5 h

**Actividad** Rediseñé la BaseEntity para que guarde quién creó y modificó cada registro y tenga borrado lógico. Lo sumé al PR #5, que Marcos aprobó y mergeó el 26/09 después de pedir cambios.

**Decisión** Saqué el enum TipoCancha para que los tipos de cancha sean un dato configurable. Cambié ConceptoTransaccion por TipoOrigenTransaccion.

**Commits** `82646c5` rediseño de BaseEntity

---

## Sprint 4 — Unidad II — Semana del 2026-09-28

### 2026-09-28 · ≈ 2,5 h

**Actividad** Hice la entidad Sede (SCRUM-31, PR #8, mergeado por Agustín).

**Problema o bloqueo** Las carpetas del back habían quedado desordenadas y las reorganicé en un PR aparte (#9).

**Commits** `0377757` Sede · `c3fa057` reorganización de carpetas

### 2026-09-29 · ≈ 1,5 h

**Actividad** Mergeé el PR #9 de la reorganización y el PR #6 de Marcos con la entidad Usuario.

**Commits** Sin commits: merge de PR.

### 2026-10-03 · ≈ 2 h

**Actividad** Agregué la entidad Acceso con su repositorio (SCRUM-33, PR #18). Revisé y mergeé el PR #17 de Agustín con ReservaCancha.

**Commits** `90bf6ba` Acceso

### 2026-10-04 · ≈ 1,5 h

**Actividad** Agregué la entidad Transacción con su repositorio (SCRUM-40, PR #19).

**Commits** `8e4c413` Transacción

---

## Sprint 5 — Unidad II — Semana del 2026-10-05

### 2026-10-10 · ≈ 1,5 h

**Actividad** Revisé y mergeé el PR #20 de Marcos con el modelo Comprobante (SCRUM-41), que cerró las entidades del módulo de pagos junto con mi Transacción.

**Commits** Sin commits: revisión y merge de PR.

---

## Sprint 5 — Unidad II — Semana del 2026-10-12

### 2026-10-14 · ≈ 1,5 h

**Actividad** Revisé y mergeé el PR #21 de Agustín con los ajustes de los modelos que fallaban al levantar el back.

**Commits** Sin commits: revisión y merge de PR.

### 2026-10-17 · ≈ 2 h

**Actividad** Hice los endpoints de sedes con el aforo en tiempo real (SCRUM-66, PR #32) y los de agenda de clases (SCRUM-67, PR #33).

**Decisión** No se puede bajar el aforo ni el cupo por debajo de lo ocupado (422), ni borrar una clase con reservas (409).

**Commits** `45ae409` sedes y aforo · `bd9eb77` agenda de clases

---

## Sprint 6 — Unidad II — Semana del 2026-10-19

### 2026-10-19 · ≈ 3 h

**Actividad** Hice los endpoints de planes y membresías con su colección de Bruno (SCRUM-70, PR #43), y agregué la duración en meses al plan.

**Commits** `2ab0917` planes y membresías

### 2026-10-20 · ≈ 3 h

**Actividad** Corregí la creación de membresías dentro del mismo PR #43. Revisé y mergeé el PR #39 de Agustín con los endpoints de canchas.

**Problema o bloqueo** Con dos pedidos al mismo tiempo se creaban membresías duplicadas, y la tarea diaria no vencía las suspendidas.

**Decisión** Bloqueo pesimista por usuario dentro de la transacción.

**Commits** `b49eadb` concurrencia y vigencia de membresías

### 2026-10-20 · ≈ 3 h

**Actividad** Hice la validación de ingreso con QR dinámico (SCRUM-71, PR #45) y la reserva y cancelación de clases (SCRUM-72, PR #48).

**Problema o bloqueo** El ingreso podía pasarse del aforo o dejar entrar con una membresía cancelada. Lo resolví con bloqueos y QR de un solo uso.

**Decisión** El QR va firmado con HMAC y vence a los 60 segundos.

**Commits** `6f57e83` ingreso con QR · `f4ee705` concurrencia en accesos · `c24354a` reserva de clases

### 2026-10-21 · ≈ 6 h

**Actividad** Hice la generación y descarga del comprobante en PDF con OpenPDF, con numeración correlativa (SCRUM-77, PR #51). Revisé y mergeé el PR #46 de Agustín con la cotización de turnos.

**Problema o bloqueo** La rama de reserva de clases chocaba con develop: el ingreso con QR y las reservas agregaban códigos de error distintos al mismo CodigoError y los dos tocaban UsuarioController. Unifiqué los códigos, dejé los dos endpoints en el controlador y ajusté los mocks del test.

**Commits** `fb5f2c0` conflictos con develop · `6139619` comprobante PDF · `99abde7` limpieza de Bruno

### 2026-10-22 · ≈ 1,5 h

**Actividad** Revisé y mergeé los PR de Agustín de la grilla de turnos (#47), la lista de espera con Observer (#49) y la pasarela de pago simulada (#50).

**Commits** Sin commits: revisión y merge de PR.

### 2026-10-23 · ≈ 1,5 h

**Actividad** Integré el control de acceso de punta a punta con el front (SCRUM-96 y SCRUM-101).

**Problema o bloqueo** Acceso tiraba LazyInitializationException al serializar. Lo resolví con @EntityGraph y @JsonIgnore.

**Commits** `6331756` módulo 2 end-to-end

### 2026-10-25 · ≈ 2,5 h

**Actividad** Pasé el módulo de acceso a usar el usuario autenticado: el socio pide su QR con /usuarios/me/qr y la sede sale del operador logueado. Revisé y mergeé el PR #55 de Agustín con los datos de prueba.

**Decisión** El operador solo ve el aforo y los accesos de su sede asignada; si pide otra sede, responde 403.

**Commits** `6bb4d24` sesión autenticada en módulo 2 · `52edde4` módulo 2 con usuario autenticado

---

## Sprint 6 — Unidad II — Semana del 2026-10-26

### 2026-10-26 · ≈ 2,5 h

**Actividad** Revisé y mergeé el PR #56 de Agustín con el módulo 1, sincronicé mi rama con esos cambios y abrí el PR #57 del módulo 2, que Marcos revisó y mergeó el 06/11.

**Problema o bloqueo** Al traer el JWT de Supabase del módulo 1, el ingreso seguía mandando el id de sede en el body. Para operadores con sede asignada lo saqué y la sede activa se sincroniza sola.

**Commits** `02ee8b7` cierre de la integración M2 con JWT real

---

## Sprint 7 — Cierre — Semana del 2026-11-02

### 2026-11-06 · ≈ 2,5 h

**Actividad** Corregí errores de canchas y navegación que salieron en las pruebas de punta a punta (SCRUM-118, PR #72; SCRUM-119, PR #73; SCRUM-128, PR #74).

**Problema o bloqueo** El desglose mostraba −13% de descuento en vez del 15%, porque se dividía sobre base más recargo. El aviso "Sin permiso" salía duplicado por el StrictMode, y lo resolví con useRef.

**Commits** `b8077a8` descuento de socio · `e38b984` etiquetas de cancha · `97cbafb` aviso duplicado

### 2026-11-07 · ≈ 1 h

**Actividad** Corregí la renovación desde Mi Pase QR (SCRUM-123, PR #76), el reintento de pagos (SCRUM-121, PR #77) y el layout (SCRUM-132, PR #78). Sumé PADDLE a las opciones del formulario de canchas en el PR #73.

**Problema o bloqueo** "Renovar plan" mandaba al socio a una pantalla de personal y rebotaba; ahora va a pagos con la membresía preseleccionada. Un pago rechazado seguía ofreciendo "Reintentar" aunque después se hubiera aprobado otro pago de la misma reserva o membresía.

**Commits** `fc11c4d` renovar desde QR · `00333b0` preselección · `2c20b19` reintento · `0b7e828` layout · `d6d0e58` PADDLE en formulario

### 2026-11-07 · ≈ 1 h

**Actividad** Ajusté la seguridad del back (SCRUM-131, PR #79).

**Problema o bloqueo** Devolvía 400 en vez de 403 porque validaba antes de mirar el rol, y el ingreso exponía el authId del usuario.

**Commits** `ba7bb54` 403 previo y authId

### 2026-11-08 · ≈ 3 h

**Actividad** Afiné el cambio del authId y las reglas de autorización según la revisión de Marcos del PR #79.

**Problema o bloqueo** Ocultar el authId en Usuario rompía el detalle en la pantalla de usuarios: todos aparecían como "Sin credencial (Externo)".

**Decisión** Ocultarlo solo en la respuesta de accesos.

**Commits** `bbe0e96` reglas de autorización y authId

---

## Sprint 7 — Cierre — Semana del 2026-11-09

### 2026-11-09 · ≈ 1,5 h

**Actividad** Revisé y mergeé los fixes de pagos de Agustín: el desglose de la cancha (#82) y la vigencia al renovar (#83).

**Commits** Sin commits: revisión y merge de PR.

### 2026-11-10 · ≈ 3 h

**Actividad** Revisé y mergeé el PR #84 de Agustín con la reserva de cancha como invitado y el PR #89 de Luciano con la sincronización del auth_id en el login.

**Commits** Sin commits: revisión y merge de PR.

### 2026-11-13 · ≈ 1,5 h

**Actividad** Agregué mi bitácora al repositorio (PR #99).

**Commits** `3b2dc89` bitácora

---

## Sprint 8 — Cierre — Semana del 2026-11-16

### 2026-11-19 · ≈ 6 h

**Actividad** Hice la descarga del comprobante en PDF desde Mis Reservas (SCRUM-146, PR 107). Resolví conflictos con develop en CanchasPage para SCRUM-141 (PR 111). Revisé y mergeé los PR del equipo de gerente central (PR 106), login de invitados (PR 110), bloqueo de planes a personal (PR 112), solapas de canchas (PR 108) y sede en mobile (PR 111). Revisé el PR 113 de retención de reservas (SCRUM-148).

**Problema o bloqueo** En Mis Reservas, si fallaba buscar el comprobante usaba el ID de transacción y tiraba 404, y con varias transacciones guardaba la vieja en lugar de la última. En CanchasPage los tests chocaban con los cambios de roles de develop y el timeout fallaba al correr toda la suite.

**Commits** `4e0b22f` comprobante en reservas · `6ba2b68` fixes de descarga · `8a6e94a` conflictos develop SCRUM-146 · `ba21047` conflictos develop SRUM-141 · `30a69c7` merge PR 111
