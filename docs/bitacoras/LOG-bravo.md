# Bitácora — Bravo, Agustín — Rol P2

## Sprint 1 — Unidad I — Semana del 2026-08-17

### 2026-08-22 · 2 h

**Actividad** Primera reunión de análisis. Quedé en el equipo de back con Marcos y Benja.

**Decisión** Para el back elegimos Java con Spring Boot en lugar de Python.

**Commits** Sin commits: todavía no existía el repositorio.

---

## Sprint 2 — Unidad I — Semana del 2026-08-31

### 2026-09-06 · 2 h

**Actividad** Me tocó el diagrama UML (SCRUM-25) junto con Benja y Maxi.

**Commits** Sin commits.

---

## Sprint 3 — Unidad I — Semana del 2026-09-14

### 2026-09-20 · ≈ 1,5 h

**Actividad** Terminé el UML (SCRUM-25), que quedó en la carpeta de documentación del Drive.

**Commits** Sin commits: el diagrama está en el Drive.

---

## Sprint 4 — Unidad II — Semana del 2026-09-21

### 2026-09-27 · ≈ 1,5 h

**Actividad** Hice la entidad ClaseGrupal con su repositorio (SCRUM-35) y abrí el PR #7.

**Commits** `5268a3f` ClaseGrupal

---

## Sprint 4 — Unidad II — Semana del 2026-09-28

### 2026-09-29 · ≈ 2 h

**Actividad** Traje develop a mi rama de ClaseGrupal y la corregí después de la revisión. Actualicé el README y mergeé el PR #8 de Benja con la entidad Sede.

**Commits** `0e98c8d` merge de develop · `23d7dff` corrección ClaseGrupal · `05684bb` README

### 2026-09-30 · ≈ 1,5 h

**Actividad** Mergeé mis PR de ClaseGrupal (#7) y del README (#11). Revisé y mergeé el PR #10 de Marcos con la entidad Plan.

**Commits** Sin commits: revisión y merge de PR.

### 2026-10-03 · ≈ 5,5 h

**Actividad** Agregué ReservaClase (SCRUM-36, PR #14), ListaEspera (SCRUM-37, PR #15) y ReservaCancha (SCRUM-39, PR #17, revisado por Benja), con sus repositorios. Revisé y mergeé los PR de Marcos de Membresía (#12), Cancha (#13) y el cambio de nombre de variable de Cancha (#16).

**Commits** `ad982b4` ReservaClase · `4d624b8` ListaEspera · `1ecb506` ReservaCancha

---

## Sprint 5 — Unidad II — Semana del 2026-10-12

### 2026-10-14 · ≈ 2 h

**Actividad** Armé la base de la API (SCRUM-63): prefijo /api/v1, formato de error común, validación, Swagger y CORS.

**Problema o bloqueo** Al levantar el back con todas las entidades juntas aparecieron errores de ejecución por modelos mal mapeados. Los ajusté en un PR aparte (#21), que revisó y mergeó Benja, para no mezclarlo con la base de la API.

**Decisión** El prefijo /v1 se agrega en la configuración y no en cada controlador.

**Commits** `e57ee31` ajuste de modelos · `6208476` base de la API

### 2026-10-16 · ≈ 1,5 h

**Actividad** Mergeé el PR #22 de la base de la API después de la aprobación de Marcos.

**Commits** Sin commits: merge de PR.

### 2026-10-18 · ≈ 2,5 h

**Actividad** Hice los endpoints de gestión de canchas y mantenimiento (SCRUM-68, PR #39). Revisé y mergeé el PR #32 de Benja con sedes y aforo.

**Commits** `c855d32` endpoints de canchas

---

## Sprint 6 — Unidad II — Semana del 2026-10-19

### 2026-10-20 · ≈ 4,5 h

**Actividad** Implementé la cotización de turnos (SCRUM-73, PR #46) y la grilla de disponibilidad con reserva (SCRUM-75, PR #47). Mergeé los PR de Benja de agenda de clases (#33) y de planes y membresías (#43), y el de usuarios de Marcos (#40).

**Decisión** Usé el patrón Strategy para el precio, así cada regla (horario pico, descuento de socio) se cambia sin tocar el resto.

**Commits** `20a3cf8` cotización con Strategy · `0132da2` grilla y reserva

### 2026-10-21 · ≈ 4,5 h

**Actividad** Hice la lista de espera con notificación (SCRUM-74, PR #49) y los endpoints de la pasarela de pago simulada (SCRUM-76, PR #50). Revisé y mergeé los PR de Benja de ingreso con QR (#45) y reserva de clases (#48), y el de Marcos del endpoint seguro a la base (#44).

**Problema o bloqueo** Mi rama de la grilla había quedado atrás de develop. Al traer los cambios hubo conflictos en UsuarioController, y cuando entró la reserva de clases de Benja (SCRUM-72) tuve que sincronizar de nuevo antes de que se pudiera mergear el PR.

**Decisión** Usé Observer para la lista de espera: liberar un cupo dispara un evento y el notificador lo escucha sin acoplarse a las reservas.

**Commits** `9ccbd03` merge de develop · `86fc32b` conflictos en UsuarioController · `b0ac068` sincronización tras SCRUM-72 · `5414db4` lista de espera con Observer · `7da362e` pasarela simulada

### 2026-10-22 · ≈ 4,5 h

**Actividad** Conecté el login con Supabase Auth y la validación del JWT, e integré el módulo 1 de punta a punta (SCRUM-95 y SCRUM-100). Mergeé el PR #51 de Benja con el comprobante en PDF.

**Problema o bloqueo** Cambiando el id en la URL se podían tocar los datos de otro usuario. Agregué un control para que cada uno opere solo sobre lo suyo, y las credenciales inválidas ahora devuelven 401.

**Commits** `984d4f3` autenticación y roles · `746d7e2` módulo 1 end-to-end · `7d34908` navegación por rol

### 2026-10-24 · ≈ 4,5 h

**Actividad** Limpié vistas del front, agregué guards con 403 y un panel para que gerencia arme niveles de acceso (SCRUM-106 y SCRUM-107, PR #54).

**Problema o bloqueo** La revisión de Marcos marcó problemas en rutas, guards y capacidades, y los corregí.

**Commits** `a0a9744` guards y panel RBAC · `18dc55c` correcciones de la revisión

### 2026-10-25 · ≈ 3,5 h

**Actividad** Cargué datos de prueba para la integración (SCRUM-94, PR #55, revisado y mergeado por Benja) y conecté usuarios y membresías del front con la API real. Mergeé el PR #54 y abrí el PR #56 del módulo 1.

**Problema o bloqueo** El init-data.sql fallaba por la sintaxis de los intervalos de fecha y duplicaba datos al relanzar. Corregí la sintaxis y lo hice idempotente. Como el módulo 1 necesitaba esos datos, traje develop y la rama SCRUM-94 a la de integración.

**Commits** `e90480a` datos de prueba · `8f7da32` merge de develop · `840657f` merge de SCRUM-94 · `a45ddca` M1 con API real · `367d527` intervalos · `56cc6ca` idempotencia

---

## Sprint 6 — Unidad II — Semana del 2026-10-26

### 2026-10-26 · ≈ 1,5 h

**Actividad** Sincronicé la rama del módulo 1 con develop para cerrar el PR #56, que revisó y mergeó Benja.

**Commits** `a0d9d4d` merge de develop

---

## Sprint 7 — Cierre — Semana del 2026-11-02

### 2026-11-07 · ≈ 1 h

**Actividad** Corregí errores del checkout que salieron en las pruebas de punta a punta (SCRUM-120, PR #82, y SCRUM-122, PR #83).

**Problema o bloqueo** El pago de una cancha decía "Cuota membresía (Socio)" porque el ítem llegaba sin cotización. Además, la renovación mostraba el vencimiento viejo; agregué el cálculo de hasta cuándo queda vigente después de pagar.

**Decisión** El desglose muestra la cotización solo si coincide con el precio final que quedó congelado en la reserva.

**Commits** `1dc4201` desglose de cancha · `1a09031` vigencia al renovar

### 2026-11-07 · ≈ 1 h

**Actividad** Hice la reserva y el pago de cancha como invitado, sin cuenta (SCRUM-134, PR #84).

**Decisión** Solo socios y personal inician sesión. El cliente externo reserva con sus datos y un código de reserva que no se puede adivinar.

**Commits** `3ac5f7d` reserva como invitado

### 2026-11-08 · ≈ 4 h

**Actividad** Revisé y mergeé los fixes de Benja de descuento de socio (#72), etiquetas de cancha (#73), aviso duplicado (#74) y layout (#78), y los de Maxi de lista de espera (#80) y pestañas de clases (#81). Ajusté la vista del invitado y armé el alta de socio online (SCRUM-135).

**Problema o bloqueo** El PR #83 chocaba en PagosPage.test.tsx con otros fixes de pagos que también agregaban tests, y el #84 quedó atrás de develop; traje develop a las dos ramas. Además, el header mostraba "Usuario / Invitado" y ofrecía "Cerrar sesión" a quien no tiene sesión, y lo cambié para que diga "Cliente externo" y ofrezca iniciar sesión o asociarse.

**Decisión** La cuenta de socio se crea recién con el pago de la suscripción aprobado. Si Supabase falla después de cobrar, el pago queda registrado y la cuenta se puede reintentar.

**Commits** `9af1e20` merge de develop en SCRUM-122 · `22192c9` merge de develop en SCRUM-134 · `a960db3` visitante como cliente externo · `e290eda` alta de socio online

### 2026-11-09 · ≈ 1,5 h

**Actividad** Revisé y mergeé los PR de Benja de renovar desde Mi Pase QR (#76), reintento de pagos (#77) y seguridad del back (#79), este último después de su corrección del authId.

**Commits** Sin commits: revisión y merge de PR.

---

## Sprint 7 — Cierre — Semana del 2026-11-09

### 2026-11-12 · ≈ 2 h

**Actividad** Corregí el alta de socio online según la revisión de Marcos del PR #90.

**Problema o bloqueo** Había casos en los que el socio pagaba y se quedaba sin acceso: un error de base después del cobro devolvía 500 sin comprobante, el reintento fallaba siempre si la cuenta ya existía en Supabase, y dos envíos simultáneos cobraban dos veces. Ahora cualquier error tras el pago deja la cuenta pendiente con su comprobante, el reintento inicia sesión con la cuenta que ya existe, y el registro valida con bloqueo para evitar el doble cobro.

**Decisión** El reintento usa un código UUID guardado con la transacción en lugar del número de factura, que es correlativo y se podía adivinar.

**Commits** `5984c00` merge de develop · `204248b` correcciones de la revisión del alta de socio

### 2026-11-13 · ≈ 2 h

**Actividad** Reescribí mi bitácora cruzándola con los commits, los PR y Jira (PR #99, revisado y mergeado por Benja). Revisé y mergeé la bitácora de Benja (#100).

**Commits** `c737ddc` bitácora individual

### 2026-11-14 · ≈ 1,5 h

**Actividad** Hice el control de acceso sin conexión del terminal de sede (RNF-01, SCRUM-139, PR #102). El back expone la lista de socios habilitados con el aforo de la sede y un endpoint que sincroniza hasta 50 ingresos aprobados sin conexión. El front valida contra esa lista cuando el servidor no responde, guarda los ingresos en una cola y los manda al reconectar.

**Decisión** Solo una falla de red activa el modo sin conexión: si el servidor responde con un rechazo (409 o 422), el rechazo se respeta. Al sincronizar, el QR se valida contra el minuto en que se escaneó y no contra la hora del envío, y reenviar el mismo ingreso devuelve DUPLICADO en vez de contarlo dos veces.

**Problema o bloqueo** Probando con el back apagado, "Mi Pase QR" mostraba "Sin membresía" y el socio no podía generar un QR nuevo, porque las dos cosas se piden al servidor. Además, sin conexión pasaba un QR armado a mano con el id de un socio habilitado. Lo dejé como límite conocido del PR y lo resolví en el siguiente (#103).

**Commits** `352f6f0` lista de habilitados y sincronización · `4201056` validación sin conexión y cola en recepción

---

## Sprint 8 — Cierre — Semana del 2026-11-16

### 2026-11-17 · ≈ 2 h

**Actividad** Corregí lo que marcó Marcos en la revisión del PR #102 y agregué el QR firmado por el celular del socio (PR #103), para que el código también se genere sin conexión. Marcos mergeó los dos PR el 18/11.

**Problema o bloqueo** El terminal validaba con la hora corregida según el reloj del servidor, pero encolaba la hora cruda de la PC. Con la PC atrasada uno o dos minutos, el ingreso se aprobaba sin conexión y después la sincronización lo rechazaba como QR vencido. Ahora validar, encolar y contar a la gente adentro usan la misma hora. También agregué tiempos de espera al arrancar y al sincronizar, porque con el servidor colgado la app se quedaba esperando para siempre.

**Decisión** Cada socio tiene un par de claves ECDSA P-256 en su navegador: el celular firma el QR de cada minuto y el terminal lo verifica con la clave pública que viene en la lista de habilitados. Descarté los tokens HMAC precalculados porque obligaban a guardar secretos en el terminal. Con claves públicas, aunque se filtre la lista nadie puede falsificar un QR, y deja de pasar el QR armado a mano. El costo es una columna nueva (`qr_clave_publica`): en producción hay que correr `docs/sql/acceso-offline-clave-qr.sql` antes de desplegar.

**Commits** `66bbf65` hora del escaneo corregida · `043224b` QR firmado por el dispositivo

### 2026-11-18 · ≈ 1,5 h

**Actividad** A la noche, antes de la entrega, probé en el navegador los flujos de toda la aplicación con cada rol. En paralelo el equipo cargó en Jira las tarjetas de corrección SCRUM-140 a SCRUM-148, y me tocaron la SCRUM-143 y la SCRUM-144.

**Problema o bloqueo** Además de lo que ya cubrían las tarjetas, quedaron hallazgos sin tarjeta: la zona horaria del back en Render, el aviso "Error de servidor" que sale duplicado, el precio de horario pico mal mostrado en la grilla y el cliente externo, que no puede ver sus reservas porque el back solo se las devuelve al socio.

**Commits** Sin commits: pruebas manuales.

### 2026-11-19 · ≈ 2 h

**Actividad** Resolví la SCRUM-143 (PR #106): un gerente sin sede es ahora gerente central y opera en todas las sedes. Resolví la SCRUM-144 (PR #112): el personal ya no puede contratar ni renovar un plan propio. Benja revisó y mergeó los dos. Mergeé el PR #105 de Matías (SCRUM-140) y después arreglé su rama SRUM-141 (PR #111), que había quedado con marcadores de conflicto en seis archivos.

**Decisión** En la SCRUM-143, solo otro gerente central puede crear un gerente sin sede, y el recepcionista sigue necesitando una sede. En el seed, gerente@fitzone.com pasó a ser gerente central; en producción ese usuario necesita un UPDATE que le quite la sede. En la SCRUM-144 cerré la regla en el back: la renovación se rechaza si el dueño de la membresía no es SOCIO. En el front, Pagos pasó a ser exclusivo del socio y el buscador de Membresías solo selecciona socios.

**Problema o bloqueo** El CI del PR #112 falló en los tests del back. No lo pude reproducir: pasó en Windows, con la zona horaria en UTC y en un contenedor Linux con Java 21. Al relanzarlo pasó, así que fue una falla del entorno de CI y no del cambio. En la SRUM-141 tomé la versión de develop de los seis archivos y volví a aplicar los arreglos de la tarjeta: cerrar la lista de sedes al cerrar el menú móvil y vaciar las canchas de la sede anterior al cambiar de sede. De paso encontré que en Clases el spinner quedaba trabado si una recarga silenciosa pisaba a la carga inicial, y lo corregí.

**Commits** `5a172f6` gerente central sin sede · `28de8d7` personal sin plan propio · `b220c6c` conflictos de SRUM-141

### 2026-11-19 · ≈ 2 h

**Actividad** Antes del congelamiento revisé todos los PR abiertos del equipo (#107 a #113): si cumplían su tarjeta, si entraban limpios en develop y si los tests pasaban con el merge simulado. Mergeé el #107 de Benja (SCRUM-146) y el #113 de Marcos (SCRUM-148).

**Problema o bloqueo** Varios PR tocaban los mismos archivos de canchas y chocaban entre sí, así que propuse un orden de merge para resolver un conflicto a la vez. El #109 (SCRUM-147) tenía conflictos con develop y necesita correr `docs/sql/SCRUM-147-externo-sin-usuario.sql` antes de desplegar el back; Marcos los resolvió y lo mergeó a la tarde. Al #113 le faltó sacar de Pagos las reservas con la retención vencida: el socio todavía puede intentar pagarlas y el back le responde con un error.

**Commits** Sin commits: revisión y merge de PR.

### 2026-11-19 · ≈ 2 h

**Actividad** Revisé toda la entrega contra la versión nueva de los lineamientos, casilla por casilla del checklist del Anexo G, y actualicé esta bitácora (SCRUM-150).

**Problema o bloqueo** La versión nueva cambió la consigna: pide diez ADR, con uno nuevo sobre la sincronización del terminal, catorce diagramas y una carpeta de planificación con cronograma, trazabilidad, seguimiento y riesgos. Faltan la planificación, siete diagramas UML y el seed de 25 sedes. Además, el ADR-003, dos diagramas y los tres manuales todavía dicen que el acceso sin conexión no existe, cuando ya lo implementé en los PR #102 y #103. Mientras revisaba, el CI del back falló en develop después del merge del #113. En mi máquina la suite pasaba completa, también con la zona horaria en UTC como en el runner, y en el siguiente commit de develop volvió a pasar: fue una falla intermitente del CI, igual que la del #112.

**Decisión** Ordené lo que falta según las condiciones de admisibilidad del punto 6.1, para repartirlo con el equipo empezando por lo que impide que la entrega sea admitida.

**Commits** Sin commits: revisión de la entrega.
