# FitZone Sports — Datos de Prueba para Integracion (SCRUM-94)

**Ticket Jira:** [SCRUM-94](https://integrador-p5.atlassian.net/browse/SCRUM-94) — *Backend - Datos de prueba para la integracion*  
**Objetivo:** Disponer del mismo conjunto de datos base en todos los entornos para probar la integracion de los 5 modulos de punta a punta ([SCRUM-105](https://integrador-p5.atlassian.net/browse/SCRUM-105)) sin necesidad de cargar datos a mano.

---

## 1. Credenciales y Usuarios de Prueba

Todos los usuarios de prueba comparten la contrasena inicial: `password123`.

| Rol | Correo Electronico | Contrasena | DNI | Sede Asignada | Estado de Membresia | Caso de Prueba Principal |
|---|---|---|---|---|---|---|
| **GERENTE** | `gerente@fitzone.com` | `password123` | `00000001` | Sede Central (1) | -- | ABM de personal, planes, roles y canchas |
| **RECEPCIONISTA** | `recepcionista@fitzone.com` | `password123` | `00000002` | Sede Central (1) | -- | Alta de socios, cobros, validacion de ingresos QR y aforo |
| **SOCIO (Al dia)** | `socio@fitzone.com` | `password123` | `00000003` | *Global (null)* | **ACTIVO** (vence en 25 dias) | Reserva de clases, descuento -15% en canchas, pase QR |
| **SOCIO (Moroso)** | `socio.vencido@fitzone.com` | `password123` | `00000005` | *Global (null)* | **VENCIDO** (vencida hace 10 dias) | **RN-03**: Bloqueo de clases/descuentos; flujo de renovacion |
| **EXTERNO** | `externo@fitzone.com` | `password123` | `00000004` | *Global (null)* | -- | Checkout de invitado para alquiler de canchas sin descuento |

---

## 2. Catalogo de Sedes y Planes

### Sedes de la Red
1. **Sede Central** (ID: 1) -- Aforo Maximo: 150 personas. (Ubicacion: Palermo)
2. **Sede Norte** (ID: 2) -- Aforo Maximo: 100 personas. (Ubicacion: Belgrano)

### Planes de Membresia
1. **Plan Mensual** (ID: 1) -- Precio Base: `$15.000` (Duracion: 1 mes)
2. **Plan Trimestral** (ID: 2) -- Precio Base: `$40.000` (Duracion: 3 meses)
3. **Plan Anual VIP** (ID: 3) -- Precio Base: `$140.000` (Duracion: 12 meses)

---

## 3. Canchas y Clases Semilla

### Canchas Deportivas
- **Cancha Futbol 5 - Palermo** (Sede Central): `$20.000/hora`, Operativa (`enMantenimiento = false`).
- **Cancha Paddle 1 (Mantenimiento)** (Sede Central): `$15.000/hora`, En Mantenimiento (`enMantenimiento = true`, no permite reservas).
- **Cancha Tenis - Belgrano** (Sede Norte): `$25.000/hora`, Operativa.

### Clases Grupales
- **Spinning Pro** (Sede Central): Manana 18:00 hs, Duracion: 60 min, Cupo: 20/20 disponibles.
- **Yoga Integral (Completa)** (Sede Central): Pasado manana 10:00 hs, Duracion: 45 min, Cupo: 0/1 disponible (Completa -- permite probar Lista de Espera).

---

## 4. Sincronizacion Automatica de auth_id con Supabase Auth (SCRUM-130)

### El problema del auth_id provisorio

Al inicializar la base de datos localmente (via `01-init-data.sql` o `DataInitializer.java`), los usuarios del seed se crean con un `auth_id` generado aleatoriamente (`gen_random_uuid()` / `UUID.randomUUID()`). Dicho identificador local no coincide con el UID real que Supabase Auth asigna a la cuenta al registrarla en su servicio de autenticacion.

### Mecanismo de vinculacion automatica en dos capas

Para permitir que el equipo inicie sesion sin requerir ajustes manuales en la base de datos, el backend implementa una resolucion automatica por correo electronico:

1. **Capa 1 -- Endpoint de login (`AuthController.java`):**
   Al invocar `POST /auth/login`, el backend autentica las credenciales contra Supabase Auth y obtiene el `authId` real. Si el usuario local registrado tiene un `authId` diferente o nulo pero coincide su `email` (insensible a mayusculas/minusculas), el backend actualiza su `auth_id` con el valor definitivo en PostgreSQL y lo persiste.

2. **Capa 2 -- Filtro de seguridad JWT (`JwtAuthConverter.java` y `UsuarioActual.java`):**
   Cuando el cliente envia peticiones HTTP con la cabecera `Authorization: Bearer <token>`, `JwtAuthConverter` busca al usuario primero por el `sub` del token (ruta rapida). Si no lo encuentra, extrae el claim `email` del JWT, localiza al usuario por `email` (insensible a mayusculas/minusculas), actualiza su `auth_id` y le asigna sus roles de seguridad (`ROLE_SOCIO`, `ROLE_GERENTE`, etc.). A su vez, `UsuarioActual` cuenta con el mismo mecanismo de resolucion como defensa en profundidad.

### Limpieza de volumenes viejos en Docker

Si en un entorno local previo persiste un usuario desactualizado u obsoleto como `lucas.socio@fitzone.com` (debido a que `01-init-data.sql` utiliza `ON CONFLICT DO NOTHING` y no sobrescribe volumenes de PostgreSQL ya creados), se debe reiniciar el volumen de base de datos desde cero ejecutando:

```bash
docker compose down -v
docker compose up -d
```

---

## 5. Como Iniciar y Cargar los Datos

### Opcion A: Automatico con Spring Boot (Recomendado en Local)
1. Iniciar la base de datos con Docker:
   ```bash
   docker compose up -d
   ```
2. Iniciar el backend:
   ```bash
   cd fz-backend
   ./mvnw spring-boot:run
   ```
   *El componente `DataInitializer` verifica la base y si faltan los registros los crea automaticamente al arrancar.*

### Opcion B: Inicializacion pura en Docker
El archivo `docker-compose.yml` mapea la carpeta `./docker/initdb` hacia `/docker-entrypoint-initdb.d`. En la primera inicializacion del contenedor, PostgreSQL ejecuta automaticamente `01-init-data.sql`.

---

## 6. Pruebas de Flujos Principales ([SCRUM-105](https://integrador-p5.atlassian.net/browse/SCRUM-105))

1. **Flujo 1 (Membresias y Acceso)**:
   - Iniciar sesion como `recepcionista@fitzone.com`.
   - Ir a `/membresias`, buscar por DNI `00000005` (`socio.vencido@fitzone.com`).
   - Renovar la membresia (permite cambiar a Plan Trimestral).
   - Verificar que su estado pasa a `ACTIVO`.
2. **Flujo 2 (Regla de Cancha en Mantenimiento)**:
   - Intentar reservar la *Cancha Paddle 1*. El sistema no debe permitir tomar turnos por mantenimiento activo.
3. **Flujo 3 (Lista de Espera en Clases)**:
   - Iniciar sesion como `socio@fitzone.com`.
   - Ir a `/clases`, localizar la clase *Yoga Integral (Completa)* y anotarse en la lista de espera.
