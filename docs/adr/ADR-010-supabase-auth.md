# ADR-010 — Autenticación delegada en Supabase Auth, autorización en el backend

- **Estado:** Aceptado
- **Fecha:** 2026-09-06
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (acta de la reunión del 2026-09-06; registrado originalmente como "ADR-002" en el documento del Drive)
- **Sprint:** 2

## Contexto
Los cuatro roles (socio activo, cliente externo, recepcionista o administrador de sede y gerente central) entran desde la web, y en el plan inicial también desde una app móvil. Construir el registro, el login, el hash de contraseñas, el refresco de tokens y la recuperación de clave en el backend era trabajo de varias semanas y un riesgo de seguridad para un equipo sin experiencia en el tema.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Módulo de autenticación propio con Spring Security (usuarios, BCrypt, JWT emitido por nosotros) | Control total; sin dependencia externa | Semanas de desarrollo; cada error es una vulnerabilidad | Le restaba tiempo a la lógica del gimnasio (reservas, aforo, pagos) |
| Keycloak autoalojado | Estándar OIDC completo | Un servidor más para operar y hostear | Sin hosting gratuito razonable; demasiado para el alcance |
| Auth0 / Firebase Auth | SaaS maduro | Otro proveedor aparte de la base; límites del plan gratuito | Supabase ya alojaba la base (ADR-002) |
| **Supabase Auth + Spring como Resource Server** | Mismo proveedor que la base; el JWT se valida localmente contra JWKS | Dependencia del proveedor; hay que sincronizar sus usuarios con `fz_usr_usuarios` | — |

## Decisión
Vamos a delegar la autenticación en Supabase Auth y conservar la autorización en el backend. Spring actúa como OAuth2 Resource Server: valida la firma del JWT contra el JWKS de Supabase sin consultarlo en cada pedido. `JwtAuthConverter` busca al usuario por `auth_id` (claim `sub`) en `fz_usr_usuarios` y carga `ROLE_<TIPO_USUARIO>`. `UsuarioActual` resuelve el usuario logueado para que los servicios no confíen en ids que vengan en el request. `POST /v1/auth/login` hace de proxy al login de Supabase, y las altas de personal se crean con la clave de servicio desde el backend.

## Consecuencias
- **Positivas:** no se guardan contraseñas en nuestra base. El rol lo decide nuestro modelo de dominio y no el proveedor. El cliente externo no necesita cuenta (`auth_id` nulo).
- **Negativas:** hay que mantener vinculados `auth.users` de Supabase y `fz_usr_usuarios`. Los usuarios de prueba del seed no podían iniciar sesión hasta ajustar su `auth_id` (SCRUM-130). La sesión depende de que Supabase esté disponible.
- **Deuda asumida:** `SecurityConfig` lista solo las rutas públicas (catálogo de canchas, sedes y planes, checkout de invitado, login y Swagger) y exige sesión para todo lo demás. El rol se valida en cada endpoint con `@PreAuthorize`. Los roles y prestaciones que se editan desde la pantalla de gerencia (`/admin/roles`) viven solo en el frontend (`localStorage`) y no cambian los permisos reales del backend.

## Requisitos relacionados
RF-01, RF-03, RNF-02
