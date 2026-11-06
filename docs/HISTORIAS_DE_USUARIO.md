# FitZone Sports — Historias de usuario para QA

Guía de pruebas por rol. Cada historia dice qué debe poder hacer el usuario, y cada casilla es una prueba a ejecutar y marcar.

## Cómo usar esta guía

- Probar sobre `develop`, con la web real: `VITE_USE_MOCK=false`.
- Usuarios, sedes, planes, canchas y clases: [DATOS_DE_PRUEBA.md](DATOS_DE_PRUEBA.md).
- Si una prueba falla, registrar el ID de la historia, los pasos, lo esperado y lo obtenido.
- Marcar con `[x]` solo lo probado de punta a punta en la web.

| Rol | Usuario de prueba | Prefijo |
| :-- | :-- | :-- |
| Socio activo | `socio@fitzone.com` | SOC |
| Socio con cuota vencida | `socio.vencido@fitzone.com` | MOR |
| Cliente externo | `externo@fitzone.com` (sin login) | EXT |
| Recepcionista | `recepcionista@fitzone.com` | REC |
| Gerente | `gerente@fitzone.com` | GER |

---

## Socio activo

### SOC-01 — Iniciar sesión

Como socio, quiero iniciar sesión para usar mis servicios.

- [ ] Con datos correctos entro y veo el menú de socio.
- [ ] Con contraseña incorrecta veo un error y no entro.
- [ ] Al cerrar sesión, una ruta protegida me lleva al login.
- [ ] No veo opciones de Usuarios, Membresías, Control Acceso ni Roles.

### SOC-02 — Ver mi perfil

Como socio, quiero ver mis datos para confirmar que están correctos.

- [ ] Veo nombre, apellido, DNI, teléfono, email y foto.
- [ ] Los datos coinciden con los cargados en el sistema.

### SOC-03 — Consultar mi membresía

Como socio, quiero ver plan, estado y vencimiento para saber si estoy al día.

- [ ] Veo plan, estado `ACTIVO`, inicio y vencimiento.
- [ ] Los días restantes coinciden con la fecha de vencimiento.

### SOC-04 — Renovar mi membresía

Como socio, quiero renovar y pagar mi plan por la pasarela para no ir a la sede.

- [ ] Puedo elegir plan Mensual, Trimestral o Anual.
- [ ] Veo el precio del plan antes de pagar.
- [ ] Con pago aprobado se extiende el vencimiento.
- [ ] Con pago rechazado la membresía no cambia.

### SOC-05 — Renovación automática

Como socio, quiero que mi plan se renueve solo para no perder beneficios.

- [ ] Puedo ver si la renovación automática está activa.
- [ ] Al vencer, la renovación simulada extiende mi membresía.

### SOC-06 — Generar QR dinámico

Como socio, quiero un QR que cambie cada minuto para ingresar a la sede.

- [ ] Veo mi QR en "Mi Pase QR".
- [ ] El código cambia cada minuto.
- [ ] Un QR vencido es rechazado en recepción.
- [ ] Un QR ya usado es rechazado en recepción.
- [ ] No puedo pedir el QR de otro socio.

### SOC-07 — Ver QR sin conexión

Como socio, quiero ver mi QR en el celular sin conexión para entrar aunque falle internet.

- [ ] La app móvil se instala desde el APK o IPA.
- [ ] Con conexión, inicio sesión y veo mi QR.
- [ ] Sin conexión, mi QR sigue visible.

### SOC-08 — Usar varias sedes

Como socio, quiero entrar a cualquier sede para usar toda la red.

- [ ] Ingreso a Sede Central con mi QR.
- [ ] Tras registrar el egreso, ingreso a Sede Norte con un QR nuevo.
- [ ] Puedo ver y reservar actividades de ambas sedes.

### SOC-09 — Ver agenda de clases

Como socio, quiero ver las clases para elegir una actividad.

- [ ] Veo tipo, instructor, sede, horario, duración y cupos.
- [ ] Al cambiar de sede cambian las clases.
- [ ] Una clase completa ofrece la lista de espera, no reservar.

### SOC-10 — Reservar una clase

Como socio, quiero reservar una clase para asegurar mi lugar.

- [ ] Con cupo y dentro de las 48 hs previas, la reserva se confirma.
- [ ] El cupo baja en uno.
- [ ] La reserva aparece en "Mis Reservas".
- [ ] Faltando más de 48 hs, veo un error y no se reserva.
- [ ] No puedo reservar dos veces la misma clase.
- [ ] Con cupo 0, veo que la clase está completa.

### SOC-11 — Cancelar una clase

Como socio, quiero cancelar hasta 2 hs antes para liberar mi lugar sin penalidad.

- [ ] Faltando más de 2 hs, cancelo sin penalidad.
- [ ] El cupo sube en uno.
- [ ] Faltando menos de 2 hs, no puedo cancelar y veo el motivo.

### SOC-12 — Anotarme en lista de espera

Como socio, quiero anotarme si la clase está llena para no perder la chance.

- [ ] Me anoto en "Yoga Integral (Completa)".
- [ ] Veo mi inscripción en la lista.
- [ ] No puedo anotarme dos veces.
- [ ] Puedo salir de la lista.

### SOC-13 — Recibir aviso de cupo

Como socio en espera, quiero que me avisen si se libera un lugar para poder reservar.

- [ ] Al cancelar otro socio, recibo la notificación.
- [ ] El aviso nombra la clase.
- [ ] Se avisa según el orden de la lista.

### SOC-14 — Ver mis reservas

Como socio, quiero ver mis reservas de clases y canchas para organizarme.

- [ ] Veo solo mis reservas.
- [ ] Están separadas en próximas e historial.
- [ ] Cada una muestra sede, fecha, horario y estado.

### SOC-15 — Ver disponibilidad de canchas

Como socio, quiero ver la grilla horaria para elegir turno.

- [ ] Veo las canchas de la sede activa.
- [ ] Puedo filtrar por tipo.
- [ ] Al elegir cancha y fecha veo turnos libres y ocupados.
- [ ] Una cancha en mantenimiento no se puede elegir.
- [ ] La grilla responde sin demora perceptible.

### SOC-16 — Ver precio con descuento

Como socio al día, quiero ver el precio final para saber cuánto pago.

- [ ] En horario estándar se aplica 15% de descuento.
- [ ] Entre las 19:00 y las 21:00 se aplica además el recargo.
- [ ] El desglose coincide con el total a pagar.
- [ ] El turno de las 21:00 no lleva recargo.

### SOC-17 — Reservar una cancha

Como socio, quiero reservar un turno para que quede bloqueado para los demás.

- [ ] Con turno libre, la reserva se confirma.
- [ ] El turno aparece ocupado para otros usuarios.
- [ ] La reserva aparece en "Mis Reservas".
- [ ] No puedo reservar un turno pasado.
- [ ] Si dos usuarios reservan a la vez, solo uno tiene éxito.
- [ ] Quien pierde ve un mensaje claro.

### SOC-18 — Pagar una reserva

Como socio, quiero pagar mi reserva con la pasarela simulada para confirmarla.

- [ ] El checkout muestra mi reserva real: cancha, horario y monto.
- [ ] Un pago aprobado confirma el cobro.
- [ ] Un pago rechazado muestra el motivo y permite reintentar.
- [ ] No puedo pagar dos veces la misma reserva.
- [ ] Nunca se guardan datos de tarjeta.

### SOC-19 — Descargar comprobante

Como socio, quiero el comprobante en PDF para tener constancia del pago.

- [ ] Tras un pago aprobado puedo descargar el PDF.
- [ ] El PDF muestra cancha, horario y monto.
- [ ] Un pago rechazado no genera comprobante.

### SOC-20 — Ver historial de pagos

Como socio, quiero ver mis pagos para controlar lo abonado.

- [ ] Veo solo mis pagos.
- [ ] Cada pago muestra fecha, concepto, monto y estado.
- [ ] No puedo ver los pagos de otro usuario.

---

## Socio con cuota vencida

### MOR-01 — Conocer mi situación

Como socio moroso, quiero saber que mi cuota venció para regularizarla.

- [ ] Inicio sesión.
- [ ] Veo estado `VENCIDO` y la fecha de vencimiento.
- [ ] Veo cómo regularizar.

### MOR-02 — Bloqueo de clases

Como socio moroso, quiero entender por qué no puedo reservar clases.

- [ ] Al reservar veo el motivo y no se crea la reserva.
- [ ] No puedo anotarme en lista de espera.
- [ ] El cupo no cambia.

### MOR-03 — Alquilar cancha a precio externo

Como socio moroso, quiero alquilar canchas pagando precio externo.

- [ ] Puedo reservar una cancha.
- [ ] No se aplica el 15% de descuento.
- [ ] Puedo pagar la reserva y recibir comprobante.

### MOR-04 — Bloqueo de ingreso

Como socio moroso, quiero saber que no puedo ingresar hasta regularizar.

- [ ] No se genera mi QR.
- [ ] Veo el motivo.

### MOR-05 — Regularizar mi membresía

Como socio moroso, quiero renovar para recuperar mis beneficios.

- [ ] Con pago aprobado, mi estado pasa a `ACTIVO`.
- [ ] Vuelvo a tener QR.
- [ ] Vuelvo a reservar clases.
- [ ] Recupero el descuento en canchas.

---

## Cliente externo

### EXT-01 — Ver canchas

Como cliente externo, quiero ver canchas y turnos para elegir dónde jugar.

- [ ] Veo canchas por sede y tipo.
- [ ] Veo turnos libres y ocupados.
- [ ] No veo funciones de socio ni de personal.

### EXT-02 — Registrarme

Como cliente externo, quiero cargar mis datos para usar la plataforma.

- [ ] Completo nombre, apellido, DNI, contacto y foto.
- [ ] Quedo registrado como `EXTERNO`, no como socio.
- [ ] Un DNI o email repetido muestra error.
- [ ] Los campos obligatorios se validan.

### EXT-03 — Ver precio

Como cliente externo, quiero ver el precio para decidir si reservo.

- [ ] En horario estándar veo el precio base.
- [ ] Entre las 19:00 y las 21:00 veo el recargo.
- [ ] Nunca se aplica descuento de socio.

### EXT-04 — Reservar cancha

Como cliente externo, quiero reservar sin membresía para jugar pagando por uso.

- [ ] Reservo un turno libre sin membresía.
- [ ] El turno queda bloqueado para los demás.
- [ ] No puedo reservar una cancha en mantenimiento.
- [ ] No puedo reservar un turno ocupado.

### EXT-05 — Pagar reserva

Como cliente externo, quiero pagar al reservar para confirmar el turno.

- [ ] Veo el resumen de cancha, horario y monto.
- [ ] Con pago aprobado se confirma el cobro.
- [ ] Con pago rechazado veo el motivo y puedo reintentar.

### EXT-06 — Recibir comprobante

Como cliente externo, quiero mi comprobante para tener constancia.

- [ ] Tras pagar puedo obtener el PDF.
- [ ] El PDF muestra cancha, horario y monto.

### EXT-07 — Límites del rol

Como cliente externo, solo debo acceder a canchas.

- [ ] No puedo reservar clases.
- [ ] No obtengo QR de acceso.
- [ ] No entro a pantallas de administración, ni escribiendo la URL.

---

## Recepcionista

### REC-01 — Iniciar sesión

Como recepcionista, quiero iniciar sesión para operar mi sede.

- [ ] Entro y veo Usuarios, Membresías, Control Acceso, Clases, Canchas y Pagos.
- [ ] No veo Roles y Accesos.
- [ ] No entro a pantallas exclusivas de gerente, ni escribiendo la URL.

### REC-02 — Buscar usuarios

Como recepcionista, quiero buscar usuarios para atenderlos rápido.

- [ ] Busco por DNI.
- [ ] Filtro por tipo de usuario.
- [ ] Puedo ver el detalle de un usuario.

### REC-03 — Alta de socios y externos

Como recepcionista, quiero registrar clientes en mostrador.

- [ ] Doy de alta un socio con DNI, contacto y foto.
- [ ] Doy de alta un cliente externo.
- [ ] Un DNI repetido muestra error.
- [ ] Puedo editar los datos de ambos.

### REC-04 — Límite sobre personal

Como recepcionista, no debo administrar personal.

- [ ] No puedo crear recepcionistas ni gerentes.
- [ ] No puedo cambiar el rol de un usuario a personal.

### REC-05 — Consultar membresías

Como recepcionista, quiero consultar membresías para informar al socio.

- [ ] Busco por DNI y veo plan, estado y vencimiento.
- [ ] Veo el catálogo de planes y sus precios.
- [ ] Veo el registro general de membresías.

### REC-06 — Renovar membresía

Como recepcionista, quiero renovar o cambiar un plan para regularizar al socio.

- [ ] Renuevo a `00000005` con Plan Trimestral y pasa a `ACTIVO`.
- [ ] El nuevo vencimiento corresponde a la duración del plan.
- [ ] El socio recupera sus beneficios.

### REC-07 — Cobrar en mostrador

Como recepcionista, quiero registrar cobros presenciales para reflejar lo pagado.

- [ ] Cobro una reserva de cancha.
- [ ] Cobro una membresía.
- [ ] El cobro aparece en el historial.
- [ ] Puedo entregar el comprobante.

### REC-08 — Validar ingreso con QR

Como recepcionista, quiero validar el QR para controlar el acceso.

- [ ] Un QR válido autoriza el ingreso y muestra la ficha del socio.
- [ ] Un QR vencido es rechazado.
- [ ] Un QR ya usado es rechazado.
- [ ] Un token inválido es rechazado.
- [ ] El aforo sube en uno tras el ingreso.

### REC-09 — Evitar doble ingreso

Como recepcionista, quiero rechazar a quien ya está adentro para evitar compartir credenciales.

- [ ] Con ingreso abierto, un QR nuevo es rechazado en la misma sede.
- [ ] Con ingreso abierto, un QR nuevo es rechazado en otra sede.
- [ ] Tras el egreso, el socio puede volver a ingresar.

### REC-10 — Registrar egreso

Como recepcionista, quiero registrar salidas para mantener el aforo real.

- [ ] Registro la salida desde la lista de personas en sede.
- [ ] El aforo baja en uno.
- [ ] No puedo registrar dos veces el mismo egreso.

### REC-11 — Ver aforo en tiempo real

Como recepcionista, quiero ver el aforo para no exceder la capacidad.

- [ ] Veo aforo actual, máximo y porcentaje.
- [ ] Al cambiar de sede cambian los valores.
- [ ] Con la sede completa, un ingreso válido es rechazado.

### REC-12 — Ver personas en sede

Como recepcionista, quiero ver quién está adentro para controlar la sede.

- [ ] Veo socio, tipo de acceso y hora de ingreso.
- [ ] Quien egresó deja de aparecer.

### REC-13 — Operar sin internet

Como recepcionista, quiero validar accesos sin internet para que los tornos sigan funcionando.

- [ ] Sin conexión principal puedo validar un QR.
- [ ] Al volver la conexión, los ingresos se sincronizan.

---

## Gerente

### GER-01 — Iniciar sesión

Como gerente, quiero iniciar sesión para administrar toda la red.

- [ ] Entro y veo todos los módulos.
- [ ] Puedo cambiar de sede.

### GER-02 — Gestionar personal

Como gerente, quiero administrar empleados para organizar las sedes.

- [ ] Doy de alta un recepcionista y le asigno sede.
- [ ] Doy de alta un gerente.
- [ ] Edito datos y rol de un usuario.
- [ ] El nuevo usuario entra con los permisos de su rol.

### GER-03 — Gestionar sedes

Como gerente, quiero crear sedes sin detener el sistema para hacer crecer la red.

- [ ] Creo una sede con nombre y aforo máximo.
- [ ] Edito una sede existente.
- [ ] La sede nueva aparece en el selector sin reiniciar.
- [ ] Un recepcionista o socio no puede crear sedes.

### GER-04 — Definir precios y planes

Como gerente, quiero definir planes y precios para ajustar la oferta.

- [ ] Creo y edito un plan.
- [ ] Cambio el precio de un plan.
- [ ] El nuevo precio se ve en el catálogo.
- [ ] Las membresías vigentes no cambian.

### GER-05 — Gestionar canchas

Como gerente, quiero cargar canchas por sede para ofrecerlas en alquiler.

- [ ] Creo una cancha con nombre, sede, tipo y costo por hora.
- [ ] Edito su costo.
- [ ] Puedo crear un tipo nuevo, como tenis, sin cambios de código.
- [ ] La cancha aparece en la grilla de su sede.

### GER-06 — Inhabilitar cancha por mantenimiento

Como gerente, quiero inhabilitar una cancha para bloquear reservas futuras.

- [ ] La cancha pasa a "En mantenimiento".
- [ ] No se aceptan reservas nuevas.
- [ ] Las reservas ya tomadas se mantienen.
- [ ] Al rehabilitarla vuelve a aceptar reservas.

### GER-07 — Gestionar clases

Como gerente, quiero crear clases para armar la agenda.

- [ ] Creo una clase con tipo, instructor, horario y capacidad.
- [ ] Edito una clase.
- [ ] Elimino una clase.
- [ ] Veo los inscriptos y la lista de espera.
- [ ] La clase aparece para los socios.

### GER-08 — Ver reportes consolidados

Como gerente, quiero reportes de todas las sedes para tomar decisiones.

- [ ] Veo datos consolidados de la red.
- [ ] Puedo ver el detalle por sede.
- [ ] Un recepcionista no accede a los reportes.

### GER-09 — Cambiar estado de membresía

Como gerente, quiero suspender o reactivar membresías para resolver casos puntuales.

- [ ] Suspendo una membresía y el socio pierde sus beneficios.
- [ ] Reactivo una membresía y los recupera.

### GER-10 — Consultar pagos

Como gerente, quiero ver los pagos para controlar la facturación.

- [ ] Veo los pagos por sede.
- [ ] Veo concepto, monto, estado y fecha.
- [ ] Puedo abrir el comprobante.

### GER-11 — Administrar roles

Como gerente, quiero ver roles y prestaciones para controlar qué hace cada perfil.

- [ ] Veo los cuatro roles del sistema.
- [ ] Los roles base no se pueden modificar.
- [ ] Puedo crear un rol personalizado.

---

## Seguridad transversal

### SEG-01 — Proteger funciones por rol

Como responsable del sistema, quiero que cada rol use solo lo suyo para proteger las operaciones.

- [ ] Sin sesión no puedo crear ni editar canchas, clases ni sedes.
- [ ] Un socio no puede crear canchas, clases, sedes ni usuarios.
- [ ] Sin sesión no puedo cambiar el mantenimiento de una cancha.
- [ ] Sin sesión no puedo ver quién está dentro de una sede.
- [ ] Nadie puede reservar a nombre de otro usuario sin permiso.

---

## Pendiente de definir

Estas reglas necesitan respuesta del equipo antes de dar el resultado por válido:

1. El externo: ¿se registra o reserva como invitado?
2. El 15%: ¿se calcula sobre la tarifa base o con recargo?
3. El recargo pico: ¿cuál es el porcentaje?
4. Los reportes: ¿qué datos debe mostrar el gerente?
5. El cobro en mostrador: ¿debe registrar el medio de pago?
6. El perfil: ¿el socio puede editarlo?
