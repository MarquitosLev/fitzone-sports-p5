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
| **EXTERNO** | `externo@fitzone.com` | `password123` | `00000004` | *Global (null)* | — | Checkout de invitado para alquiler de canchas sin descuento |

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
- **Yoga Integral (Completa)** (Sede Central): Pasado mañana 10:00 hs, Duración: 45 min, Cupo: 0/1 disponible (**Completa** — permite probar Lista de Espera).

---

## 4. Cómo Iniciar y Cargar los Datos

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

## 5. Pruebas de Flujos Principales ([SCRUM-105](https://integrador-p5.atlassian.net/browse/SCRUM-105))

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
