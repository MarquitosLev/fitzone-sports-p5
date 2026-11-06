# Guía Práctica de Supabase Auth para Gestión de Usuarios

**Proyecto:** FitZone Sports  
**Entorno Develop de Supabase:** `https://lzpmyoxpcaelgnjycpfz.supabase.co`  
**Módulo:** M1 — Usuarios, Sedes y Autenticación (`com.fitzone.modulo.usuarios`)

Esta guía describe todo lo que necesitas saber y operar en el dashboard de Supabase y en la configuración del backend para el correcto funcionamiento del registro, autenticación y administración de usuarios.

---

## 1. Obtención de la Service-Role Key

El backend necesita permisos de administrador sobre la API GoTrue de Supabase Auth para crear usuarios, enviar invitaciones por correo y sincronizar cambios de credenciales.

1. Ingresá al dashboard de Supabase: [https://supabase.com/dashboard/project/lzpmyoxpcaelgnjycpfz](https://supabase.com/dashboard/project/lzpmyoxpcaelgnjycpfz).
2. En el menú lateral izquierdo, hacé clic en **Project Settings** (ícono de engranaje) > **API**.
3. En la sección **Project API keys**, vas a encontrar dos claves:
   - `anon` `public`: Usada por clientes públicos (Frontend).
   - `service_role` `secret`: **Clave maestra de administración**.
4. Copiá el valor de `service_role`.

> [!CAUTION]
> **REGLA DE SEGURIDAD ESTRICTA:**  
> La clave `service_role` tiene privilegios de superusuario y saltea todas las políticas RLS (Row Level Security).  
> - **NUNCA** la incluyas en el código fuente de Git.  
> - **NUNCA** la expongas en el frontend (`VITE_*`).  
> - Solo debe vivir como variable de entorno segura en el backend.

---

## 2. Configuración de Variables de Entorno en el Backend

El backend lee las siguientes propiedades (definidas en `application.properties`):

```properties
fitzone.supabase.url=${SUPABASE_URL:https://lzpmyoxpcaelgnjycpfz.supabase.co}
fitzone.supabase.service-role-key=${SUPABASE_SERVICE_ROLE_KEY:}
fitzone.supabase.alta-por-email=${SUPABASE_ALTA_POR_EMAIL:true}
fitzone.supabase.invite-redirect-url=${SUPABASE_INVITE_REDIRECT_URL:http://localhost:5173}
```

### En Entorno Local (PowerShell):
Antes de ejecutar `./mvnw spring-boot:run`:
```powershell
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
$env:SUPABASE_ALTA_POR_EMAIL="true" # o "false" según el modo deseado
```

### En IntelliJ IDEA / VS Code:
En la configuración de ejecución de `FzBackendApplication`:
- Environment variables: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...;SUPABASE_ALTA_POR_EMAIL=true`

### En Render (Despliegue de Backend):
1. En el servicio de backend en Render, ingresá a la pestaña **Environment**.
2. Agregá la variable `SUPABASE_SERVICE_ROLE_KEY` con el valor copiado de Supabase.
3. Agregá `SUPABASE_ALTA_POR_EMAIL` con `true` o `false`.

---

## 3. Modo de Alta de Usuarios: Flag `alta-por-email`

El sistema soporta dos modos de creación de usuarios con cuenta (`SOCIO`, `RECEPCIONISTA`, `GERENTE`):

### Modo A: Con Invitación por Email (`fitzone.supabase.alta-por-email=true` - Recomendado / Default)
- **Flujo:** El backend invoca el endpoint de Supabase `POST /auth/v1/invite`.
- **Efecto:** Supabase crea el usuario en `auth.users` y le envía un correo electrónico al usuario con un link de confirmación.
- Al hacer clic en el link recibido, el usuario es redirigido a la aplicación web (según `invite-redirect-url`) para establecer su propia contraseña inicial de forma segura.
- El backend nunca recibe ni procesa contraseñas en texto plano.

### Modo B: Sin Emails / Todo en el Sistema (`fitzone.supabase.alta-por-email=false`)
- **Flujo:** El backend invoca `POST /auth/v1/admin/users` con `email_confirm: true`.
- **Requisito en el Body:** Quien hace el alta (recepcionista o gerente) debe ingresar el campo `password` con un mínimo de 6 caracteres.
- **Efecto:** La cuenta se crea ya verificada de inmediato, sin enviar ningún email externo. El usuario puede iniciar sesión directamente con su email y la contraseña asignada.

> [!NOTE]
> Los usuarios de tipo `EXTERNO` (invitados para reserva de canchas) **nunca** generan cuenta en Supabase Auth (`auth_id = NULL`), independientemente del modo configurado.

---

## 4. Configuración de Emails y Redirecciones en Supabase

Si utilizás el modo con envío de emails (`alta-por-email=true`), configurá lo siguiente en Supabase:

1. **URLs de Redirección:**
   - En el Dashboard de Supabase, andá a **Authentication** > **URL Configuration**.
   - En **Site URL**, colocá la URL base de tu frontend (ej: `http://localhost:5173` en local o la URL de Vercel en producción).
   - En **Redirect URLs**, agregá:
     - `http://localhost:5173/**`
     - `https://*.vercel.app/**`
2. **Plantilla de Correo de Invitación:**
   - En **Authentication** > **Email Templates** > pestaña **Invite user**.
   - Podés personalizar el asunto y cuerpo del mensaje en español. La variable obligatoria del enlace es `{{ .ConfirmationURL }}`.
3. **Límite de Envío de Correos (Rate Limit):**
   - El servidor SMTP incorporado por defecto de Supabase tiene una cuota estricta de **3 o 4 correos por hora**.
   - Si se supera este límite, la API retornará el error `over_email_send_rate_limit` (traducido a HTTP 502 por el backend).
   - Para producción o testing intensivo, podés conectar un proveedor SMTP propio (como Resend, SendGrid o Gmail) en **Authentication** > **SMTP Settings**.

---

## 5. Carga de Semilla del Primer GERENTE

Para poder utilizar los endpoints de la API (que exigen `idOperador` de recepcionista o gerente), se necesita al menos un usuario gerente inicial en el sistema.

### Paso 1: Crear la cuenta en Supabase Auth
1. En el Dashboard de Supabase, ingresá a **Authentication** > **Users**.
2. Hacé clic en **Add user** > **Create user**.
3. Ingresá:
   - Email: `gerente@fitzone.com`
   - Password: `Password123!`
   - Marcá la casilla **Auto Confirm User?** (para que quede confirmado de inmediato).
4. Copiá el `User UID` generado (ej: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### Paso 2: Crear la sede origen e insertar el gerente en la BD
Ejecutá el siguiente script SQL en el SQL Editor de Supabase (o en tu PostgreSQL local):

```sql
-- 1. Crear sede inicial si no existe
INSERT INTO fz_sedes (nombre, aforo_maximo, created_at, updated_at, created_by, updated_by, is_deleted)
VALUES ('Sede Central', 150, NOW(), NOW(), 'system', 'system', false)
ON CONFLICT DO NOTHING;

-- 2. Insertar el gerente inicial vinculado al UID de Supabase
INSERT INTO fz_usr_usuarios (
    auth_id,
    dni,
    nombre,
    apellido,
    email,
    telefono,
    tipo_usuario,
    id_sede,
    created_at,
    updated_at,
    created_by,
    updated_by,
    is_deleted
) VALUES (
    'PEGA_AQUI_EL_UID_DE_SUPABASE'::uuid,
    '00000001',
    'Administrador',
    'Gerente',
    'gerente@fitzone.com',
    '+5491112345678',
    'GERENTE',
    1,
    NOW(),
    NOW(),
    'system',
    'system',
    false
);
```

Con esto, el usuario tendrá `id_usuario = 1` y podrá ser utilizado como `idOperador=1` en las llamadas a la API.

---

## 6. Resolución de Problemas Frecuentes (Troubleshooting)

| Error / Síntoma | Código HTTP | Causa | Solución |
| :--- | :---: | :--- | :--- |
| `Ya existe un usuario con el DNI ...` | **409 Conflict** | DNI repetido en `fz_usr_usuarios`. | Verificar el DNI o editar el usuario existente. |
| `Ya existe una cuenta registrada con ese email` | **409 Conflict** | El email ya existe en `auth.users` de Supabase. | Usar otro email o borrar el usuario previo en Auth > Users. |
| `Supabase Auth no está configurado: falta la variable SUPABASE_SERVICE_ROLE_KEY` | **502 Bad Gateway** | La variable de entorno no fue inyectada al backend. | Configurar `SUPABASE_SERVICE_ROLE_KEY` en el entorno o properties. |
| `Se alcanzó el límite de envío de mails de Supabase` | **502 Bad Gateway** | Límite del SMTP gratuito de Supabase alcanzado. | Configurar SMTP propio o cambiar a `fitzone.supabase.alta-por-email=false`. |
| `Solo recepcionistas o gerentes pueden dar de alta usuarios` | **403 Forbidden** | El `idOperador` corresponde a un SOCIO o EXTERNO. | Enviar un `idOperador` válido de recepcionista o gerente. |
| `Solo un gerente puede dar de alta personal` | **403 Forbidden** | Una recepcionista intentó crear otro recepcionista o gerente. | Dicha acción solo la puede ejecutar un GERENTE. |
