# FitZone Sports — Backlog técnico por módulo

Lo que falta desarrollar para cumplir [HISTORIAS_DE_USUARIO.md](HISTORIAS_DE_USUARIO.md). Cada historia cubre los roles afectados y cita las historias de QA que destraba.

Relevado sobre `develop` (`e767bc0`) y la rama `SCRUM-97` (`c11b569`), el 2026-11-01. La numeración de módulos sigue a la cátedra. Las rutas de API omiten el prefijo `/api`.

## Prioridades

| Prioridad | Criterio |
| :-- | :-- |
| P0 | Corta la demo o impide probar un flujo central |
| P1 | Requisito de la cátedra que falta o está incompleto |
| P2 | Mejora, o depende de una decisión del equipo |

Orden sugerido, según la demo de la cátedra (registrar socio → pagar membresía → reservar paddle → ver QR):

1. `DEV-T-01`, `DEV-T-02`, `DEV-T-03` y `DEV-M5-01`: base y seguridad.
2. `DEV-M3-01`, `DEV-M4-01`, `DEV-M5-02` y `DEV-M2-01`: flujos del socio.
3. `DEV-M2-02`, `DEV-M1-01` y `DEV-M1-03`: alta, renovación e ingreso.
4. El resto de P1 y luego P2.

## Definición de hecho

Vale para todas las historias:

- [ ] Backend: lógica en el servicio, errores con `NegocioException`, tests en español.
- [ ] Frontend: función de servicio con rama real y rama `USE_MOCK`.
- [ ] Autorización revisada para los cinco perfiles: socio, moroso, externo, recepcionista y gerente.
- [ ] Endpoints nuevos con `@Operation` y sumados a `docs/bruno/`.
- [ ] `./mvnw test` en `fz-backend/`, y `npm test` y `npm run build` en `fz-frontend/`, pasan.
- [ ] "Prueba del desarrollador" completa en la web, con `VITE_USE_MOCK=false`, antes de abrir el PR.

## Quién prueba qué

- **Desarrollador:** ejecuta la "Prueba del desarrollador" de su historia y deja el resultado en el PR. Son el camino principal y los errores críticos.
- **QA:** ejecuta después todas las casillas de las historias citadas en **QA**, con sus variantes y regresión.
- Si una prueba del desarrollador falla, la historia no pasa a QA.
- Cada prueba indica la historia de [HISTORIAS_DE_USUARIO.md](HISTORIAS_DE_USUARIO.md) y qué casos cubrir.

---

## M1 — Usuarios y Membresías

### DEV-M1-01 — Registro público

**Como** cliente externo, **quiero** registrarme desde la web, **para** alquilar canchas.

- **Prioridad:** P1. **QA:** EXT-02. **Depende de:** decisión 1.
- [ ] Backend: crear `POST /v1/auth/registro`, público, que solo cree usuarios `EXTERNO`.
- [ ] Backend: ignorar cualquier `tipoUsuario` o `idSede` enviado en el body.
- [ ] Backend: compensar la cuenta de Supabase si falla el guardado en base.
- [ ] Frontend: ajustar `RegistroPage` al contrato real y agregar la foto.

**Listo cuando:** un visitante se registra, y un DNI o email repetido devuelve 409.

**Prueba del desarrollador:**

- [ ] EXT-02: registro exitoso queda como `EXTERNO`.
- [ ] EXT-02: DNI o email repetido muestra error.

### DEV-M1-02 — Perfil propio

**Como** usuario con sesión, **quiero** ver mi perfil, **para** confirmar mis datos.

- **Prioridad:** P1. **QA:** SOC-02. **Depende de:** decisión 6.
- [ ] Frontend: crear la ruta `/perfil`, accesible para socio, recepcionista y gerente.
- [ ] Frontend: reemplazar `/v1/auth/me` por `/v1/usuarios/me`.
- [ ] Backend: si el equipo lo aprueba, crear `PUT /v1/usuarios/me` limitado a contacto y foto.

**Listo cuando:** cada rol con sesión ve sus datos reales, y `tipoUsuario` no se puede cambiar desde el perfil.

**Prueba del desarrollador:**

- [ ] SOC-02: los datos coinciden con los del sistema.

### DEV-M1-03 — Renovación por el socio

**Como** socio activo o moroso, **quiero** renovar y pagar desde la web, **para** no depender de recepción.

- **Prioridad:** P1. **QA:** SOC-04, MOR-05. **Depende de:** DEV-M5-02.
- [ ] Backend: permitir que el socio renueve solo su membresía, usando `UsuarioActual`.
- [ ] Backend: revisar `PagoService`: hoy no renueva una membresía `ACTIVO` sin pago previo y no recibe plan.
- [ ] Backend: admitir cambio de plan en la renovación pagada.
- [ ] Frontend: crear flujo elegir plan → checkout → resultado.

**Listo cuando:** un pago aprobado extiende el vencimiento y un rechazo no cambia nada.

**Prueba del desarrollador:**

- [ ] SOC-04: pago aprobado extiende el vencimiento.
- [ ] SOC-04: pago rechazado no cambia la membresía.
- [ ] MOR-05: el moroso pasa a `ACTIVO` y vuelve a tener QR.

### DEV-M1-04 — Estado del socio moroso

**Como** socio moroso, **quiero** ver que mi cuota venció, **para** saber cómo regularizar.

- **Prioridad:** P1. **QA:** SOC-03, MOR-01, MOR-05.
- [ ] Backend: exponer al socio su última membresía, aunque no esté vigente.
- [ ] Frontend: distinguir `VENCIDO` y `SUSPENDIDO` de "sin membresía".
- [ ] Frontend: apuntar "Regularizar" a una pantalla que el socio pueda abrir.

**Listo cuando:** `00000005` ve estado `VENCIDO`, su vencimiento y un camino para renovar.

**Prueba del desarrollador:**

- [ ] SOC-03: plan, estado y fechas correctos.
- [ ] MOR-01: el moroso ve `VENCIDO` y cómo regularizar.

### DEV-M1-05 — Renovación automática simulada

**Como** socio, **quiero** activar la renovación automática, **para** no perder beneficios.

- **Prioridad:** P2. **QA:** SOC-05.
- [ ] Backend: agregar `renovacionAutomatica` a `Membresia`.
- [ ] Backend: antes de vencer, intentar cobro con `PasarelaPago` y renovar en la tarea programada.
- [ ] Backend: si el cobro falla, seguir el flujo normal a `VENCIDO`.
- [ ] Frontend: agregar el control en la vista de membresía.

**Listo cuando:** una membresía con la opción activa se renueva sin intervención.

**Prueba del desarrollador:**

- [ ] SOC-05: la renovación simulada extiende la membresía.

### DEV-M1-06 — Gestión de planes

**Como** gerente, **quiero** crear y editar planes, **para** definir precios.

- **Prioridad:** P1. **QA:** GER-04.
- [ ] Backend: crear `POST /v1/planes` y `PUT /v1/planes/{id}`, con el plan en el body y `hasRole('GERENTE')`.
- [ ] Backend: mantener `GET /v1/planes` público.
- [ ] Frontend: agregar el formulario en `MembresiasPage`, visible solo para gerente.

**Listo cuando:** el precio nuevo aparece en el catálogo y las membresías vigentes no cambian.

**Prueba del desarrollador:**

- [ ] GER-04: crear un plan y cambiar su precio.
- [ ] GER-04: las membresías vigentes no cambian.

### DEV-M1-07 — Roles persistentes

**Como** gerente, **quiero** que los roles personalizados se guarden en el sistema, **para** que apliquen de verdad.

- **Prioridad:** P2. **QA:** GER-11. **Depende de:** confirmar con el equipo si sigue en alcance.
- [ ] Backend: crear modelo y endpoints de roles y prestaciones.
- [ ] Frontend: reemplazar `localStorage` en `rolesService`.

**Listo cuando:** un rol creado sigue disponible desde otro navegador.

**Prueba del desarrollador:**

- [ ] GER-11: un rol creado persiste entre sesiones.

### DEV-M1-08 — Gestión de usuarios y membresías en la web

**Como** recepcionista o gerente, **quiero** operar usuarios y membresías desde la web, **para** atender en mostrador y administrar personal.

- **Prioridad:** P1. **QA:** REC-02, REC-03, REC-05, REC-06, GER-02, GER-09.
- [ ] Frontend: conectar y comprobar alta y edición en `UsuariosPage`.
- [ ] Frontend: conectar y comprobar renovación y cambio de estado en `MembresiasPage`.
- [ ] Frontend: ofrecer roles de personal solo al gerente.

**Listo cuando:** cada operación persiste y respeta los límites del rol.

**Prueba del desarrollador:**

- [ ] REC-02: buscar por DNI y filtrar por tipo.
- [ ] REC-03: alta de socio y externo; DNI repetido da error.
- [ ] REC-05: consultar `00000005` por DNI.
- [ ] REC-06: renovar a `00000005` y verificar `ACTIVO`.
- [ ] GER-02: alta de recepcionista que luego entra con su rol.
- [ ] GER-09: suspender y reactivar una membresía.

---

## M2 — Gimnasio y Acceso

### DEV-M2-01 — QR del socio en la web

**Como** socio activo, **quiero** ver mi QR dinámico, **para** ingresar a la sede.

- **Prioridad:** P0. **QA:** SOC-06, MOR-04.
- [ ] Frontend: reemplazar `/v1/accesos/qr/{id}` por `/v1/usuarios/{id}/qr`, con el id de la sesión.
- [ ] Frontend: usar `tokenQr` y renovar el código cada minuto.
- [ ] Frontend: mostrar `MEMBRESIA_INACTIVA` con su mensaje.

**Listo cuando:** el socio ve su QR, y el moroso ve el bloqueo.

**Prueba del desarrollador:**

- [ ] SOC-06: el QR se ve y cambia cada minuto.
- [ ] MOR-04: el moroso no obtiene QR.

### DEV-M2-02 — Validación de ingreso en recepción

**Como** recepcionista o gerente, **quiero** validar un QR real, **para** registrar el ingreso.

- **Prioridad:** P0. **QA:** REC-08, REC-09, REC-11.
- [ ] Frontend: reemplazar `/v1/accesos/validar` por `POST /v1/accesos/ingreso`, con `tokenQr` e `idSede`.
- [ ] Frontend: mapear `QR_VENCIDO`, `MEMBRESIA_INACTIVA`, `YA_INGRESADO` y `AFORO_COMPLETO`.
- [ ] Frontend: quitar "Casos de prueba con 1 clic" del modo real.
- [ ] Backend: probar RN-01 con un QR nuevo en la misma sede y en otra.

**Listo cuando:** cada resultado muestra su mensaje y el aforo se actualiza.

**Prueba del desarrollador:**

- [ ] REC-08: QR válido, vencido, usado e inválido.
- [ ] REC-09: doble ingreso rechazado en ambas sedes.
- [ ] REC-11: sede completa rechaza el ingreso.

### DEV-M2-03 — Personas en sede y egreso

**Como** recepcionista o gerente, **quiero** registrar egresos, **para** mantener el aforo real.

- **Prioridad:** P1. **QA:** REC-10, REC-12.
- [ ] Frontend: quitar `/v1/accesos?idSede=` y usar `/v1/sedes/{id}/accesos/activos`.
- [ ] Frontend: conectar el egreso con datos reales y refrescar el aforo.

**Listo cuando:** un ingreso real aparece en la lista, y al egresar sale y baja el aforo.

**Prueba del desarrollador:**

- [ ] REC-10: egreso baja el aforo.
- [ ] REC-12: quien egresó deja de aparecer.

### DEV-M2-04 — Acceso multisede

**Como** socio, **quiero** entrar a cualquier sede, **para** usar toda la red.

- **Prioridad:** P1. **QA:** SOC-08.
- [ ] Frontend: corregir el texto "válido exclusivamente para la sede activa".
- [ ] Backend: agregar test de ingreso en una sede distinta a la de origen.

**Listo cuando:** un socio entra a Central y, tras egresar, a Norte.

**Prueba del desarrollador:**

- [ ] SOC-08: ingreso a Central, egreso e ingreso a Norte.

### DEV-M2-05 — App móvil con QR offline

**Como** socio, **quiero** una app con mi QR disponible sin conexión, **para** entrar aunque falle internet.

- **Prioridad:** P1 (Unidad VI, 10%). **QA:** SOC-07.
- [ ] Crear la app (React Native o Flutter) con login y vista de QR.
- [ ] Definir cómo validar un QR generado sin conexión: hoy el token lo emite el backend.
- [ ] Guardar lo necesario en almacenamiento seguro del dispositivo.
- [ ] Generar APK o IPA instalable.

**Listo cuando:** en modo avión el socio ve un QR que recepción puede validar.

**Prueba del desarrollador:**

- [ ] SOC-07: instalar la app y ver el QR sin conexión.

### DEV-M2-06 — Validación offline en recepción

**Como** recepcionista, **quiero** validar accesos sin internet, **para** que los tornos sigan funcionando.

- **Prioridad:** P2 (RNF-01). **QA:** REC-13. **Depende de:** DEV-M2-05.
- [ ] Definir el alcance mínimo para el MVP.
- [ ] Guardar datos de socios y validaciones en el puesto.
- [ ] Sincronizar ingresos al volver la conexión, resolviendo conflictos con RN-01.

**Listo cuando:** un ingreso offline llega al servidor al reconectar.

**Prueba del desarrollador:**

- [ ] REC-13: validar sin conexión y sincronizar al volver.

### DEV-M2-07 — Gestión de sedes

**Como** gerente, **quiero** crear y editar sedes desde la web, **para** sumar sucursales sin detener el sistema.

- **Prioridad:** P1. **QA:** GER-03.
- [ ] Frontend: crear la pantalla de sedes, visible solo para gerente.
- [ ] Frontend: refrescar el selector de sede tras guardar.
- [ ] Backend: agregar test de permisos de `POST /v1/sedes` y `PUT /v1/sedes/{id}`.

**Listo cuando:** la sede nueva se puede usar sin reiniciar.

**Prueba del desarrollador:**

- [ ] GER-03: crear y editar una sede.
- [ ] GER-03: aparece en el selector sin reiniciar.
- [ ] GER-03: recepcionista y socio no pueden crearla.

---

## M3 — Clases Grupales

### DEV-M3-01 — Integrar reservas de clases

**Como** socio activo, **quiero** reservar, cancelar y anotarme en espera, **para** usar las clases.

- **Prioridad:** P0. **QA:** SOC-10, SOC-11, SOC-12, SOC-14, MOR-02.
- [ ] Mergear `SCRUM-97`: trae `UsuarioActual`, roles y rutas `/me`, pero no toca el frontend.
- [ ] Frontend: usar `POST /v1/clases/{id}/reservas` y `POST /v1/clases/{id}/lista-espera`.
- [ ] Frontend: usar `PATCH /v1/reservas-clase/{id}/cancelar` y `DELETE /v1/lista-espera/{id}`.
- [ ] Frontend: usar `/v1/usuarios/me/reservas-clase` y `/v1/usuarios/me/lista-espera`.
- [ ] Frontend: usar `yaReservada` y `posicionEspera` de la agenda.

**Listo cuando:** todas las acciones funcionan en la web y el moroso ve el motivo del bloqueo.

**Prueba del desarrollador:**

- [ ] SOC-10: reserva, doble reserva y límite de 48 hs.
- [ ] SOC-11: cancelar antes y después del límite de 2 hs.
- [ ] SOC-12: entrar y salir de la lista de espera.
- [ ] MOR-02: bloqueo del moroso con su motivo.

### DEV-M3-02 — Tipo e instructor

**Como** gerente, **quiero** cargar tipo e instructor, **para** publicar la clase completa.

- **Prioridad:** P1. **QA:** GER-07, SOC-09.
- [ ] Backend: agregar `instructor` y `tipo` a `ClaseGrupal`, como datos de la clase.
- [ ] Backend: no crear rol ni usuario `INSTRUCTOR`.
- [ ] Frontend: agregarlos a tipos, formulario y tarjeta.
- [ ] Base: definir cómo llegan las columnas nuevas a bases existentes.

**Listo cuando:** el gerente carga ambos campos y el socio los ve.

**Prueba del desarrollador:**

- [ ] GER-07: crear clase con tipo e instructor.
- [ ] SOC-09: el socio ve ambos datos.

### DEV-M3-03 — Agenda administrativa

**Como** gerente, **quiero** administrar clases y ver inscriptos, **para** gestionar la agenda.

- **Prioridad:** P1. **QA:** GER-07.
- [ ] Frontend: conectar alta, edición y baja en "Agenda (Admin)".
- [ ] Frontend: mostrar `GET /v1/clases/{id}/reservas` y `GET /v1/clases/{id}/lista-espera`.
- [ ] Frontend: alinear `CLASES_ADMIN`: la prestación incluye recepcionista, y `SCRUM-97` solo permite gerente.

**Listo cuando:** el menú y la API dan los mismos permisos a cada rol.

**Prueba del desarrollador:**

- [ ] GER-07: editar, eliminar y ver inscriptos y espera.

### DEV-M3-04 — Notificación de cupo liberado

**Como** socio en lista de espera, **quiero** recibir un aviso, **para** tomar el lugar.

- **Prioridad:** P1. **QA:** SOC-13.
- [ ] Backend: crear un `Notificador` real, que reemplace a `LogNotificador` fuera de tests.
- [ ] Backend: persistir el aviso si es dentro de la app.
- [ ] Frontend: mostrar las notificaciones, si se eligen dentro de la app.
- [ ] Definir el canal: dentro de la app o email.

**Listo cuando:** al cancelar una reserva, el siguiente socio de la lista recibe el aviso.

**Prueba del desarrollador:**

- [ ] SOC-13: cancelar una reserva y recibir el aviso, en orden.

---

## M4 — Canchas Deportivas

### DEV-M4-01 — Reservar desde la web

**Como** socio, moroso o externo, **quiero** reservar un turno, **para** usar la cancha.

- **Prioridad:** P0. **QA:** SOC-17, MOR-03, EXT-04.
- [ ] Frontend: reemplazar `/v1/canchas/reservas` por `POST /v1/canchas/{id}/reservas`.
- [ ] Frontend: usar `idUsuario`, `inicio` y `fin` en `/cotizacion`, sin el parámetro `esSocio`.
- [ ] Frontend: mostrar el error de turno tomado y refrescar la grilla.
- [ ] Backend: agregar test de concurrencia de RN-02.

**Listo cuando:** dos reservas simultáneas dejan un solo ganador y el precio sale del servidor.

**Prueba del desarrollador:**

- [ ] SOC-17: reservar y ver el turno ocupado con otro usuario.
- [ ] MOR-03: reservar sin descuento.
- [ ] EXT-04: no reservar cancha en mantenimiento.

### DEV-M4-02 — Mis reservas de canchas

**Como** socio o moroso, **quiero** ver mis reservas, **para** organizarme.

- **Prioridad:** P0. **QA:** SOC-14.
- [ ] Frontend: reemplazar `/v1/canchas/reservas/usuario/{id}` por `/v1/usuarios/{id}/reservas-cancha`.
- [ ] Frontend: tomar el id de la sesión: hoy se envía `1`.
- [ ] Frontend: quitar o resolver la cancelación, que llama a una ruta inexistente y no figura en la especificación.

**Listo cuando:** cada usuario ve solo sus reservas.

**Prueba del desarrollador:**

- [ ] SOC-14: ver solo las reservas propias, con dos usuarios.

### DEV-M4-03 — Reserva del cliente externo

**Como** cliente externo, **quiero** reservar con mis datos, **para** alquilar sin membresía.

- **Prioridad:** P1. **QA:** EXT-03, EXT-04, EXT-05, EXT-06. **Depende de:** decisión 1.
- [ ] Backend: dejar de exigir un `idUsuario` existente, según la decisión.
- [ ] Backend: si es invitado, crear `POST /v1/canchas/reservas/externo` como indica la guía.
- [ ] Frontend: pedir los datos antes del pago y mostrar el precio externo.

**Listo cuando:** un externo sin membresía reserva, paga y obtiene comprobante.

**Prueba del desarrollador:**

- [ ] EXT-04: reservar sin membresía.
- [ ] EXT-05: pagar y confirmar.
- [ ] EXT-06: obtener el comprobante.

### DEV-M4-04 — Regla de precio única

**Como** socio o externo, **quiero** que el precio mostrado sea el cobrado, **para** confiar en el total.

- **Prioridad:** P1. **QA:** SOC-16, EXT-03. **Depende de:** decisiones 2 y 3.
- [ ] Backend: ajustar `CalculadorPrecioCancha`: hoy resulta $21.000 en pico para $20.000 de base.
- [ ] Frontend: quitar los cálculos locales y mostrar `CotizacionDTO`.
- [ ] Frontend: corregir el texto del checkout sobre el 15%, si no coincide con la regla.

**Listo cuando:** grilla, resumen, reserva y comprobante muestran el mismo monto.

**Prueba del desarrollador:**

- [ ] SOC-16: precio estándar, pico y turno de las 21:00.
- [ ] EXT-03: precio sin descuento.

### DEV-M4-05 — Gestión de canchas

**Como** gerente, **quiero** administrar canchas y mantenimiento, **para** controlar la oferta.

- **Prioridad:** P1. **QA:** GER-05, GER-06.
- [ ] Frontend: conectar alta, edición y mantenimiento en "Gestión de Canchas".
- [ ] Frontend: generar los filtros desde los tipos existentes, no de una lista fija.
- [ ] Backend: probar que el mantenimiento conserva reservas tomadas.

**Listo cuando:** un tipo nuevo aparece sin cambios de código, y las reservas previas se mantienen.

**Prueba del desarrollador:**

- [ ] GER-05: crear cancha con tipo nuevo.
- [ ] GER-06: mantenimiento conserva reservas y bloquea nuevas.

### DEV-M4-06 — Índices de disponibilidad

**Como** usuario que consulta turnos, **quiero** una grilla rápida, **para** reservar sin esperas.

- **Prioridad:** P1 (RNF-03). **QA:** SOC-15.
- [ ] Backend: agregar `@Index` por cancha y fecha en `ReservaCancha`.
- [ ] Backend: agregar `@Index` por sede y tipo en `Cancha`.
- [ ] Base: verificar la consulta con `EXPLAIN`.

**Listo cuando:** la consulta usa los índices.

**Prueba del desarrollador:**

- [ ] SOC-15: grilla con filtros y respuesta rápida.

---

## M5 — Pagos y Facturación

### DEV-M5-01 — Corregir restricción de pagos

**Como** cualquier usuario que paga, **quiero** que el pago se guarde, **para** completar mi operación.

- **Prioridad:** P0. **QA:** SOC-18, EXT-05, REC-07.
- [ ] Base: reemplazar `fz_pag_transacciones_concepto_check` en bases existentes.
- [ ] Base: documentar el paso, porque `ddl-auto=update` no actualiza ese `CHECK`.
- [ ] Backend: alinear `MEMBRESIA` y `RESERVA_CANCHA` con `TipoOrigenTransaccion`.

**Listo cuando:** un pago de membresía y uno de cancha se guardan en una base ya existente.

**Prueba del desarrollador:**

- [ ] SOC-18: pagar una cancha en una base existente.
- [ ] SOC-04: pagar una membresía en una base existente.

### DEV-M5-02 — Checkout real

**Como** socio, moroso o externo, **quiero** pagar mi reserva o membresía real, **para** confirmar la operación.

- **Prioridad:** P0. **QA:** SOC-18, MOR-03, EXT-05. **Depende de:** DEV-M5-01.
- [ ] Frontend: quitar los ítems fijos de `PagosPage`.
- [ ] Frontend: cargar el ítem desde la reserva o la membresía.
- [ ] Frontend: reemplazar `/v1/pagos/checkout` por `POST /v1/pagos`.
- [ ] Frontend: reintentar con `POST /v1/pagos`, ya que `/reintentar` no existe.
- [ ] Backend: tomar monto y usuario del servidor, no del cliente.

**Listo cuando:** se cobra el monto real, y un rechazo permite reintentar.

**Prueba del desarrollador:**

- [ ] SOC-18: pago aprobado, rechazado, reintento y pago doble.
- [ ] MOR-03: pagar reserva sin descuento.

### DEV-M5-03 — Historial de pagos

**Como** socio o moroso, **quiero** ver mis pagos, **para** controlarlos. **Como** gerente o recepcionista, **quiero** ver los pagos de la sede, **para** controlar la facturación.

- **Prioridad:** P1. **QA:** SOC-20, GER-10.
- [ ] Backend: crear `GET /v1/pagos?idSede=` para gerente y recepcionista.
- [ ] Frontend: el socio usa `/v1/usuarios/{id}/pagos`.
- [ ] Frontend: el personal usa la ruta nueva.

**Listo cuando:** `GET /v1/pagos` deja de dar 405 y cada rol ve solo lo suyo.

**Prueba del desarrollador:**

- [ ] SOC-20: ver solo los pagos propios.
- [ ] GER-10: ver pagos por sede.

### DEV-M5-04 — Comprobante en la web

**Como** usuario que pagó, **quiero** descargar el PDF, **para** tener constancia.

- **Prioridad:** P1. **QA:** SOC-19, EXT-06.
- [ ] Frontend: reemplazar `/v1/comprobantes/transaccion/{id}` por `/v1/pagos/{id}/comprobante`.
- [ ] Frontend: descargar con `/v1/comprobantes/{id}/pdf`.
- [ ] Frontend: quitar "facturas AFIP" si no se emite ese documento.
- [ ] Backend: verificar que el PDF tenga cancha, horario y monto.
- [ ] Backend: definir cómo accede al comprobante un externo sin sesión.

**Listo cuando:** solo el dueño o el personal obtienen el PDF.

**Prueba del desarrollador:**

- [ ] SOC-19: PDF con cancha, horario y monto.
- [ ] SOC-19: un pago rechazado no genera comprobante.

### DEV-M5-05 — Cobro en mostrador

**Como** recepcionista, **quiero** registrar cobros presenciales, **para** reflejar lo pagado.

- **Prioridad:** P1. **QA:** REC-07. **Depende de:** decisión 5 y DEV-M5-02.
- [ ] Backend: agregar el medio de pago, si se aprueba.
- [ ] Backend: permitir al personal cobrar para otro usuario.
- [ ] Frontend: buscar socio, elegir concepto y registrar el cobro.

**Listo cuando:** el cobro aparece en el historial con comprobante.

**Prueba del desarrollador:**

- [ ] REC-07: cobrar reserva y membresía; ver historial y comprobante.

### DEV-M5-06 — Reportes consolidados

**Como** gerente, **quiero** reportes de toda la red, **para** tomar decisiones.

- **Prioridad:** P1. **QA:** GER-08. **Depende de:** decisión 4.
- [ ] Backend: crear endpoints de lectura con `hasRole('GERENTE')`.
- [ ] Backend: consolidar datos por sede y por red.
- [ ] Frontend: crear la pantalla, visible solo para gerente.

**Listo cuando:** los totales coinciden con los datos de cada sede.

**Prueba del desarrollador:**

- [ ] GER-08: totales por sede y red; recepcionista sin acceso.

---

## Transversal

### DEV-T-01 — Autorización de endpoints

**Como** responsable del sistema, **quiero** proteger cada operación por rol, **para** que nadie actúe fuera de su permiso.

- **Prioridad:** P0. **QA:** SEG-01, REC-01, REC-04, EXT-07.
- [ ] Backend: exigir `GERENTE` para crear y editar canchas y cambiar mantenimiento.
- [ ] Backend: exigir `RECEPCIONISTA` o `GERENTE` para accesos, aforo detallado e ingreso.
- [ ] Backend: proteger `/v1/pagos/**` y `/v1/comprobantes/**`.
- [ ] Backend: mantener públicas solo las lecturas de canchas y la cotización.
- [ ] Backend: revisar `/v1/prueba/**` y agregar tests de seguridad.

| Operación | Sin sesión | Socio | Recepcionista | Gerente |
| :-- | :-- | :-- | :-- | :-- |
| Ver canchas y turnos | Sí | Sí | Sí | Sí |
| Administrar canchas | No | No | No | Sí |
| Validar accesos | No | No | Sí | Sí |
| Ver aforo y personas | No | No | Sí | Sí |
| Crear sedes y planes | No | No | No | Sí |
| Ver pagos ajenos | No | No | De su sede | Sí |

**Listo cuando:** los tests prueban cada fila de la tabla.

**Prueba del desarrollador:**

- [ ] SEG-01: los cinco casos, sin sesión y como socio.
- [ ] REC-01: recepcionista sin pantallas de gerente.
- [ ] REC-04: recepcionista no crea personal.
- [ ] EXT-07: externo sin clases, QR ni administración.

### DEV-T-02 — Usuario autenticado en todos los módulos

**Como** usuario con sesión, **quiero** operar siempre como yo mismo, **para** que nadie use mi identidad.

- **Prioridad:** P0. **QA:** SEG-01, SOC-14, SOC-20. **Depende de:** `SCRUM-97`.
- [ ] Backend: usar `UsuarioActual` en reservas de canchas y pagos.
- [ ] Backend: quitar `idUsuario` del body cuando actúa el propio usuario.
- [ ] Backend: limitar al recepcionista a su sede.
- [ ] Frontend: quitar ids fijos y dejar de enviar la identidad.

**Listo cuando:** cambiar el id en una petición no permite operar por otro usuario.

**Prueba del desarrollador:**

- [ ] SEG-01: no se puede reservar a nombre de otro usuario.
- [ ] SOC-14: un usuario no ve reservas ajenas.
- [ ] SOC-20: un usuario no ve pagos ajenos.

### DEV-T-03 — Datos de prueba consistentes

**Como** QA, **quiero** datos iguales a la documentación, **para** ejecutar la guía sin ajustes.

- **Prioridad:** P0. **QA:** SOC-01, EXT-01, GER-01, y sirve de base para todas.
- [ ] Crear `socio.vencido@fitzone.com` en Supabase Auth.
- [ ] Agregar una cancha de paddle operativa, que pide la demo.
- [ ] Alinear IDs y el nombre "Plan Anual" entre `DataInitializer`, `01-init-data.sql` y `DATOS_DE_PRUEBA.md`.
- [ ] Hacer que las clases semilla sigan siendo futuras al reiniciar.
- [ ] Documentar el uso de otro puerto si Windows reserva el 8080.

**Listo cuando:** una base nueva coincide con el documento y los cinco usuarios sirven.

**Prueba del desarrollador:**

- [ ] SOC-01: entrar y salir con los cuatro usuarios con login.
- [ ] EXT-01: ver canchas sin sesión.
- [ ] GER-01: el gerente ve todos los módulos.

### DEV-T-04 — Separar las pantallas de prueba

**Como** usuario, **quiero** ver solo lo de mi rol, **para** no confundirme.

- **Prioridad:** P2. **QA:** SOC-01, REC-01, GER-01.
- [ ] Frontend: quitar del menú los enlaces `/rol/*` de otros roles.
- [ ] Frontend: reemplazar las pantallas `/rol/*` por el inicio real de cada rol.
- [ ] Frontend: mostrar el acceso rápido del login solo en desarrollo.

**Listo cuando:** cada rol entra a su pantalla de inicio.

**Prueba del desarrollador:**

- [ ] SOC-01: el socio solo ve su menú.
- [ ] REC-01: la recepcionista solo ve su menú.
- [ ] GER-01: el gerente solo entra a pantallas válidas.

### DEV-T-05 — Integración y entrega continua

**Como** equipo, **quiero** un pipeline con cobertura, **para** detectar fallas antes de mergear.

- **Prioridad:** P1 (Unidad V, 15%).
- [ ] Crear el pipeline con tests y build de ambos proyectos.
- [ ] Publicar el reporte de cobertura.
- [ ] Crear el `Dockerfile` del frontend.
- [ ] Corregir los 4 tests con fecha fija `2026-10-25`.

**Listo cuando:** cada PR hacia `develop` corre el pipeline completo.

**Prueba del desarrollador:**

- [ ] Abrir un PR de prueba y ver tests, build y cobertura en el pipeline.

---

## Decisiones pendientes

| N.º | Decisión | Bloquea |
| :-- | :-- | :-- |
| 1 | ¿El externo se registra o reserva como invitado? | DEV-M1-01, DEV-M4-03 |
| 2 | ¿El 15% va sobre tarifa base o con recargo? | DEV-M4-04 |
| 3 | ¿Cuál es el recargo pico? El código usa 20% | DEV-M4-04 |
| 4 | ¿Qué reportes necesita el gerente? | DEV-M5-06 |
| 5 | ¿El cobro en mostrador registra medio de pago? | DEV-M5-05 |
| 6 | ¿El socio puede editar su perfil? | DEV-M1-02 |

Fuera de este backlog: diagramas C4, ADR y `LOG.md`. Son entregables de documentación, no desarrollo.
