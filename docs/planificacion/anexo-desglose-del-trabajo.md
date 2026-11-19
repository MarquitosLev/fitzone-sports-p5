# Anexo — Estructura de desglose del trabajo, tarjeta por tarjeta

> Fuente: exportación completa del tablero de Jira al 2026-11-19 (122 tarjetas: 7 épicas, 88 historias y 27 tareas). El detalle de cada tarjeta está en [tablero/tablero-jira.csv](tablero/tablero-jira.csv).

El trabajo se descompone en tres niveles: **épica** (un módulo funcional o un frente transversal), **historia** (algo que un rol del sistema puede hacer, con su criterio de aceptación) y **tarea** (trabajo técnico sin valor directo para el usuario, como documentación, entornos o capacitación). Las subtareas técnicas de cada historia están escritas dentro de su descripción en Jira, en las secciones *Endpoint*, *Reglas de negocio* y *Depende de*.

## Cómo se estimó

Jira no tiene registrados story points ni estimaciones de tiempo: el equipo planificó cada sprint por cantidad de tarjetas y por módulo, sin estimar. Para poder medir velocidad y desvío, al cierre se asignaron **puntos relativos** (escala 1, 2, 3, 5 y 8) con esta regla, aplicada igual a todas las tarjetas:

| Puntos | Qué tarjetas |
|---:|---|
| 1 | Modelo de una entidad JPA, actualización de una bitácora |
| 2 | Documentación, diseño, entornos, capacitación y correcciones puntuales de un defecto |
| 3 | Una pantalla o grupo de pantallas del frontend, base de la API, datos de prueba |
| 5 | Endpoints de un módulo del backend, integración de un módulo de punta a punta, patrones Strategy y Observer, autenticación, CI/CD, pruebas de punta a punta |
| 8 | Funcionalidades que cruzan módulos: reserva de invitado (SCRUM-134), alta de socio online (SCRUM-135) y acceso sin conexión (SCRUM-139) |

Estos puntos **no son una estimación previa**: son una medida de tamaño asignada al cierre para comparar sprints entre sí. La falta de estimación durante el cuatrimestre es uno de los desvíos analizados en la sección 8 del [plan de proyecto](plan-de-proyecto.md).

## Resumen por épica

| Épica | Requisitos | Historias | Tareas | Puntos |
|---|---|---:|---:|---:|
| SCRUM-22 Arquitectura y Configuración Base | — | 23 | 15 | 103 |
| SCRUM-17 M1 -  Usuarios y Membresías | RF-01 RF-02 RF-03 | 16 | 1 | 52 |
| SCRUM-18 M2 - Gimnasio y Acceso | RF-04 RF-05 | 10 | 0 | 38 |
| SCRUM-19 M3 - Clases Grupales | RF-06 RF-07 RF-08 | 13 | 0 | 40 |
| SCRUM-20 M4 - Canchas Deportivas | RF-09 RF-10 RF-11 RF-12 | 15 | 2 | 61 |
| SCRUM-21 M5 - Pagos y Facturación | RF-13 RF-14 | 11 | 0 | 33 |
| SCRUM-56 Capacitaciones | — | 0 | 2 | 4 |
| — Sin épica (documentación de cierre) | — | 0 | 7 | 9 |
| **Total** | | **88** | **27** | **340** |

## Detalle por épica

El criterio de aceptación es el texto **Hecho cuando** de cada tarjeta, copiado de Jira; las tarjetas que no lo tienen muestran «—». El sprint indica en qué sprint de Jira se trabajó; *Backlog* son tarjetas que nunca entraron a un sprint.

### SCRUM-22 — Arquitectura y Configuración Base

| Tarjeta | Tipo | Trabajo | Responsable | Sprint | Puntos | Estado | Criterio de aceptación (de Jira) |
|---|---|---|---|---|---:|---|---|
| SCRUM-11 | Tarea | Diagramas C4  | Sin asignar | S0 | 2 | Finalizado | — |
| SCRUM-15 | Tarea | Init Frontend | Chang | S1 | 2 | Finalizado | — |
| SCRUM-16 | Tarea | Init Backend | Aquino | S1 | 2 | Finalizado | — |
| SCRUM-23 | Tarea | Redactar Documento ADR | Sin asignar | S1 | 2 | Finalizado | — |
| SCRUM-24 | Tarea | Diseñar DER | Pérez | S1 | 2 | Finalizado | — |
| SCRUM-25 | Tarea | Diseñar UML | Bravo | S1 | 2 | Finalizado | — |
| SCRUM-26 | Tarea | Inicialización de repositorios y entornos base (Supabase, Vercel, Render) | Leiva | S1 | 2 | Finalizado | — |
| SCRUM-42 | Historia | Backend - Clase base de entidad y tipos ENUM nativos | Aquino | S2 | 1 | Finalizado | * Los seis tipos ENUM existen en la base que levanta el docker compose. * Una entidad de prueba persiste y recupera un valor de enum sin error de tipo. * La convención queda escrita en el README del backend. |
| SCRUM-53 | Tarea | Crear docker de desarrollo | Leiva | S1 | 2 | Finalizado | — |
| SCRUM-54 | Tarea | Documentación para agentes | Leiva | S1 | 2 | Finalizado | — |
| SCRUM-55 | Historia | Frontend - Prototipado de la aplicación | Coppes | S2 | 3 | Finalizado | — |
| SCRUM-63 | Historia | Backend - Base de la API: formato de error, validación y documentación | Bravo | S3 | 3 | Finalizado | * Un endpoint de prueba devuelve 400, 404, 409 y 422 con el formato común. * Swagger levanta y muestra los endpoints. * La convención queda escrita en el README del backend. |
| SCRUM-64 | Historia | Frontend - Librería de componentes base reutilizables | Chang | S3 | 3 | Finalizado | * Todos los componentes están en el Playground (SCRUM-60) con sus variantes. * Se ven igual que en el prototipo. |
| SCRUM-69 | Historia | Frontend - Layout, navegación y capa de servicios | Pérez | S3 | 3 | Finalizado | * Se navega por todas las rutas con el layout. * Un servicio de ejemplo funciona con mock y con la API real cambiando solo el flag. |
| SCRUM-87 | Historia | Frontend- Prototipo Interactuable en docs | Coppes | S3 | 2 | Finalizado | — |
| SCRUM-90 | Tarea | Frontend - Pantallas base (placeholders) por rol para integración de autenticación y ruteo | Coppes | S4 | 5 | Finalizado | — |
| SCRUM-91 | Historia | Backend - Autenticación con JWT y permisos por rol en la API | Leiva | S4 | 5 | Finalizado | * Un endpoint de cada módulo responde 401 sin token y 403 con un rol sin permiso. * La matriz queda escrita en el README del backend. * Swagger permite cargar el token y probar con los usuarios de prueba. |
| SCRUM-92 | Historia | Frontend - Sesión, rutas protegidas y navegación por rol | Coppes | S4 | 5 | Finalizado | * Con los cuatro usuarios de prueba, cada uno ve solo sus módulos. * Entrar por URL a una ruta de otro rol redirige a su inicio. * Una sesión vencida vuelve al login. * `RutaProtegida` está en el Playground. |
| SCRUM-93 | Historia | Backend - Relaciones entre entidades y restricciones en la base | Leiva | S4 | 3 | Finalizado | las FK y los CHECK existen en la base que levanta el docker compose, la app arranca sin errores de mapeo y el DER está actualizado. |
| SCRUM-94 | Historia | Backend - Datos de prueba para la integración | Bravo | S4 | 3 | Finalizado | levantar el docker compose deja la base con estos datos y cualquiera del equipo puede iniciar sesión con los cuatro roles. |
| SCRUM-105 | Historia | Pruebas de punta a punta de los flujos principales | Leiva | S4 | 5 | Finalizado | los cinco flujos pasan sin errores y el resultado de cada uno queda registrado en un comentario de esta tarjeta. |
| SCRUM-106 | Historia | Frontend - Saneamiento de vistas, protección de menús por rol y guardado de estado base pre-integración | Bravo | S4 | 5 | Finalizado | — |
| SCRUM-107 | Historia | Frontend - Panel exclusivo de Gerencia para control y creación de niveles de acceso dinámicos (RBAC por prestaciones) | Bravo | S4 | 3 | Finalizado | — |
| SCRUM-111 | Historia | Pipeline CI/CD y reporte de cobertura | Leiva | S5 | 5 | Finalizado | — |
| SCRUM-112 | Tarea | Frontend - Crear Dockerfile | Leiva | S6 | 3 | Finalizado | — |
| SCRUM-116 | Tarea | Documentación de entrega: LOG.md, C4 y ADR en el repositorio | Leiva | Backlog | 2 | Por hacer | — |
| SCRUM-117 | Tarea | Frontend - Quitar mocks, simuladores y datos de prueba de la interfaz | Leiva | S4 | 3 | Finalizado | con `VITE_USE_MOCK=false` no aparece en pantalla ningún dato, botón o texto de prueba, los tests y el build pasan, y los huecos encontrados quedan listados para cargar como historias. |
| SCRUM-128 | Historia | Navegación: el aviso "Sin permiso" aparece duplicado | Aquino | S5 | 2 | Finalizado | el aviso salga una sola vez por intento. |
| SCRUM-129 | Historia | Textos: códigos de requisitos y textos de demo que quedan en la interfaz | Pérez | S5 | 2 | Finalizado | no quede ningún código de requisito ni texto de demo visible, y los plurales estén bien. |
| SCRUM-130 | Historia | Datos de prueba: los usuarios del seed no pueden iniciar sesión sin ajustar el auth_id | Pérez | S5 | 2 | Finalizado | * El seed tome el `auth_id` real: buscándolo por email en la API de administración de Supabase, o vinculando por email en el primer login. * `DATOS_DE_PRUEBA.md` explique cómo quedan sincronizados. |
| SCRUM-131 | Historia | Backend: 400 en vez de 403 por validar antes del rol, y el ingreso devuelve el Usuario completo | Aquino | S5 | 2 | Finalizado | un rol sin permiso reciba 403 sin importar el body, y la respuesta del ingreso no incluya `authId`. |
| SCRUM-132 | Historia | Layout: menú lateral fijo, scroll solo en el contenido y revisión responsive | Aquino | S5 | 2 | Finalizado | * En escritorio, al scrollear cualquier pantalla larga, el menú y el header no se mueven. * En 375 px y 768 px no hay scroll horizontal en Canchas, Clases, Pagos, Acceso, Membresías y Mi Pase QR. * `npm test` y `npm… |
| SCRUM-133 | Tarea | Backend - Migraciones de base automáticas con Flyway | Leiva | Backlog | 2 | Por hacer | * Con la base local vacía, `./mvnw spring-boot:run` crea todo el esquema y la app arranca con `validate`. * Al volver a levantar, Flyway no hace nada: no hay migraciones nuevas. * En Render, contra la base vacía de… |
| SCRUM-136 | Historia | Frontend - Sesión independiente por pestaña: iniciar sesión con otro rol pisa la sesión abierta | Leiva | S5 | 3 | Finalizado | — |
| SCRUM-138 | Tarea | Documentación - Bitácoras, ADR, diagramas y manuales de la entrega | Leiva | S5 | 2 | Finalizado | — |
| SCRUM-140 | Historia | Navegación: la lista de sedes del selector no se puede scrollear | Coppes | S6 | 2 | Finalizado | se pueda llegar a todas las sedes de la lista, tanto en escritorio como en mobile. |
| SCRUM-141 | Historia | Navegación: en mobile no se puede cambiar de sede | Coppes | S6 | 2 | Finalizado | desde el celular se pueda elegir la sede activa, por ejemplo con el selector dentro del menú lateral. |
| SCRUM-145 | Historia | Navegación: al gerente le aparecen opciones de socio (reservar, mis reservas) | Chang | S6 | 2 | Finalizado | el gerente vea solo las opciones de gestión, como ABM, agenda, mantenimiento y reportes, sin las de reserva propia. |

### SCRUM-17 — M1 -  Usuarios y Membresías

| Tarjeta | Tipo | Trabajo | Responsable | Sprint | Puntos | Estado | Criterio de aceptación (de Jira) |
|---|---|---|---|---|---:|---|---|
| SCRUM-28 | Historia | Backend - Modelo Plan | Leiva | S2 | 1 | Finalizado | la entidad mapea la tabla, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-29 | Historia | Backend - Modelo Usuario y Relación con Supabase Auth | Leiva | S2 | 1 | Finalizado | la entidad mapea la tabla con su enum, la tabla existe en la base con el único sobre dni, y la app arranca sin errores de mapeo. |
| SCRUM-32 | Historia | Backend - Modelo Membresia | Leiva | S2 | 1 | Finalizado | la entidad mapea la tabla con su enum, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-65 | Historia | Backend - Endpoints de registro y perfil de usuarios | Leiva | S3 | 5 | Finalizado | los cuatro endpoints funcionan, cada regla devuelve su código con el formato común de error, y están documentados en Swagger. |
| SCRUM-70 | Historia | Backend - Endpoints de planes y membresías | Aquino | S3 | 5 | Finalizado | los cinco endpoints y la tarea programada funcionan, cada regla devuelve su código con el formato común de error, y están documentados en Swagger. |
| SCRUM-78 | Historia | Frontend - Pantallas de usuarios y perfil | Coppes | S3 | 3 | Finalizado | * Las pantallas se ven como en el prototipo y funcionan con los datos mock del servicio del módulo. * Los componentes nuevos están en el Playground (SCRUM-60). * Los errores de negocio (ej. DNI repetido) se muestran… |
| SCRUM-81 | Historia | Frontend - Pantallas de planes y membresía | Coppes | S3 | 3 | Finalizado | * Las pantallas se ven como en el prototipo y funcionan con los datos mock del servicio del módulo. * Los componentes nuevos están en el Playground (SCRUM-60). * Los errores de negocio (ej. socio con membresía… |
| SCRUM-88 | Historia | Backend - 2 - Endpoints de registro y perfil de usuarios | Leiva | S3 | 2 | Finalizado | — |
| SCRUM-89 | Tarea | Frontend - Pantalla de Login, Registro público y servicio de Autenticación | Pérez | Backlog | 3 | Finalizado | — |
| SCRUM-95 | Historia | Backend - Integración M1: usuarios y membresías con el usuario autenticado | Bravo | S4 | 5 | Finalizado | las pantallas de M1 funcionan contra la API real con los cuatro usuarios de prueba, ningún request manda el `idUsuario` del logueado, y los problemas encontrados están resueltos. |
| SCRUM-100 | Historia | Frontend - Integración M1: usuarios y membresías con la API real | Bravo | S4 | 5 | Finalizado | el alta de usuario, la búsqueda por DNI, el alta de membresía y el cambio de estado funcionan contra la API real con los usuarios de prueba, y los problemas encontrados están resueltos. |
| SCRUM-123 | Historia | Mi Pase QR: "Renovar plan" lleva al socio a /membresias y rebota sin permiso | Aquino | S5 | 2 | Finalizado | esos botones lleven a `/pagos` con la membresía seleccionada. |
| SCRUM-124 | Historia | Mi Pase QR: una membresía vencida muestra "Días restantes: 14" | Coppes | S5 | 2 | Finalizado | una membresía vencida no muestre días restantes (o muestre "0" o "Vencida hace N días"), con un test. |
| SCRUM-125 | Historia | Membresías: buscar un socio sin membresía muestra "Error de servidor" | Coppes | S5 | 2 | Finalizado | * La respuesta "sin membresía" del backend se trate como un estado y no como un error. * "Asociar Membresía" abra el formulario con el socio cargado. |
| SCRUM-135 | Historia | Usuarios y pagos - Alta de socio online: la cuenta se crea al pagar la suscripción | Bravo | S5 | 8 | Finalizado | * Un visitante elige un plan, paga y puede iniciar sesión como socio con la membresía activa. * Con el pago rechazado no existe la cuenta. * Ya no se puede crear una cuenta sin pagar. * `./mvnw test`, `npm test` y… |
| SCRUM-142 | Historia | Login: no hay forma de volver al inicio desde la pantalla de login | Pérez | S6 | 2 | Finalizado | el login tenga un enlace o un logo que lleve al inicio sin iniciar sesión. |
| SCRUM-143 | Historia | Investigar: ¿el gerente central puede operar en todas las sedes? | Bravo | S6 | 2 | Finalizado | esté definida la regla y el backend y el frontend la apliquen igual. |

### SCRUM-18 — M2 - Gimnasio y Acceso

| Tarjeta | Tipo | Trabajo | Responsable | Sprint | Puntos | Estado | Criterio de aceptación (de Jira) |
|---|---|---|---|---|---:|---|---|
| SCRUM-31 | Historia | Backend - Modelo Sede | Aquino | S2 | 1 | Finalizado | la entidad mapea la tabla, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-33 | Historia | Backend - Modelo Acceso | Aquino | S2 | 1 | Finalizado | la entidad mapea la tabla, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-66 | Historia | Backend - Endpoints de sedes y aforo en tiempo real | Aquino | S3 | 5 | Finalizado | los seis endpoints funcionan, el aforo refleja ingresos y egresos cargados a mano en la base, y están documentados en Swagger. |
| SCRUM-71 | Historia | Backend - Endpoints de validación de ingreso con QR dinámico | Aquino | S3 | 5 | Finalizado | los tres endpoints funcionan, cada rechazo devuelve su código, el generador y validador de token tienen tests unitarios, y todo está documentado en Swagger. |
| SCRUM-82 | Historia | Frontend - Recepción: validación de ingreso y aforo | Pérez | S3 | 3 | Finalizado | * La pantalla se ve como en el prototipo y funciona con los datos mock del servicio del módulo. * Los componentes nuevos están en el Playground (SCRUM-60). * Cada motivo de rechazo se muestra con un mensaje claro. |
| SCRUM-85 | Historia | Frontend - QR dinámico del socio | Coppes | S3 | 3 | Finalizado | * La pantalla se ve como en el prototipo y el QR se renueva solo cada minuto con el mock. * Los componentes nuevos están en el Playground (SCRUM-60). |
| SCRUM-96 | Historia | Backend - Integración M2: QR, ingreso y aforo con el usuario autenticado | Aquino | S4 | 5 | Finalizado | el socio de prueba obtiene su QR con su sesión, el recepcionista de prueba registra su ingreso y egreso sin mandar la sede, y los problemas encontrados están resueltos. |
| SCRUM-101 | Historia | Frontend - Integración M2: QR del socio y recepción con la API real | Aquino | S4 | 5 | Finalizado | el socio de prueba muestra su QR, el recepcionista lo valida y el aforo sube y baja con el ingreso y el egreso, y los problemas encontrados están resueltos. |
| SCRUM-113 | Historia | App móvil del socio con QR visible offline | Leiva | Backlog | 2 | Por hacer | — |
| SCRUM-139 | Historia | Acceso - Control de acceso sin conexión en el terminal de sede (RNF-01) | Bravo | S6 | 8 | Finalizado | — |

### SCRUM-19 — M3 - Clases Grupales

| Tarjeta | Tipo | Trabajo | Responsable | Sprint | Puntos | Estado | Criterio de aceptación (de Jira) |
|---|---|---|---|---|---:|---|---|
| SCRUM-35 | Historia | Backend - Modelo ClaseGrupal | Bravo | S2 | 1 | Finalizado | la entidad mapea la tabla, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-36 | Historia | Backend - Modelo ReservaClase | Bravo | S2 | 1 | Finalizado | la entidad mapea la tabla con su enum, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-37 | Historia | Backend - Modelo ListaEspera | Bravo | S2 | 1 | Finalizado | la entidad mapea la tabla, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-67 | Historia | Backend - Endpoints de agenda de clases grupales | Aquino | S3 | 5 | Finalizado | los cinco endpoints funcionan, cada regla devuelve su código con el formato común de error, y están documentados en Swagger. |
| SCRUM-72 | Historia | Backend - Endpoints de reserva y cancelación de clases | Aquino | S3 | 5 | Finalizado | los cuatro endpoints funcionan, cada regla devuelve su código con el formato común de error, y están documentados en Swagger. |
| SCRUM-74 | Historia | Backend - Lista de espera de clases con notificación (Observer) | Bravo | S3 | 5 | Finalizado | los tres endpoints funcionan, cancelar una reserva de una clase completa notifica al primero de la cola (se ve en el log), y está documentado en Swagger. |
| SCRUM-79 | Historia | Frontend - Agenda de clases (gerente) | Coppes | S3 | 3 | Finalizado | * Las pantallas se ven como en el prototipo y funcionan con los datos mock del servicio del módulo. * Los componentes nuevos están en el Playground (SCRUM-60). * Los errores de negocio (ej. bajar el cupo por debajo… |
| SCRUM-83 | Historia | Frontend - Reserva de clases y lista de espera (socio) | Pérez | S3 | 3 | Finalizado | * Las pantallas se ven como en el prototipo y funcionan con los datos mock del servicio del módulo. * Los componentes nuevos están en el Playground (SCRUM-60). * Con la clase completa, el botón ofrece la lista de espera. |
| SCRUM-97 | Historia | Backend - Integración M3: agenda, reservas y lista de espera con el usuario autenticado | Leiva | S4 | 5 | Finalizado | con los usuarios de prueba, el gerente arma la agenda y el socio reserva, cancela y se anota en espera sin mandar su id, y los problemas encontrados están resueltos. |
| SCRUM-102 | Historia | Frontend - Integración M3: agenda, reservas y lista de espera con la API real | Leiva | S4 | 5 | Finalizado | el gerente de prueba crea una clase, el socio la reserva y la cancela, con la clase completa se anota en la lista de espera, y los problemas encontrados están resueltos. |
| SCRUM-114 | Historia | Agregar instructor a las clases grupales (RF-06) | Leiva | Backlog | 2 | Por hacer | — |
| SCRUM-126 | Historia | Clases: el socio en espera no puede tomar el cupo liberado desde la pantalla | Chang | S5 | 2 | Finalizado | la tarjeta muestre "Reservar" a quien está en espera si hay cupo disponible. |
| SCRUM-127 | Historia | Clases: el gerente ve las pestañas "Clases disponibles" y "Mis reservas" | Chang | S5 | 2 | Finalizado | el personal vea solo la agenda, y las pestañas de reserva aparezcan solo para el socio. |

### SCRUM-20 — M4 - Canchas Deportivas

| Tarjeta | Tipo | Trabajo | Responsable | Sprint | Puntos | Estado | Criterio de aceptación (de Jira) |
|---|---|---|---|---|---:|---|---|
| SCRUM-38 | Historia | Backend - Modelo Cancha | Leiva | S2 | 1 | Finalizado | la entidad mapea la tabla con su enum, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-39 | Historia | Backend - Modelo ReservaCancha | Bravo | S2 | 1 | Finalizado | la entidad mapea la tabla, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-68 | Historia | Backend - Endpoints de gestión de canchas y mantenimiento | Bravo | S3 | 5 | Finalizado | los cinco endpoints funcionan, cada regla devuelve su código con el formato común de error, y están documentados en Swagger. |
| SCRUM-73 | Historia | Backend - Precio dinámico de canchas (Strategy) | Bravo | S3 | 5 | Finalizado | el endpoint funciona, cada estrategia y la combinación (socio en horario pico) tienen tests unitarios, y está documentado en Swagger. |
| SCRUM-75 | Historia | Backend - Endpoints de grilla de disponibilidad y reserva de turnos | Bravo | S3 | 5 | Finalizado | los tres endpoints funcionan, dos reservas al mismo horario no pasan, y están documentados en Swagger. |
| SCRUM-80 | Historia | Frontend - Gestión de canchas (gerente) | Chang | S3 | 3 | Finalizado | * Las pantallas se ven como en el prototipo y funcionan con los datos mock del servicio del módulo. * Los componentes nuevos están en el Playground (SCRUM-60). * Los errores de negocio se muestran con el mensaje del… |
| SCRUM-84 | Historia | Frontend - Grilla de turnos y reserva de cancha | Chang | S3 | 3 | Finalizado | * Las pantallas se ven como en el prototipo y funcionan con los datos mock del servicio del módulo. * Los componentes nuevos están en el Playground (SCRUM-60). * Si el horario ya fue tomado (409), se muestra el… |
| SCRUM-98 | Historia | Backend - Integración M4: canchas, turnos y precio con el usuario autenticado | Leiva | S4 | 5 | Finalizado | con los usuarios de prueba, el socio ve el precio con descuento y el externo sin descuento para el mismo turno, la reserva queda a nombre del logueado, y los problemas encontrados están resueltos. |
| SCRUM-103 | Historia | Frontend - Integración M4: canchas, turnos y reservas con la API real | Leiva | S4 | 5 | Finalizado | el gerente de prueba crea una cancha, el socio ve el precio con descuento y reserva un turno que aparece ocupado para otro usuario, y los problemas encontrados están resueltos. |
| SCRUM-115 | Tarea | Backend - Índices para la disponibilidad de canchas (RNF-03) | Leiva | Backlog | 2 | Por hacer | — |
| SCRUM-118 | Historia | Canchas: el desglose muestra mal el descuento de socio (−13% en vez de 15% sobre la base) | Aquino | S5 | 2 | Finalizado | el modal muestre "−15%" y la nota diga sobre qué monto se calcula, con un test que lo cubra. |
| SCRUM-119 | Historia | Canchas: el tipo de cancha aparece sin formato (FUTBOL_5, PADDLE) | Aquino | S5 | 2 | Finalizado | todos los lugares muestren la etiqueta legible para cada valor del enum del backend. |
| SCRUM-134 | Historia | Canchas y pagos - Reserva y pago de cancha como invitado, sin cuenta | Bravo | S5 | 8 | Finalizado | * Un visitante sin sesión reserva un turno, paga y descarga el comprobante. * El turno aparece ocupado para los demás. * Con un DNI de socio, se le pide iniciar sesión. * Sin token no se puede pagar ni descargar una… |
| SCRUM-137 | Tarea | Base de datos - Ejecutar en producción el script de codigo_reserva (SCRUM-134) | Leiva | Backlog | 2 | Por hacer | * El script se ejecutó en producción sin errores. * `sin_codigo` da 0 y existe una sola restricción única sobre `codigo_reserva`. * Recién después se despliega el backend de SCRUM-134. |
| SCRUM-146 | Historia | Canchas: "Ver comprobante" de una reserva pagada lleva a pagar de nuevo | Aquino | S6 | 2 | Finalizado | "Ver comprobante" abra el comprobante del pago de esa reserva (RF-14), sin ofrecer pagar otra vez. |
| SCRUM-147 | Historia | Canchas: el cliente externo reserva y paga en un solo paso, sin quedar guardado como usuario | Leiva | S6 | 5 | Finalizado | una reserva de invitado sin pagar no deje el turno tomado ni datos del cliente fuera del comprobante. |
| SCRUM-148 | Historia | Canchas: la reserva de un socio queda tomada aunque no la pague | Leiva | S6 | 5 | Finalizado | una reserva de socio sin pagar deje de ocupar el turno (al vencer el plazo, o porque ya no existan reservas sin pago), con tests de servicio y la grilla mostrando el turno libre. |

### SCRUM-21 — M5 - Pagos y Facturación

| Tarjeta | Tipo | Trabajo | Responsable | Sprint | Puntos | Estado | Criterio de aceptación (de Jira) |
|---|---|---|---|---|---:|---|---|
| SCRUM-40 | Historia | Backend - Modelo Transaccion | Aquino | S2 | 1 | Finalizado | la entidad mapea la tabla con sus dos enums, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-41 | Historia | Backend - Modelo Comprobante | Leiva | S2 | 1 | Finalizado | la entidad mapea la tabla, la tabla existe en la base que levanta el docker compose, y la app arranca sin errores de mapeo. |
| SCRUM-76 | Historia | Backend - Endpoints de pasarela de pago simulada | Bravo | S3 | 5 | Finalizado | los tres endpoints funcionan, se puede probar un pago aprobado y uno rechazado con reintento, y están documentados en Swagger. |
| SCRUM-77 | Historia | Backend - Generación de comprobante en PDF | Aquino | S3 | 5 | Finalizado | un pago confirmado genera su comprobante, el PDF se descarga y se ve bien, y los endpoints están documentados en Swagger. |
| SCRUM-86 | Historia | Frontend - Checkout de pago simulado y comprobantes | Pérez | S3 | 3 | Finalizado | * Las pantallas se ven como en el prototipo y funcionan con los datos mock del servicio del módulo. * Los componentes nuevos están en el Playground (SCRUM-60). * Se puede recorrer un pago aprobado y uno rechazado con… |
| SCRUM-99 | Historia | Backend - Integración M5: pagos y comprobantes con el usuario autenticado | Leiva | S4 | 5 | Finalizado | con los usuarios de prueba, un socio paga una reserva propia y descarga el comprobante, no puede pagar ni descargar lo de otro usuario, y los problemas encontrados están resueltos. |
| SCRUM-104 | Historia | Frontend - Integración M5: checkout, pagos y comprobantes con la API real | Leiva | S4 | 5 | Finalizado | un pago aprobado descarga su PDF, uno rechazado permite reintentar, la renovación extiende la membresía, y los problemas encontrados están resueltos. |
| SCRUM-120 | Historia | Pagos: el resumen de pago de una cancha dice "Cuota membresía (Socio)" | Bravo | S5 | 2 | Finalizado | el pago de una cancha muestre el desglose de la cotización del backend, y el texto de membresía aparezca solo para membresías. |
| SCRUM-121 | Historia | Pagos: un pago rechazado sigue mostrando "Reintentar" después del reintento aprobado | Aquino | S5 | 2 | Finalizado | un rechazo cuya reserva o membresía ya tenga un pago confirmado no ofrezca reintentar ni cuente como pendiente. |
| SCRUM-122 | Historia | Pagos: el checkout de renovación muestra la fecha de vencimiento anterior | Bravo | S5 | 2 | Finalizado | el checkout de renovación muestre hasta cuándo va a quedar vigente después del pago, o no muestre la fecha si no se puede calcular. |
| SCRUM-144 | Historia | Investigar: gerente y recepcionista sin pase QR, pero con opción de pagar suscripción | Bravo | S6 | 2 | Finalizado | ni el gerente ni el recepcionista tengan la opción de pagar una suscripción propia, y el backend rechace ese caso. |

### SCRUM-56 — Capacitaciones

| Tarjeta | Tipo | Trabajo | Responsable | Sprint | Puntos | Estado | Criterio de aceptación (de Jira) |
|---|---|---|---|---|---:|---|---|
| SCRUM-57 | Tarea | Flujo de trabajo | Leiva | Backlog | 2 | Por hacer | — |
| SCRUM-58 | Tarea | Capacitación de Spring Boot | Leiva | S2 | 2 | Finalizado | — |

### Sin épica: documentación de cierre

| Tarjeta | Tipo | Trabajo | Responsable | Sprint | Puntos | Estado | Criterio de aceptación (de Jira) |
|---|---|---|---|---|---:|---|---|
| SCRUM-149 | Tarea | Documentación: actualizar bitácora personal (LOG-aquino.md) | Aquino | S6 | 1 | Finalizado | El archivo `docs/bitacoras/LOG-aquino.md` refleje las últimas tareas completadas y esté commiteado en el repositorio. |
| SCRUM-150 | Tarea | Documentación: actualizar bitácora personal (LOG-bravo.md) | Bravo | S6 | 1 | Finalizado | El archivo `docs/bitacoras/LOG-bravo.md` refleje las últimas tareas completadas y esté commiteado en el repositorio. |
| SCRUM-151 | Tarea | Documentación: actualizar bitácora personal (LOG-chang.md) | Chang | S6 | 1 | Finalizado | El archivo `docs/bitacoras/LOG-chang.md` refleje las últimas tareas completadas y esté commiteado en el repositorio. |
| SCRUM-152 | Tarea | Documentación: actualizar bitácora personal (LOG-coppes.md) | Coppes | S6 | 1 | Finalizado | El archivo `docs/bitacoras/LOG-coppes.md` refleje las últimas tareas completadas y esté commiteado en el repositorio. |
| SCRUM-153 | Tarea | Documentación: actualizar bitácora personal (LOG-leiva.md) | Leiva | S6 | 1 | Finalizado | El archivo `docs/bitacoras/LOG-leiva.md` refleje las últimas tareas completadas y esté commiteado en el repositorio. |
| SCRUM-154 | Tarea | Documentación: actualizar bitácora personal (LOG-perez.md) | Pérez | S6 | 1 | Finalizado | El archivo `docs/bitacoras/LOG-perez.md` refleje las últimas tareas completadas y esté commiteado en el repositorio. |
| SCRUM-155 | Tarea | Documentación: diagramas UML obligatorios (clases, secuencia, estados y actividad) | Bravo | S6 | 3 | Finalizado | Los siete diagramas están en `docs/diagramas/` con fuente `.mmd`, JPG y SVG legibles, autor, fecha y versión, listados en el README de diagramas y mergeados en `develop`. |
