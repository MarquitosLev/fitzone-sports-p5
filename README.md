# FitZone Sports (P5 Grupo 5)

FitZone Sports es una plataforma web para administrar una cadena de gimnasios con varias sedes. Los socios pagan su membresía, reservan clases grupales y canchas, y entran al gimnasio mostrando un código QR que funciona incluso sin internet. La recepción valida los ingresos y controla el aforo de su sede, y el gerente central administra sedes, personal, planes y canchas. Los clientes externos pueden reservar y pagar una cancha sin crear una cuenta.

**En línea:** frontend en Vercel (`fitzone-sports-p5`) y API en [fitzone-backend-dev.onrender.com/api](https://fitzone-backend-dev.onrender.com/api/ping), publicados desde `main`. La API del plan gratuito tarda más de un minuto en despertar.

---

## 👥 Equipo

| Integrante | Rol | Usuario de Git |
| :-- | :-- | :-- |
| Leiva, Marcos Joel | P1 | [MarquitosLev](https://github.com/MarquitosLev) |
| Aquino, Benjamín | P2 | [Benjamim023](https://github.com/Benjamim023) |
| Bravo, Agustín | P2 | [agusbravo09](https://github.com/agusbravo09) |
| Chang, Maximiliano | P3 | [MaxiTonoto](https://github.com/MaxiTonoto) |
| Coppes, Matías | P3 | [maticoppes](https://github.com/maticoppes) |
| Pérez, Luciano | P3 | [cirez7](https://github.com/cirez7) |

---

## ⚡ Puesta en marcha

Requisitos: Git y Docker Desktop.

```bash
git clone https://github.com/MarquitosLev/fitzone-sports-p5.git
cd fitzone-sports-p5
cp .env.example .env        # completar SUPABASE_SERVICE_ROLE_KEY para poder iniciar sesión
docker compose up --build
```

Abrir `http://localhost:5173`. La API queda en `http://localhost:8080/api` (Swagger en `/api/swagger-ui`, healthcheck en `/api/ping`) y la base en `localhost:5432`.

Sin la clave de servicio de Supabase el sistema levanta y las pantallas públicas funcionan (grilla de canchas y reserva como invitado), pero no se puede iniciar sesión. Las variables están explicadas en [.env.example](.env.example) y el paso a paso completo, en el [manual de instalación y operación](docs/manuales/manual-instalacion-operacion.md).

---

## 🔑 Usuarios de prueba

Los carga la semilla al arrancar el backend con el perfil `local`. Detalle y casos de prueba en [docs/DATOS_DE_PRUEBA.md](docs/DATOS_DE_PRUEBA.md).

| Rol | Correo | Contraseña | Para probar |
| :-- | :-- | :-- | :-- |
| Gerente central | `gerente@fitzone.com` | `password123` | Sedes, personal, planes, canchas y clases de todas las sedes |
| Recepcionista (Sede Central) | `recepcionista@fitzone.com` | `password123` | Alta de socios, cobros, control de acceso y aforo |
| Socio al día | `socio@fitzone.com` | `password123` | Pase QR, clases, canchas con descuento, pagos |
| Socio moroso | `socio.vencido@fitzone.com` | `password123` | RN-03: paga canchas a precio externo y no reserva clases |
| Cliente externo | — | sin cuenta | Reservar y pagar una cancha desde `/canchas` sin iniciar sesión |

---

## 📚 Documentación

| Tema | Dónde |
| :-- | :-- |
| Decisiones de arquitectura (ADR-001 a ADR-020) | [docs/adr/](docs/adr/README.md) |
| Diagramas C4, DER, despliegue y pipeline (fuente `.mmd` + `.svg`) | [docs/diagramas/](docs/diagramas/README.md) |
| Manual de usuario, por rol | [docs/manuales/manual-usuario.md](docs/manuales/manual-usuario.md) |
| Manual de instalación y operación | [docs/manuales/manual-instalacion-operacion.md](docs/manuales/manual-instalacion-operacion.md) |
| Manual técnico | [docs/manuales/manual-tecnico.md](docs/manuales/manual-tecnico.md) |
| Bitácoras individuales | [docs/bitacoras/](docs/bitacoras/) |
| Evidencia de los requisitos no funcionales | [docs/rnf/](docs/rnf/README.md) |
| Dossier de entrega | [docs/entregables/](docs/entregables/README.md) |
| Contrato OpenAPI exportado | [fz-backend/swagger.json](fz-backend/swagger.json) |
| Pipeline de CI | [docs/PIPELINE_CI.md](docs/PIPELINE_CI.md) |
| Colecciones de Bruno por módulo | [docs/bruno/](docs/bruno/) |

---

## 🧪 Pruebas y cobertura

| Proyecto | Pruebas | Cobertura (2026-11-19) |
| :-- | :-- | :-- |
| Backend (JUnit 5 + Mockito, JaCoCo) | 357 en verde | 73,8 % líneas · 72,8 % instrucciones · 57,4 % ramas |
| Frontend (Vitest + Testing Library, V8) | 483 en verde | 72,7 % líneas · 70,1 % sentencias · 67,2 % ramas |

```bash
cd fz-backend && ./mvnw verify                  # tests + reporte JaCoCo en target/site/jacoco/
cd fz-frontend && npm run coverage              # tests + reporte V8 en coverage/
cd fz-frontend && npm run build                 # chequeo de tipos + build de producción
```

Cada Pull Request hacia `develop` corre esos mismos pasos en GitHub Actions y publica los dos reportes de cobertura como artefactos descargables. Etapas, decisiones de diseño y cómo leer los reportes: [docs/PIPELINE_CI.md](docs/PIPELINE_CI.md).

---

## 🏛️ Estructura del Proyecto
```text
fitzone-sports-p5/
├── docker-compose.yml             # PostgreSQL 16, backend y frontend en contenedores
├── .env.example                   # Variables de entorno, sin valores reales
├── .github/workflows/ci.yml       # Pipeline de CI: tests, build y cobertura en cada PR
├── docker/initdb/                 # Scripts SQL de inicialización local
├── fz-frontend/                   # Aplicación Web en React 19 + TypeScript + Vite
└── fz-backend/                    # API REST en Java 21 (Spring Boot 3.4 + JPA + Postgres)
```

---

## 🚀 Guía Rápida para Desarrolladores

### 1. Levantar Base de Datos Local (Docker)
En la raíz del proyecto, solo el servicio de la base (el backend y el front se corren aparte):
```bash
docker compose up -d postgres
```
* **Host:** `localhost`
* **Puerto:** `5432`
* **Base de datos:** `fitzone_db`
* **Usuario:** `fitzone_user`
* **Contraseña:** `fitzone_password`

Para detener el contenedor:
```bash
docker compose down
```

---

### 2. Levantar el Backend (`fz-backend`)
```bash
cd fz-backend
./mvnw spring-boot:run
```
* El servidor iniciará en: `http://localhost:8080/api`
* Healthcheck: `http://localhost:8080/api/ping`
* Perfil activo por defecto: `local` (usa PostgreSQL en Docker).

---

### 3. Levantar el Frontend (`fz-frontend`)
```bash
cd fz-frontend
npm install
npm run dev
```
* Disponible en: `http://localhost:5173`

---

## 🛡️ Flujo de Ramas y Trabajo en Equipo (Jira GitFlow)

* **Rama de desarrollo e integración:** `develop`
* **Rama de producción:** `main`
* **Nomenclatura de ramas:** Se utiliza estrictamente el código del ticket de Jira asignado (ej: `SCRUM-54`, `SCRUM-29`).
* **Flujo de trabajo:**
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b SCRUM-<NUMERO>
  ```
* Al finalizar el desarrollo y verificar los tests, se abre un **Pull Request (PR)** hacia `develop`. El pipeline de CI valida el PR automáticamente; se mergea con el check en verde.
* **Mensajes de Commit:**
  `feat(scope): [SCRUM-26] descripcion concisa del cambio`

---

## 📄 Licencia

[MIT](LICENSE). Trabajo Integrador Final de Programación V, Licenciatura en Sistemas, FCAD-UNER, 2026.
