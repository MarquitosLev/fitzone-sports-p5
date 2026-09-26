# GUÍA MAESTRA Y CONTEXTO DE ENTRENAMIENTO PARA IA DE DESARROLLO
**Proyecto:** FitZone Sports  
**Cátedra:** Programación V — Grupo 5  
**Ubicación:** `Integrador/docs/AI_DEVELOPMENT_GUIDE.md`

> **INSTRUCCIÓN SUPREMA PARA CUALQUIER AGENTE O IA DE DESARROLLO:**  
> Lee este documento detenidamente antes de sugerir o escribir una sola línea de código. Todo desarrollo en este repositorio **DEBE** apegarse estrictamente a las reglas, arquitectura, nomenclaturas y flujos aquí definidos.

---

## 1. PROTOCOLO OBLIGATORIO DE TRABAJO (AI WORKFLOW)

1. **Ticket de Jira y Contexto de Docs como Única Fuente de Verdad:**
   - **Toda tarea o sesión de desarrollo DEBE iniciar vinculada a un ticket de Jira específico** (ej: `SCRUM-26`).
   - La IA debe **leer obligatoriamente este documento (`AI_DEVELOPMENT_GUIDE.md`)** para entender el contexto global, las reglas y los estándares antes de sugerir o escribir código.
   - Si la tarea no tiene un ticket claro o los requerimientos son ambiguos, **preguntar primero** al desarrollador antes de avanzar.
2. **Pensar y Armar un Plan Antes de Desarrollar:**
   - Antes de implementar cualquier cambio que no sea trivial, la IA **DEBE** analizar los requisitos, revisar las entidades involucradas y presentar un **Plan de Implementación** detallando componentes a modificar/crear y el plan de verificación.
   - Esperar la confirmación del desarrollador antes de ejecutar código de impacto estructural.
3. **Prohibido Inventar Requisitos:**
   - No asumir funcionalidades que no estén en la especificación técnica, el DER o el diagrama UML.
   - No crear abstracciones innecesarias: no usar DTOs ni clases de acción intermedias (trabajar directo con `models`).
4. **Regla de Oro de Git:**
   - **NUNCA** ejecutar `git commit` ni `git push` automáticamente.
   - La decisión de commitear corresponde siempre al desarrollador. La IA solo propone el cambio y el mensaje cuando se le solicita.
5. **Convención de Ramas y Commits vinculados a Jira:**
    - **Nomenclatura de Ramas:** Toda tarea se desarrolla en una rama propia que se desprende de `develop`, utilizando **únicamente el código del ticket de Jira** (ej: `SCRUM-54`, `SCRUM-29`, etc.). Sin sufijos ni descripciones extra.
    - **Flujo de Ramas:**
      ```bash
      git checkout develop
      git pull origin develop
      git checkout -b SCRUM-<NUMERO>
      ```
   - **Formato de Commits:** Debe incluir la referencia al ticket de Jira siguiendo Conventional Commits:
     ```text
     <tipo>(<modulo/scope>): [SCRUM-<NUMERO>] <descripcion concisa>
     ```
     Ejemplo: `feat(auth): [SCRUM-26] implementar supabase auth y roles M1`
   - **Pull Requests:** Nunca commitear ni pushear directo sobre `develop` o `main`. Se trabaja en la rama del ticket asignado y se abre un PR hacia `develop`.

---

## 2. DOMINIO DE NEGOCIO Y VISIÓN GENERAL

**FitZone Sports** es una plataforma integral de gestión deportiva y administrativa para una cadena de gimnasios multisede.

### Los 5 Módulos del Sistema (Monolito Modular)
Todo el backend vive en el mismo repositorio (`fz-backend`), organizado en 5 módulos desacoplados bajo el paquete `com.fitzone.modulo`:

1. **Módulo 1: Usuarios, Sedes y Autenticación (`com.fitzone.modulo.usuarios`)**
   - Gestión de sedes de la cadena.
   - Perfil de usuarios, datos personales y vinculación con Supabase Auth.
   - Matriz de roles y estados de actividad.
2. **Módulo 2: Canchas Deportivas (`com.fitzone.modulo.canchas`)**
   - Inventario de canchas (Paddle, Fútbol 5, Tenis, Básquet) por sede.
   - Alquiler de turnos y prevención de solapamientos temporales (RN-02).
   - **Checkout de Invitado (`EXTERNO`):** Reserva pública sin registro.
   - Reserva de socios con **15% de descuento** automático.
3. **Módulo 3: Clases Grupales y Listas de Espera (`com.fitzone.modulo.clases`)**
   - Agenda semanal de actividades y cupos máximos por clase.
   - Reserva de clases con hasta 48 hs de anticipación para socios con cuota al día.
   - Cola de espera basada en patrón Observer para notificación de vacantes (RF-08).
   - *Nota:* Las clases no tienen costo adicional; están cubiertas por la membresía activa.
4. **Módulo 4: Gimnasio, Molinetes y Aforo (`com.fitzone.modulo.gimnasio`)**
   - Control de accesos en tornos físicos de entrada/salida (RN-01: acceso único simultáneo).
   - Cálculo y reporte de aforo en tiempo real por sede.
   - Trazabilidad de asistencia real a clases y canchas (RN-04).
5. **Módulo 5: Pagos, Membresías y Facturación (`com.fitzone.modulo.pagos`)**
   - Catálogo de planes de suscripción (Mensual, Trimestral, Anual).
   - Control de vigencia, morosidad e histórico de renovaciones (RN-03).
   - Integración con pasarela externa (Mercado Pago / Mock) sin guardar datos de tarjetas (ADR-003).
   - Transacciones desacopladas de las reservas para admitir reintentos de pago (ADR-004).
   - Generación de comprobantes y facturas.

---

## 3. MATRIZ DE ROLES Y AUTENTICACIÓN (SUPABASE AUTH)

### Los 4 Roles del Sistema (`TipoUsuario` / `fz_enum_tipo_usuario`)
> ⚠️ **ATENCIÓN:** El rol `INSTRUCTOR` **NO EXISTE** en el sistema. El enum tiene exactamente 4 valores:

| Rol | ¿Requiere Login en Supabase? | `auth_id` en BD | Descripción y Permisos |
| :--- | :--- | :--- | :--- |
| **`EXTERNO`** | **NO (Invitado)** | `NULL` | Usuario que navega la web, completa sus datos y reserva una cancha pagando de inmediato (como compra en e-commerce). **No tiene cuenta en `auth.users`**. |
| **`SOCIO`** | **SÍ** | `UUID` (Supabase UID) | Usuario registrado con membresía. Accede a reservar clases grupales, canchas con -15% desc., y ver perfil. |
| **`RECEPCIONISTA`** | **SÍ** | `UUID` (Supabase UID) | Empleado de mostrador. Da de alta socios, cobra en efectivo/posnet, gestiona molinetes. Limitado por su sede asignada. |
| **`GERENTE`** | **SÍ** | `UUID` (Supabase UID) | Administrador total. Modifica precios, planes, da de alta sedes, canchas, y consulta métricas de negocio. |

### Arquitectura de Autenticación (ADR-002)
* **Proveedor Centralizado:** Supabase Auth (`fitzone-db-dev`).
* **JWKS Endpoint:** `https://lzpmyoxpcaelgnjycpfz.supabase.co/auth/v1/.well-known/jwks.json`.
* **Mecanismo:** El backend es un **Resource Server OAuth2 stateless**.
  1. El cliente (web/móvil) hace login contra Supabase Auth y recibe el JWT.
  2. El cliente envía `Authorization: Bearer <token>` al backend.
  3. Spring Security valida la firma criptográfica contra el JWKS de Supabase.
  4. `JwtAuthConverter` lee el claim `sub` (el UID de Supabase), busca en `fz_usr_usuarios` dónde `auth_id = sub`, y carga las autoridades `ROLE_SOCIO`, `ROLE_RECEPCIONISTA` o `ROLE_GERENTE`.
  5. Los endpoints aplican autorización granular con `@PreAuthorize("hasRole('...')")`.

---

## 4. CONVENCIONES Y NOMENCLATURAS DE CÓDIGO

### A. Base de Datos (PostgreSQL 16)
- **Nombres de tablas:** Plural, en minúsculas con `snake_case` y prefijo de módulo obligatorio:
  - `fz_sedes`: Sedes
  - `fz_usr_*`: Usuarios y autenticación (`fz_usr_usuarios`)
  - `fz_gym_*`: Gimnasio, accesos y aforo (`fz_gym_accesos`)
  - `fz_cls_*`: Clases (`fz_cls_clases`, `fz_cls_reservas`, `fz_cls_lista_espera`)
  - `fz_cch_*`: Canchas (`fz_cch_canchas`, `fz_cch_reservas`)
  - `fz_pag_*`: Pagos (`fz_pag_planes`, `fz_pag_membresias`, `fz_pag_transacciones`, `fz_pag_comprobantes`)
- **Claves Primarias (PK):**
  - **UUID v4** en todas las tablas transaccionales y operativas (`id_usuario`, `id_reserva_cancha`, etc.).
  - **INT** únicamente en catálogos estáticos pequeños (`id_plan` en `fz_pag_planes`).
- **Enums Nativos:** Usar siempre los tipos enum de PostgreSQL (`fz_enum_tipo_usuario`, `fz_enum_estado_membresia`, etc.).

### B. Backend (Java 21 + Spring Boot 3.4)
- **Estructura de paquetes (Capas Clásicas + Middleware):**
  ```text
  com.fitzone
  ├── core
  │   ├── config          # Configuraciones generales (CORS, WebMvc)
  │   ├── security        # JwtAuthConverter, SecurityConfig
  │   ├── middleware      # AuthTokenMiddleware (validación de token, claims, usuario activo/suspendido)
  │   └── exception       # Excepciones globales y handlers
  └── modulo
      ├── usuarios        # controller, models, repository, service
      ├── canchas         # controller, models, repository, service
      ├── clases          # controller, models, repository, service
      ├── gimnasio        # controller, models, repository, service
      └── pagos           # controller, models, repository, service
  ```
- **Capas y Responsabilidades:**
  - **`controller`**: Controladores REST (`@RestController`). Reciben requests y delegan directamente a la capa de servicio utilizando las entidades del modelo.
  - **`models`**: Entidades JPA (`Usuario`, `Cancha`, etc.), enums del sistema (`TipoUsuario`, etc.) y estructuras del modelo. **Se trabaja directamente con las entidades; NO se crean DTOs ni clases de acción intermedias**.
  - **`repository`**: Interfaces de acceso a datos con Spring Data JPA (`JpaRepository`).
  - **`service`**: Lógica de negocio pura y demarcación transaccional (`@Transactional`).
  - **`middleware`**: Filtros previos a los controladores (`OncePerRequestFilter`). Valida prestaciones del token, verifica que el usuario no esté suspendido o inactivo, y asocia el usuario autenticado al request (`request.setAttribute("currentUser", ...)`) para consumo directo.
- **Clases y Nombres:**
  - Entidades: PascalCase singular (`Usuario`, `Cancha`, `ReservaCancha`).
  - Repositorios: `JpaRepository<Entidad, ID>` (nombre: `EntidadRepository`).
  - Servicios: `ServicioEntidad` o `EntidadService`.
  - Controladores: `EntidadController`.
- **Endpoints REST:**
  - Context path base: `/api`.
  - Versionado: `/v1/<recurso-plural>` (ejemplo: `/api/v1/usuarios/me`, `/api/v1/canchas/reservas/externo`).
  - Rutas públicas anónimas: declaradas explícitamente en `SecurityConfig` con `permitAll()`.
  - Rutas seguras: aseguradas mediante `@PreAuthorize("hasAnyRole('...')")`.

### C. Frontend (React 19 + TypeScript + Vite)
- Componentes funcionales en TypeScript (`.tsx`).
- Variables y funciones en `camelCase`.
- Interfaces y tipos con prefijo o PascalCase (`Usuario`, `Reserva`).
- Manejo de token: Almacenado en memoria o local storage seguro, inyectado vía interceptor Axios/Fetch en header `Authorization: Bearer <token>`.

---

## 5. REGLAS DE NEGOCIO CRÍTICAS (DE OBLIGATORIO CUMPLIMIENTO)

- **RN-01 (Acceso Físico Único):** En `fz_gym_accesos` no puede existir más de un registro con `fecha_hora_egreso IS NULL` para un mismo usuario.
- **RN-02 (Concurrencia sin solapamiento de canchas):** Ninguna cancha puede reservarse en horarios solapados (`fecha_hora_inicio` a `fecha_hora_fin`). En BD se valida con `EXCLUDE USING gist`.
- **RN-03 (Morosidad y Descuentos):** Si `NOW() > fecha_vencimiento` de la membresía del socio, el socio pierde automáticamente el derecho a reservar clases y el descuento del 15% en canchas.
- **RN-04 (Trazabilidad de Accesos):** Un acceso al gimnasio puede estar asociado a lo sumo a una reserva (de clase o de cancha), **nunca a ambas a la vez**. Si ambas son nulas, es acceso libre al gimnasio.
- **ADR-001 (Aislamiento Multisede):** Foreign Keys compuestas `(recurso_id, id_sede)` para evitar que una reserva de cancha o clase se vincule a una sede equivocada.
- **ADR-004 (Transacciones de Pago):** La relación de reserva con pago se define en `fz_pag_transacciones.id_reserva_cancha` y no al revés, para permitir reintentos ante fallas en la pasarela.

---

## 6. GUÍA RÁPIDA DE COMANDOS LOCALES

* **Levantar Base de Datos Local (Docker):**
  ```bash
  cd Integrador
  docker compose up -d
  ```
* **Compilar y Correr Tests Backend:**
  ```bash
  cd Integrador/fz-backend
  ./mvnw clean test
  ```
* **Levantar Backend en Local:**
  ```bash
  cd Integrador/fz-backend
  ./mvnw spring-boot:run
  ```
* **Levantar Frontend en Local:**
  ```bash
  cd Integrador/fz-frontend
  npm install
  npm run dev
  ```

---

## 7. DICCIONARIO DE ANOTACIONES Y DEPENDENCIAS

A continuación se detalla cada anotación y dependencia utilizada en el backend de FitZone Sports, explicando su propósito, para qué se usa y qué efecto produce en la aplicación.

### A. Spring Framework & Spring Boot Web
* **`@SpringBootApplication`**: Marca la clase principal de la aplicación. Es una meta-anotación que combina:
  - `@Configuration`: Permite definir beans adicionales en el contexto.
  - `@EnableAutoConfiguration`: Habilita la autoconfiguración de Spring Boot según las dependencias del classpath (JPA, Security, Web).
  - `@ComponentScan`: Escanea automáticamente todos los componentes, servicios y repositorios dentro del paquete `com.fitzone`.
* **`@RestController`**: Especialización de `@Controller` para APIs REST. Indica que todos los métodos de la clase devuelven datos serializados (generalmente en JSON) directamente en el cuerpo de la respuesta HTTP, sin resolución de vistas HTML.
* **`@RequestMapping("/ruta")`**: Define el mapeo de URL base para un controlador o método. En nuestro proyecto, los controladores cuelgan de `/v1/<recurso>`.
* **`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`**: Atajos semánticos de `@RequestMapping(method = RequestMethod.*)` para mapear peticiones HTTP GET, POST, PUT y DELETE.
* **`@RequestBody`**: Indica que el cuerpo de la petición HTTP entrante debe deserializarse automáticamente (vía Jackson) en el objeto Java del parámetro (ej: una entidad `Usuario`).
* **`@RequestParam`**: Vincula parámetros de consulta (query params de la URL, ej: `/usuarios?tipo=SOCIO`) a variables del método.
* **`@PathVariable`**: Extrae valores dinámicos definidos en la plantilla de la URL (ej: `/usuarios/{id}`).
* **`@CrossOrigin`**: Habilita CORS (Cross-Origin Resource Sharing) en controladores para permitir peticiones desde dominios externos (ej: Vercel en desarrollo/producción o `localhost:5173`).
* **`@Service`**: Especialización de `@Component` para la capa de lógica de negocio. Permite a Spring registrar la clase como un Bean singleton inyectable.
* **`@Component`**: Marca cualquier clase genérica (como `JwtAuthConverter` o `AuthTokenMiddleware`) como un Bean administrado por el contenedor de Spring.
* **`@Configuration`**: Declara una clase como fuente de definiciones de Beans. Spring ejecuta los métodos anotados con `@Bean` dentro de estas clases durante el arranque.
* **`@Bean`**: Produce un objeto administrado por el contexto de Spring (usado en `SecurityConfig` para `SecurityFilterChain` y `CorsConfigurationSource`).

---

### B. Spring Security & OAuth2
* **`@EnableWebSecurity`**: Habilita el soporte de seguridad web en Spring Boot, permitiendo configurar reglas de autenticación, filtros y políticas de sesiones.
* **`@EnableMethodSecurity`**: Habilita el control de acceso declarativo a nivel de métodos (autorización RBAC mediante anotaciones como `@PreAuthorize`).
* **`@PreAuthorize("hasRole('...')")` o `hasAnyRole(...)`**: Evalúa una expresión SpEL (Spring Expression Language) antes de ejecutar el método del controlador. Si el usuario no tiene la autoridad requerida (ej: `ROLE_GERENTE`), Spring lanza automáticamente una `AccessDeniedException` y responde HTTP `403 Forbidden`.
* **`@AuthenticationPrincipal`**: Inyecta el usuario o principal autenticado directamente en los argumentos del método de un controlador.

---

### C. Spring Data JPA & Hibernate (Persistencia)
* **`@Entity`**: Declara que la clase Java representa una entidad persistente mapeada a una tabla de base de datos relacional.
* **`@Table(name = "...")`**: Especifica el nombre físico exacto de la tabla en PostgreSQL (siguiendo nuestra convención snake_case, ej: `fz_usr_usuarios`, `fz_sedes`).
* **`@Id`**: Identifica el atributo como la Clave Primaria (PK) de la entidad.
* **`@GeneratedValue(strategy = GenerationType.UUID)`**: Le indica al proveedor de JPA (Hibernate) que genere automáticamente un identificador único global UUID v4 para la clave primaria al persistir.
* **`@Column(name = "...", nullable = ..., unique = ..., length = ...)`**: Configura las restricciones de la columna en la base de datos:
  - `name`: Nombre físico de la columna en snake_case.
  - `nullable = false`: Aplica restricción NOT NULL.
  - `unique = true`: Aplica restricción UNIQUE en PostgreSQL.
  - `length`: Longitud máxima para tipos VARCHAR.
* **`@Enumerated(EnumType.STRING)`**: Almacena el valor del Enum como texto legible (ej: `'SOCIO'`) en la base de datos, en lugar del ordinal numérico por defecto (`0, 1`), evitando inconsistencias si cambia el orden del Enum.
* **`@ManyToOne(fetch = FetchType.LAZY)`**: Define una relación muchos a uno (ej: muchos usuarios pertenecen a una sede de origen). `FetchType.LAZY` asegura que la sede no se cargue de la base de datos a menos que se acceda explícitamente a ella, optimizando el rendimiento.
* **`@JoinColumn(name = "...")`**: Especifica la columna física de la Clave Foránea (FK) en la tabla (ej: `id_sede_origen`).
* **`@Transactional`**: Demarca el método para que se ejecute dentro de una transacción de base de datos. Si el método finaliza con éxito, los cambios se confirman (`commit`); si se lanza una excepción no verificada (`RuntimeException`), todos los cambios se revierten (`rollback`).
* **`@Transactional(readOnly = true)`**: Optimización para métodos de solo lectura (`SELECT`). Desactiva el dirty-checking de Hibernate y permite al motor de base de datos optimizar el aislamiento de la transacción.

---

### D. Jackson (Serialización JSON)
* **`@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})`**: Evita fallos de serialización JSON (`LazyInitializationException` o errores de proxy) cuando Jackson intenta convertir a JSON entidades que contienen proxies de Hibernate generados por relaciones `FetchType.LAZY`.

---

### E. Project Lombok (Reducción de Boilerplate)
* **`@Getter` / `@Setter`**: Genera automáticamente en tiempo de compilación todos los métodos getter y setter para los campos de la clase.
* **`@NoArgsConstructor`**: Genera un constructor sin argumentos (obligatorio para que Hibernate pueda instanciar entidades).
* **`@AllArgsConstructor`**: Genera un constructor con todos los argumentos de la clase.
* **`@Builder`**: Implementa el patrón Builder para permitir la construcción fluida de instancias (`Usuario.builder().nombre("...").build()`).
* **`@Builder.Default`**: Asegura que los valores inicializados por defecto en los atributos (ej: `boolean activo = true`) se preserven al utilizar `@Builder`.
* **`@RequiredArgsConstructor`**: Genera un constructor con todos los atributos `final` de la clase. Es el mecanismo estándar y recomendado para inyección de dependencias por constructor sin usar `@Autowired`.
* **`@Slf4j`**: Inyecta automáticamente una instancia estática de logger (`log`) de SLF4J para registrar trazas en consola (`log.info()`, `log.warn()`, `log.error()`).

---

### F. Testing (JUnit 5, Mockito & Spring Test)
* **`@SpringBootTest`**: Carga el contexto completo de Spring Boot para pruebas de integración reales de la aplicación.
* **`@Test`**: Marca un método como un caso de prueba ejecutable por el motor de JUnit 5.
* **`@ExtendWith(MockitoExtension.class)`**: Inicializa el entorno de Mockito en JUnit 5 para pruebas unitarias aisladas y de alta velocidad (sin levantar Spring).
* **`@Mock`**: Crea un objeto simulado (mock) de una interfaz o clase (ej: `UsuarioRepository`).
* **`@InjectMocks`**: Inyecta los mocks creados dentro de la clase bajo prueba (ej: `JwtAuthConverter`).
* **`@MockitoBean`**: Anotación nativa de Spring Boot 3.4 que reemplaza un Bean real dentro del ApplicationContext de Spring con un mock de Mockito para pruebas de integración.
* **`@BeforeEach` / `@AfterEach`**: Métodos de configuración que se ejecutan antes y después de cada caso de prueba.
* **`@DisplayName("...")`**: Define un nombre descriptivo y legible en español para la prueba en los reportes de ejecución.

---

### G. Dependencias del Proyecto (`pom.xml`)
* **`spring-boot-starter-web`**: Incluye Spring MVC, validación REST y servidor embebido Tomcat.
* **`spring-boot-starter-data-jpa`**: Incluye Hibernate ORM y Spring Data JPA para persistencia relacional.
* **`spring-boot-starter-security`**: Infraestructura de seguridad, autenticación, autorización y protección de rutas.
* **`spring-boot-starter-oauth2-resource-server`**: Permite validar tokens JWT emitidos por Supabase Auth contra el endpoint JWKS de forma apátrida (stateless).
* **`postgresql`**: Driver JDBC oficial para la conexión y ejecución de sentencias en PostgreSQL 16.
* **`lombok`**: Biblioteca que genera código repetitivo (getters, setters, builders) durante la fase de compilación.
* **`spring-boot-starter-test`**: Incluye el stack de testing: JUnit Jupiter (JUnit 5), Mockito, AssertJ y herramientas de prueba de Spring.

---

## 8. ECOSISTEMA DE SERVIDORES MCP (MODEL CONTEXT PROTOCOL)

Los servidores MCP permiten a la IA de desarrollo interactuar directamente con herramientas externas del proyecto (Jira, GitHub, bases de datos y servicios en la nube) sin salir del entorno de trabajo.

### A. MCPs Activos y Configurados en el Entorno

| Servidor MCP | Herramientas Principales | Para qué se usa en FitZone |
| :--- | :--- | :--- |
| **`atlassian-mcp-server`** | `getJiraIssue`, `searchJiraIssuesUsingJql`, `addCommentToJiraIssue`, `transitionJiraIssue`, `getConfluencePage` | **Gestión de Jira y Confluence:** Consultar los requerimientos y criterios de aceptación del ticket actual (`SCRUM-<N>`), verificar el estado del sprint y acceder a la documentación funcional. |
| **`supabase`** | `list_tables`, `execute_sql`, `list_migrations`, `apply_migration`, `query_logs`, `get_advisors` | **Base de Datos Cloud y Auth:** Inspeccionar esquemas, ejecutar consultas de verificación, validar políticas RLS, consultar logs de autenticación y aplicar scripts DDL en el proyecto Supabase Cloud (`lzpmyoxpcaelgnjycpfz`). |

### B. MCPs Recomendados para Incorporar

1. **`GitHub MCP Server` (`@modelcontextprotocol/server-github`):**
   - **Utilidad:** Permite a la IA inspeccionar Pull Requests hacia `develop`, leer issues, verificar commits y branches remotas, o preparar borradores de PR con plantillas estandarizadas.
   - **Configuración típica:** Requiere un GitHub Personal Access Token (PAT) con permisos de lectura/escritura en el repositorio.
2. **`PostgreSQL MCP Server` (`@modelcontextprotocol/server-postgres`):**
   - **Utilidad:** Conexión directa a la base de datos local en Docker (`jdbc:postgresql://localhost:5432/fitzone_db`). Permite a la IA inspeccionar la estructura real de tablas locales, verificar datos semilla (seeds) y probar queries complejas antes de volcarlas en código JPA.
3. **`Docker MCP Server`:**
   - **Utilidad:** Permite consultar el estado de los contenedores (`fitzone_postgres_local`, QA), reiniciar servicios o leer logs del contenedor sin necesidad de cambiar a la terminal manual.
4. **`Fetch / Context Documentation MCP`:**
   - **Utilidad:** Permite consultar documentación técnica en vivo de APIs externas (como el SDK oficial de Mercado Pago para el Módulo 5 de Pagos).

### C. Protocolo de Uso de MCPs para la IA
- **Al iniciar una tarea:** Utilizar `atlassian-mcp-server` (`getJiraIssue`) para leer la descripción completa, criterios de aceptación y dependencias del ticket asignado.
- **En tareas de base de datos:** Usar `supabase` para validar tipos de datos o constraints existentes antes de crear migraciones o entidades JPA.
- **Regla de integridad:** La IA **NO DEBE** transicionar estados de tickets en Jira, cerrar issues ni mergear Pull Requests sin la expresa indicación del desarrollador.

