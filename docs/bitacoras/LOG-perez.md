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

### 2026-11-11 · ? h

**Actividad** Implementé la sincronización automática del auth\_id con Supabase Auth en el primer login (TOFU).  
**Problema o bloqueo** Los usuarios se creaban con UUIDs aleatorios que no coincidían con los de Supabase Auth e impedían iniciar sesión.

**Commits** `7c3e24c` sincronización de auth\_id con Supabase (TOFU)

