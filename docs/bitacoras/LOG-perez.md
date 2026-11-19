# Bitácora — Pérez, Luciano — Rol P3

## Sprint 1 — Unidad I — Semana del 2026-08-17

### 2026-08-22 · 2 h

**Actividad** Primera reunión de análisis. Quedé en el equipo de front con Matías y Maxi.

**Decisión** Front en React, con Maxi guiando al resto en componentes y hooks.

**Commits** Sin commits: todavía no existía el repositorio.

---

## Sprint 2 — Unidad I — Semana del 2026-08-31

### 2026-09-06 · 2 h

**Actividad** Me tocó el DER con Marcos y Matías.

**Commits** Sin commits.

---

## Sprint 3 — Unidad I — Semana del 2026-09-14

### 2026-09-20 · ? h

**Actividad** Terminé el DER, que quedó en la carpeta de documentación del Drive.

**Commits** Sin commits: el diagrama está en el Drive.

---

## Sprint 5 — Unidad IV — Semana del 2026-10-12

### 2026-10-16 · ? h

**Actividad** Armé el esqueleto del front: rutas, layout con menú y selector de sede.

**Decisión** Un solo cliente HTTP para toda la app, que maneja los errores y muestra los avisos.

**Commits** `65a809e` esqueleto, rutas y servicios

### 2026-10-17 · ? h

**Actividad** Hice la vista de clases, reservas y lista de espera para el socio, con 21 tests nuevos.

**Problema o bloqueo** Las fechas del back se corrían por la zona horaria y rompían las reglas de 48 hs y 2 hs. Hice un helper para leerlas en hora local.

**Commits** `95c7222` vista de clases · `4fbd031` correcciones · `6ec361e` zona horaria en mocks

### 2026-10-18 · ? h

**Actividad** Hice la pantalla de recepción con la validación del QR y el monitor de aforo.

**Commits** `7a20901` validación de acceso y aforo

---

## Sprint 6 — Unidad IV — Semana del 2026-10-19

### 2026-10-19 · ? h

**Actividad** Hice el checkout de pago simulado y los comprobantes.

**Problema o bloqueo** Reintentar un pago rechazado lo convertía en una cuota de membresía. Ahora mantiene la reserva y el importe original.

**Commits** `661f926` checkout y comprobantes

### 2026-10-20 · ? h

**Actividad** Corregí la descarga de PDF y las validaciones del checkout.

**Problema o bloqueo** Los PDF se descargaban corruptos porque liberaba la URL del archivo antes de que terminara la descarga. También agregué protección contra el doble cobro.

**Commits** `5ec27b0` PDF y validaciones

### 2026-10-22 · ? h

**Actividad** Hice el login, el registro público, el logout y la redirección por rol, más pantallas base por rol para probar la integración.

**Commits** `cf3e72b` login y registro · `2d2bfb9` pantallas por rol

---

## Sprint 7 — Cierre — Semana del 2026-11-02

### 2026-11-08 · ? h

**Actividad** Limpié textos de la interfaz que salieron en las pruebas de punta a punta.

**Problema o bloqueo** Quedaban en pantalla códigos de requisito, textos de demo y "1 meses" en el alta de membresía.

**Commits** `dd0cd67` textos de la interfaz 

### 2026-11-08 · ? h

**Actividad** Completé el backend de seguridad del login (SCRUM-130): implementé la vinculación del `auth_id` real de Supabase en `JwtAuthConverter`, `UsuarioActual` y `AuthController`, con fallback por email insensible a mayúsculas. También alineé el nombre `"Plan Anual VIP"` en `DataInitializer.java`, protegí los `setval` de las secuencias en el SQL de seed y documenté el procedimiento de reseteo de volúmenes de Docker.

**Problema o bloqueo** Los usuarios del seed se creaban con UUIDs aleatorios que nunca coincidían con los que Supabase emitía al hacer login real. La solución fue no guardar ningún `auth_id` en el seed y vincular el UUID real de Supabase de forma automática en el primer login (patrón TOFU), solo si el campo estaba vacío.

**Commits** `18663ba` sincronización auth\_id en backend, seed y documentación

### 2026-11-11 · ? h

**Actividad** Integré los cambios de `develop` en la rama `SCRUM-130`, resolví los conflictos con `SCRUM-134` (donde `EXTERNO` pasó a ser un invitado sin cuenta) y aplicé la corrección final de seguridad: rechazar el login si `tipoUsuario == EXTERNO`, y bloquear la sobreescritura del `auth_id` si el usuario encontrado por email ya tenía uno distinto de `null`.

**Problema o bloqueo** Sourcery detectó que el `auth_id` podía sobrescribirse con el UUID de otro usuario que tuviera el mismo email, lo que habilitaba un takeover de cuenta. Se corrigió con la validación TOFU estricta.

**Commits** `7c3e24c` guard TOFU estricto y resolución de conflictos con develop

---

## Sprint 8 — Cierre Final — Semana del 2026-11-13

### 2026-11-13 · ? h

**Actividad** Documenté la bitácora personal y abrí el PR de entrega (SCRUM-138).

**Commits** `e31c76f` bitácora de Pérez · `3ffc3b7` merge PR #95

### 2026-11-19 · ? h

**Actividad** Implementé SCRUM-142: agregué en `LoginPage.tsx` el logo como enlace a `/canchas` y el texto explícito "Continuar sin iniciar sesión" para que los usuarios invitados puedan navegar al inicio sin tener cuenta.

**Commits** `8e85cd3` enlace al inicio desde LoginPage para usuarios invitados

### 2026-11-19 · ? h

**Actividad** Resolví un hallazgo bloqueante de code review (Sourcery) en `LoginPage.tsx`: mientras el login estaba en progreso, el usuario podía navegar con los enlaces de salida y, al resolverse la promesa en segundo plano, `navigate()` sobreescribía la ruta nueva. Apliqué dos barreras: bloqueo visual y funcional de los tres enlaces de salida (`aria-disabled`, `pointer-events-none`, `onClick` con `preventDefault`) y una referencia `useRef` (`montado`) para que si el componente se desmontó antes de que resuelva el login, no se dispare ningún `navigate` ni actualización de estado tardíos. Agregué tres pruebas unitarias de regresión que cubren los tres escenarios: enlace "Continuar" bloqueado, logo y botón de registro bloqueados, y desmontaje antes de la resolución.

**Problema o bloqueo** Race condition: el usuario clickeaba "Continuar sin iniciar sesión" durante la promesa de login, navegaba a `/canchas`, y al resolverse el `await login()` se ejecutaba `navigate('/mi-qr', { replace: true })`, pisando la ruta a la que ya había llegado el usuario.

**Commits** `c1cdbeb` guard de desmontaje y bloqueo de enlaces durante login en progreso

