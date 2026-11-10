# FitZone Sports — Datos de Prueba para Integración (SCRUM-94)

**Ticket Jira:** [SCRUM-94](https://integrador-p5.atlassian.net/browse/SCRUM-94) — *Backend - Datos de prueba para la integración*  
**Objetivo:** Disponer del mismo conjunto de datos base en todos los entornos para probar la integración de los 5 módulos de punta a punta ([SCRUM-105](https://integrador-p5.atlassian.net/browse/SCRUM-105)) sin necesidad de cargar datos a mano.

---

## 1. Credenciales y Usuarios de Prueba

Todos los usuarios de prueba comparten la contraseña inicial: `password123`.

| Rol | Correo Electrónico | Contraseña | DNI | Sede Asignada | Estado de Membresía | Caso de Prueba Principal |
|---|---|---|---|---|---|---|
| **GERENTE** | `gerente@fitzone.com` | `password123` | `00000001` | Sede Central (1) | — | ABM de personal, planes, roles y canchas |
| **RECEPCIONISTA** | `recepcionista@fitzone.com` | `password123` | `00000002` | Sede Central (1) | — | Alta de socios, cobros, validación de ingresos QR y aforo |
| **SOCIO (Al día)** | `socio@fitzone.com` | `password123` | `00000003` | *Global (null)* | **ACTIVO** (vence en 25 días) | Reserva de clases, descuento -15% en canchas, pase QR |
| **SOCIO (Moroso)** | `socio.vencido@fitzone.com` | `password123` | `00000005` | *Global (null)* | **VENCIDO** (vencida hace 10 días) | **RN-03**: Bloqueo de clases/descuentos; flujo de renovación |
| **EXTERNO (invitado)** | `externo@fitzone.com` | — (sin cuenta, no inicia sesión) | `00000004` | *Global (null)* | — | Invitado sin cuenta: reserva y paga canchas en `/canchas` sin sesión. Para probar que se reutiliza por DNI, reservá como invitado con el DNI `00000004`. |

---

## 2. Catálogo de Sedes y Planes

### Sedes de la Red
1. **Sede Central** (ID: 1) — Aforo Máximo: 150 personas. (Ubicación: Palermo)
2. **Sede Norte** (ID: 2) — Aforo Máximo: 100 personas. (Ubicación: Belgrano)

### Planes de Membresía
1. **Plan Mensual** (ID: 1) — Precio Base: `$15.000` (Duración: 1 mes)
2. **Plan Trimestral** (ID: 2) — Precio Base: `$40.000` (Duración: 3 meses)
3. **Plan Anual VIP** (ID: 3) — Precio Base: `$140.000` (Duración: 12 meses)

---

## 3. Canchas y Clases Semilla

### Canchas Deportivas
- **Cancha Fútbol 5 - Palermo** (Sede Central): `$20.000/hora`, Operativa (`enMantenimiento = false`).
- **Cancha Paddle 1 (Mantenimiento)** (Sede Central): `$15.000/hora`, En Mantenimiento (`enMantenimiento = true`, no permite reservas).
- **Cancha Tenis - Belgrano** (Sede Norte): `$25.000/hora`, Operativa.

### Clases Grupales
- **Spinning Pro** (Sede Central): Mañana 18:00 hs, Duración: 60 min, Cupo: 20/20 disponibles.
- **Yoga Integral (Completa)** (Sede Central): Pasado mañana 10:00 hs, Duración: 45 min, Cupo: 0/1 disponible (Completa — permite probar Lista de Espera).

---

## 4. Sincronización Automática de auth_id con Supabase Auth (SCRUM-130)

### El problema de los usuarios semilla sin vincular

Al inicializar la base de datos localmente (vía `01-init-data.sql` o `DataInitializer.java`), los usuarios del seed nacen con `auth_id = null`. Esto evita UUIDs aleatorios locales que no coinciden con el UID real que Supabase Auth genera al registrar cada cuenta en su servicio de autenticación.

### Mecanismo de vinculación TOFU (Trust On First Use)

Para permitir que el equipo inicie sesión sin requerir ajustes manuales en la base de datos ni vulnerar la seguridad de las cuentas existentes, el backend implementa un enlace por correo electrónico estrictamente protegido:

1. **Capa 1 — Endpoint de login (`AuthController.java`):**
   Al invocar `POST /auth/login`, el backend autentica contra Supabase Auth y recibe el `authId` real.
   - Si el usuario ya está vinculado por `authId`, se retorna inmediatamente.
   - Si no está vinculado por `authId`, busca por `email` (insensible a mayúsculas/minúsculas).
   - **Regla TOFU:** solo se vincula si el usuario local tiene `auth_id == null` y `tipoUsuario != EXTERNO`. Si ya tenía un `auth_id` asignado diferente, se rechaza la operación para prevenir ataques de sustitución de identidad (Account Takeover).
   - Los usuarios `EXTERNO` no pueden iniciar sesión (son invitados sin credenciales).

2. **Capa 2 — Filtro de seguridad JWT (`JwtAuthConverter.java`):**
   Cuando el cliente envía peticiones con `Authorization: Bearer <token>`, `JwtAuthConverter` busca al usuario por el `sub` del token.
   - Si no lo encuentra, busca por el claim `email`.
   - Si el usuario local tiene `auth_id == null` y no es `EXTERNO`, enlaza el `auth_id` de forma definitiva y persiste el cambio (primer login TOFU).
   - Si el usuario ya posee un `auth_id` distinto o es `EXTERNO`, no asigna autoridades para impedir accesos indebidos.

### Limpieza de volúmenes viejos en Docker

Si en un entorno local previo persiste un usuario desactualizado u obsoleto como `lucas.socio@fitzone.com` (debido a que `01-init-data.sql` utiliza `ON CONFLICT DO NOTHING` y no sobrescribe volúmenes de PostgreSQL ya creados), se debe reiniciar el volumen de base de datos desde cero ejecutando:

```bash
docker compose down -v
docker compose up -d
```

---

## 5. Cómo Iniciar y Cargar los Datos

### Opción A: Automático con Spring Boot (Recomendado en Local)
1. Iniciar la base de datos con Docker:
   ```bash
   docker compose up -d
   ```
2. Iniciar el backend:
   ```bash
   cd fz-backend
   ./mvnw spring-boot:run
   ```
   *El componente `DataInitializer` verifica la base y si faltan los registros los crea automáticamente al arrancar.*

### Opción B: Inicialización pura en Docker
El archivo `docker-compose.yml` mapea la carpeta `./docker/initdb` hacia `/docker-entrypoint-initdb.d`. En la primera inicialización del contenedor, PostgreSQL ejecuta automáticamente `01-init-data.sql`.

---

## 6. Pruebas de Flujos Principales ([SCRUM-105](https://integrador-p5.atlassian.net/browse/SCRUM-105))

1. **Flujo 1 (Membresías y Acceso)**:
   - Iniciar sesión como `recepcionista@fitzone.com`.
   - Ir a `/membresias`, buscar por DNI `00000005` (`socio.vencido@fitzone.com`).
   - Renovar la membresía (permite cambiar a Plan Trimestral).
   - Verificar que su estado pasa a `ACTIVO`.
2. **Flujo 2 (Regla de Cancha en Mantenimiento)**:
   - Intentar reservar la *Cancha Paddle 1*. El sistema no debe permitir tomar turnos por mantenimiento activo.
3. **Flujo 3 (Lista de Espera en Clases)**:
   - Iniciar sesión como `socio@fitzone.com`.
   - Ir a `/clases`, localizar la clase *Yoga Integral (Completa)* y anotarse en la lista de espera.
