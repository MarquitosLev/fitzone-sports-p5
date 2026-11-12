# Manual de instalación y operación — FitZone Sports

- **Versión:** 1.0 · **Fecha:** 2026-11-10 · **Autor:** Leiva, Marcos Joel (Grupo 5)
- **Público:** quien instala, despliega u opera el sistema.

Este manual describe el sistema tal como está en el repositorio. Donde algo no está implementado, se indica.

## 1. Requisitos previos

| Software | Versión | Para qué |
|---|---|---|
| Git | 2.40 o superior | Clonar el repositorio |
| Docker Desktop / Docker Engine + Compose v2 | Docker 24+, Compose 2.20+ | PostgreSQL local |
| JDK | Temurin 21 | Backend (el wrapper `mvnw` descarga Maven 3.9) |
| Node.js | 20 LTS o 22 LTS, npm 10 | Frontend |
| PostgreSQL | 16 (imagen `postgres:16-alpine`) | Base de datos |

Cuentas externas, solo para entornos en la nube: Supabase (Auth y base), Render (backend) y Vercel (frontend).

## 2. Puesta en marcha en desarrollo

```bash
git clone https://github.com/MarquitosLev/fitzone-sports-p5.git
cd fitzone-sports-p5
docker compose up -d
```

`docker compose` levanta solo PostgreSQL (contenedor `fitzone_postgres_local`, puerto 5432, base `fitzone_db`, usuario `fitzone_user`, contraseña `fitzone_password`). Ejecuta los scripts de `docker/initdb` la primera vez que se crea el volumen.

Backend (perfil `local` por defecto):

```bash
cd fz-backend
./mvnw spring-boot:run
```

- API en `http://localhost:8080/api`, Swagger en `http://localhost:8080/api/swagger-ui`, estado en `http://localhost:8080/api/ping`.
- Con el perfil `local`, Hibernate crea o actualiza las tablas (`ddl-auto=update`) y `DataInitializer` carga los datos de prueba de [DATOS_DE_PRUEBA.md](../DATOS_DE_PRUEBA.md).
- Para iniciar sesión hace falta `SUPABASE_SERVICE_ROLE_KEY` en `fz-backend/.env` (ver sección 4). Sin ella, el backend arranca, pero el login contra Supabase falla y las altas de usuarios usan un `authId` simulado.

Frontend:

```bash
cd fz-frontend
cp .env.example .env
npm ci
npm run dev
```

La web queda en `http://localhost:5173`. Con `VITE_USE_MOCK=true` funciona sin backend, con datos simulados.

## 3. Puesta en marcha en producción

El despliegue de referencia (ADR-008) es:

| Componente | Servicio | Configuración |
|---|---|---|
| Backend | Render, Web Service con Docker | `fz-backend/Dockerfile` (multi-stage: JDK 21 compila, JRE 21 Alpine ejecuta). Perfil `dev` o `prod` |
| Frontend | Vercel | Raíz `fz-frontend`, comando `npm run build`, salida `dist` |
| Base de datos y Auth | Supabase | PostgreSQL 16 gestionado y Supabase Auth |

Pasos:

1. Crear en Supabase las tablas: arrancar una vez el backend con perfil `dev` (`ddl-auto=update`) contra la base de Supabase, o ejecutar el DDL generado. Después aplicar `docs/sql/SCRUM-93-restricciones.sql`.
2. En Render, crear el servicio desde el repositorio, rama `main`, con las variables de la sección 4. Render asigna `PORT`.
3. En Vercel, importar el proyecto con raíz `fz-frontend` y definir `VITE_API_BASE_URL=https://<servicio>.onrender.com/api` y `VITE_USE_MOCK=false`.
4. Agregar el dominio de Vercel a `CORS_ALLOWED_ORIGINS` del backend.
5. Verificar `GET https://<servicio>.onrender.com/api/ping` y el login desde la web.

Con el perfil `prod`, Hibernate solo valida el esquema (`ddl-auto=validate`): un cambio de entidades exige actualizar antes la base.

Hoy el entorno publicado es de desarrollo (`fitzone-backend-dev` sigue `develop`). En el plan gratuito de Render el servicio se duerme y tarda más de un minuto en responder al primer pedido.

**No implementado:** no hay `Dockerfile` del frontend, así que `docker compose up --build` no levanta el sistema completo; solo la base.

## 4. Variables de entorno

Backend. Se leen del entorno, y en local también de `.env` y `fz-backend/.env` (ignorados por git).

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | No | `local` | `local`, `dev` o `prod` |
| `PORT` | No | `8080` | Puerto HTTP. El context path es siempre `/api` |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Solo `local` | `localhost`, `5432`, `fitzone_db` | Base local |
| `DB_USER`, `DB_PASSWORD` | Solo `local` | `fitzone_user`, `fitzone_password` | Credenciales locales |
| `SPRING_DATASOURCE_URL` o `DATABASE_URL` | `dev`/`prod` | — | URL JDBC de la base (Supabase) |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | `dev`/`prod` | — | Credenciales de la base |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:[*],https://*.vercel.app` | Orígenes permitidos, separados por coma |
| `SUPABASE_URL` | No | URL del proyecto `fitzone-db-dev` | Base de Supabase Auth; de ahí sale el JWKS |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí, para login y altas | vacía | Clave de servicio de Supabase. **Secreta** |
| `SUPABASE_ALTA_POR_EMAIL` | No | `true` | Las altas de personal envían invitación por mail |
| `SUPABASE_INVITE_REDIRECT_URL` | No | — | A dónde vuelve el link de invitación |
| `ROOT_API_KEY` | Para `/admin/database` | — | Clave del endpoint de consultas de administración. **Secreta** |
| `QR_SECRET` | Sí en `dev`/`prod` | una clave de desarrollo fija | Clave HMAC del QR de acceso. **Secreta**; el valor por defecto está en el código y no sirve fuera de local. Cambiarla invalida los QR vigentes |

Frontend (se incrustan en el build y son públicas: nunca poner secretos):

| Variable | Valor de ejemplo | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | URL base de la API |
| `VITE_USE_MOCK` | `false` | `true` usa datos simulados sin backend |

## 5. Base de datos: migraciones, reversión y datos semilla

- **Esquema:** lo genera Hibernate a partir de las entidades (ADR-016). No hay herramienta de migraciones (Flyway o Liquibase); está registrado como deuda en ADR-002 y ADR-004.
- **Scripts manuales:** `docs/sql/SCRUM-93-restricciones.sql` agrega restricciones CHECK y FK con nombre que Hibernate no genera. Se ejecuta una vez por base, con `psql`:

  ```bash
  psql "$DATABASE_URL" -f docs/sql/SCRUM-93-restricciones.sql
  ```

- **Reversión:** como no hay migraciones versionadas, revertir un cambio de esquema es manual: restaurar el respaldo previo (sección 7) o escribir el `ALTER TABLE` inverso. Antes de desplegar un cambio de entidades a `prod`, tomar un respaldo.
- **Datos semilla:** `DataInitializer` los carga solo con el perfil `local`, y cada registro solo si todavía no existe (busca por email o DNI). Usuarios, sedes, planes, canchas y clases figuran en [DATOS_DE_PRUEBA.md](../DATOS_DE_PRUEBA.md). Para empezar de cero en local:

  ```bash
  docker compose down -v
  docker compose up -d
  ```

## 6. Despliegue y reversión

Estrategia (ADR-008): despliegue continuo por rama. Cada push a la rama configurada redespliega Render y Vercel. Vercel además genera una preview por rama.

El pipeline de [.github/workflows/ci.yml](../../.github/workflows/ci.yml) corre en cada PR y push a `develop`: `./mvnw -B verify` en el backend y `npm ci`, `npm run coverage` y `npm run build` en el frontend. El merge a `develop` se hace con el pipeline en verde.

Reversión:

1. **Código:** `git revert <commit>` sobre la rama desplegada y push. Render y Vercel redespliegan solos.
2. **Inmediata, sin código:** en Render, *Manual Deploy → Rollback* a un deploy anterior; en Vercel, *Promote* de un deployment anterior.
3. **Esquema:** restaurar el respaldo (sección 7). Revertir el código no deshace columnas que Hibernate ya creó.

## 7. Respaldo y restauración

Respaldo completo de la base:

```bash
pg_dump --format=custom --no-owner --file=fitzone-$(date +%F).dump "$DATABASE_URL"
```

En local, contra el contenedor:

```bash
docker exec fitzone_postgres_local pg_dump -U fitzone_user -Fc fitzone_db > fitzone-local.dump
```

Restauración:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" fitzone-AAAA-MM-DD.dump
```

Supabase hace además respaldos diarios en su plan, que se restauran desde su panel. Las cuentas de Supabase Auth (`auth.users`) se respaldan con la base del proyecto; si se restaura solo el esquema `public`, revisar que los `auth_id` de `fz_usr_usuarios` sigan existiendo.

## 8. Operación degradada

**Estado actual:** el control de acceso requiere conexión (ADR-003). No hay modo offline ni cola local de ingresos.

| Falla | Efecto | Qué hacer |
|---|---|---|
| Se cae internet en la sede | La recepción no puede validar QR | Registrar ingresos en planilla (DNI, hora) y cargarlos con *Registrar ingreso* cuando vuelva la conexión. Nadie valida aforo ni RN-01 mientras tanto |
| Render dormido o caído | La web muestra errores de red | Esperar el arranque (más de 1 minuto en plan gratuito) o hacer rollback (sección 6) |
| Supabase Auth caído | No se puede iniciar sesión; las sesiones abiertas siguen hasta que vence el token | Esperar; no hay login alternativo |
| Base caída | La API responde 500 | Ver `/api/ping` y los logs; restaurar si hubo pérdida |

La resincronización con revalidación de reglas que pide RNF-01 no está implementada.

## 9. Alta de una sede nueva sin detener el sistema

Las sedes son datos, no configuración: se agregan en caliente.

1. Iniciar sesión como gerente.
2. `POST /api/v1/sedes` con el token del gerente:

   ```json
   { "nombre": "Sede Sur", "aforoMaximo": 120 }
   ```

3. Crear las canchas de la sede (`POST /api/v1/canchas`, rol GERENTE) y sus clases (`POST /api/v1/clases`, rol GERENTE).
4. Dar de alta al recepcionista con la sede asignada (`POST /api/v1/usuarios`). Solo va a poder operar esa sede (ADR-015).

No requiere reinicio ni despliegue. La sede aparece de inmediato en el selector de sede de la web. Las colecciones de Bruno de `docs/bruno/` tienen los pedidos de ejemplo.

## 10. Monitoreo

- **Estado:** `GET /api/ping` responde 200 si la API está arriba. Render lo puede usar como health check.
- **Logs:** salida estándar del contenedor (panel *Logs* de Render, o la consola en local). Los errores de negocio se registran con su código; las notificaciones de lista de espera se ven como líneas de `LogNotificador`.
- **Tareas programadas:** todos los días a las 00:00 `MembresiaService` marca como `VENCIDO` las membresías vencidas; deja una línea en el log con la cantidad.
- **Métricas:** no hay Actuator, Prometheus ni alertas. El aforo en tiempo real se consulta en `GET /api/v1/sedes/{id}/aforo`.

## 11. Resolución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Connection refused` a `localhost:5432` | PostgreSQL no está levantado | `docker compose up -d`; ver `docker ps` |
| Puerto 5432 ocupado | Hay otro PostgreSQL local | Detenerlo o cambiar `DB_PORT` y el mapeo del compose |
| Login devuelve error de servicio externo | Falta `SUPABASE_SERVICE_ROLE_KEY` o es incorrecta | Definirla en `fz-backend/.env` |
| Login correcto pero 401/403 en todo | El usuario de Supabase no tiene fila en `fz_usr_usuarios` con su `auth_id` | Vincular el `auth_id` (ver SCRUM-130) |
| Error de CORS en el navegador | El origen de la web no está en `CORS_ALLOWED_ORIGINS` | Agregarlo y reiniciar el backend |
| `Schema-validation: missing column` al arrancar en `prod` | La base no tiene el último cambio de entidades | Aplicar el cambio de esquema antes del deploy |
| El QR siempre da "vencido" | Reloj del servidor desfasado o `QR_SECRET` distinto entre instancias | Sincronizar hora (NTP); usar la misma clave |
| La web muestra datos que no están en la base | `VITE_USE_MOCK=true` | Ponerlo en `false` y volver a compilar |
| `./mvnw: Permission denied` | Falta permiso de ejecución | `chmod +x mvnw` |
