# FitZone Sports (P5 Grupo 5)

Plataforma integral de gestión deportiva y administrativa para cadenas de gimnasios.

---

## 🏛️ Estructura del Proyecto

```text
Integrador/
├── docker-compose.yml             # PostgreSQL 16, backend y frontend en contenedores
├── .github/workflows/ci.yml       # Pipeline de CI: tests, build y cobertura en cada PR
├── docker/initdb/                 # Scripts SQL de inicialización local
├── fz-frontend/                   # Aplicación Web en React 19 + TypeScript + Vite
└── fz-backend/                    # API REST en Java 21 (Spring Boot 3.4 + JPA + Postgres)
```

---

## 🐳 Todo el sistema con Docker

En la raíz del proyecto (`Integrador/`):
```bash
docker compose up --build
```
* **Frontend:** `http://localhost:5173`
* **API:** `http://localhost:8080/api` (Swagger en `/api/swagger-ui`)
* **Base de datos:** `localhost:5432`, con los datos de prueba de [docs/DATOS_DE_PRUEBA.md](docs/DATOS_DE_PRUEBA.md)

El login usa Supabase Auth y necesita la clave de servicio. Se carga en un archivo `.env` en la raíz (ignorado por git), que `docker compose` lee solo:
```bash
SUPABASE_SERVICE_ROLE_KEY=<clave de servicio del proyecto fitzone-db-dev>
```
Sin la clave, el sistema levanta y las pantallas públicas funcionan, pero no se puede iniciar sesión.

---

## 🚀 Guía Rápida para Desarrolladores

### 1. Levantar Base de Datos Local (Docker)
En la raíz del proyecto (`Integrador/`), solo el servicio de la base (el backend y el front se corren aparte):
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
* Healthcheck: `http://localhost:8080/api/health`
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

## 🧪 Pruebas, Cobertura e Integración Continua

```bash
cd fz-backend && ./mvnw verify                  # tests + reporte JaCoCo en target/site/jacoco/
cd fz-frontend && npm run coverage              # tests + reporte V8 en coverage/
cd fz-frontend && npm run build                 # chequeo de tipos + build de producción
```

Cada Pull Request hacia `develop` corre esos mismos pasos en GitHub Actions y publica los dos reportes de cobertura como artefactos descargables.

| Proyecto | Pruebas | Cobertura (2026-11-07) |
| :-- | :-- | :-- |
| Backend | 248 en verde | 64 % instrucciones · 47 % ramas |
| Frontend | 353 en verde | 69 % líneas · 64 % ramas |

Etapas, decisiones de diseño y cómo leer los reportes: [docs/PIPELINE_CI.md](docs/PIPELINE_CI.md).

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
