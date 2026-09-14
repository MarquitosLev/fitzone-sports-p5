# FitZone Sports (P5 Grupo 2)

Plataforma integral de gestión deportiva y administrativa para cadenas de gimnasios.

---

## 🏛️ Estructura del Proyecto

```text
Integrador/
├── docker-compose.yml             # PostgreSQL 16 local para desarrollo
├── docker/initdb/                 # Scripts SQL de inicialización local
├── fz-frontend/                   # Aplicación Web en React 19 + TypeScript + Vite
└── fz-backend/                    # API REST en Java 21 (Spring Boot 3.4 + JPA + Postgres)
```

---

## 🚀 Guía Rápida para Desarrolladores

### 1. Levantar Base de Datos Local (Docker)
En la raíz del proyecto (`Integrador/`):
```bash
docker compose up -d
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

## 🛡️ Flujo de Ramas y Trabajo en Equipo

* **Rama de desarrollo:** `develop`
* **Rama de producción:** `main`
* Cada funcionalidad se desarrolla en una rama propia que se desprende de `develop`:
  ```bash
  git checkout develop
  git pull origin develop
  git checkout -b feature/nombre-funcionalidad
  ```
* Al finalizar, se abre un **Pull Request (PR)** hacia `develop`.
