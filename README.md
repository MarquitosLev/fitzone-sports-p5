# FitZone Sports (P5 Grupo 2)

Proyecto de plataforma para la gestión deportiva y administrativa de cadena de gimnasios (FitZone Sports).

## Estructura del Proyecto

```text
Integrador/
├── fz-frontend/     # Aplicación Web en ReactJS (Vite)
└── fz-backend/      # API REST en Java (Spring Boot)
```

## Requisitos Previos

- **Java:** JDK 21+
- **Node.js:** v20+ o v22+ y npm

---

## Ejecución en Local

### Backend (Spring Boot)
```bash
cd fz-backend
./mvnw spring-boot:run
```
Por defecto escucha en `http://localhost:8080`.

### Frontend (React + Vite)
```bash
cd fz-frontend
npm install
npm run dev
```
Por defecto escucha en `http://localhost:5173`.
