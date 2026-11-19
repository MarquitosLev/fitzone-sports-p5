# FitZone Sports — Equipo 05

## 1. Qué es

FitZone Sports es una plataforma web para administrar una cadena de gimnasios con varias sedes. Los socios pagan su membresía, reservan clases grupales y canchas, y entran al gimnasio mostrando un código QR desde el celular, que funciona incluso si se corta internet en la sede. La recepción valida los ingresos y controla cuánta gente hay en su sede, y el gerente central administra sedes, personal, planes y canchas de toda la cadena. Quien no es socio puede reservar y pagar una cancha sin crear una cuenta.

## 2. Equipo

| Integrante | Rol | Usuario de Git |
| :-- | :-- | :-- |
| Leiva, Marcos Joel | P1 | [MarquitosLev](https://github.com/MarquitosLev) |
| Aquino, Benjamín | P2 | [Benjamim023](https://github.com/Benjamim023) |
| Bravo, Agustín | P2 | [agusbravo09](https://github.com/agusbravo09) |
| Chang, Maximiliano | P3 | [MaxiTonoto](https://github.com/MaxiTonoto) |
| Coppes, Matías | P3 | [maticoppes](https://github.com/maticoppes) |
| Pérez, Luciano | P3 | [cirez7](https://github.com/cirez7) |

## 3. Puesta en marcha

Requisitos: Git y Docker Desktop.

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/MarquitosLev/fitzone-sports-p5.git
   cd fitzone-sports-p5
   ```
2. Crear el archivo de variables:
   ```bash
   cp .env.example .env
   ```
3. Completar `SUPABASE_SERVICE_ROLE_KEY` en `.env`. Sin esa clave el sistema levanta y las pantallas públicas funcionan, pero no se puede iniciar sesión.
4. Levantar base, API y web:
   ```bash
   docker compose up --build
   ```
5. Abrir `http://localhost:5173`. La API queda en `http://localhost:8080/api` (Swagger en `/api/swagger-ui`, estado en `/api/ping`).

Las variables están explicadas en [.env.example](.env.example) y el paso a paso completo, en el [manual de instalación y operación](docs/manuales/manual-instalacion-operacion.md).

### Versión publicada

También se puede probar sin instalar nada, con los mismos usuarios de la sección 4. Se publica desde `main`.

| Qué | Dónde |
| :-- | :-- |
| Aplicación web (Vercel) | [fitzone-sports-p5.vercel.app](https://fitzone-sports-p5.vercel.app) |
| API (Render) | [fitzone-backend-dev.onrender.com/api](https://fitzone-backend-dev.onrender.com/api/ping) · [Swagger](https://fitzone-backend-dev.onrender.com/api/swagger-ui) |

La API está en el plan gratuito de Render: si estuvo sin uso, la primera respuesta tarda más de un minuto mientras se despierta.

## 4. Usuarios de prueba

Los carga la semilla al arrancar el backend. Todos usan la contraseña `password123`. Detalle y casos de prueba en [docs/DATOS_DE_PRUEBA.md](docs/DATOS_DE_PRUEBA.md).

| Rol | Correo | Contraseña | Para probar |
| :-- | :-- | :-- | :-- |
| Gerente central | `gerente@fitzone.com` | `password123` | Sedes, personal, planes, canchas y clases de todas las sedes |
| Recepcionista (Sede Central) | `recepcionista@fitzone.com` | `password123` | Alta de socios, cobros, control de acceso y aforo |
| Socio al día | `socio@fitzone.com` | `password123` | Pase QR, clases, canchas con descuento y pagos |
| Socio con la cuota vencida | `socio.vencido@fitzone.com` | `password123` | RN-03: paga las canchas a precio de externo y no puede reservar clases |
| Cliente externo | — | Sin cuenta | Reservar y pagar una cancha desde `/canchas` sin iniciar sesión (ADR-018) |

## 5. Documentación

| Tema | Dónde |
| :-- | :-- |
| Decisiones de arquitectura (ADR-001 a ADR-020) | [docs/adr/](docs/adr/README.md) |
| Diagramas C4, UML, DER, despliegue y pipeline (fuente `.mmd` y exportación) | [docs/diagramas/](docs/diagramas/README.md) |
| Manual de usuario, por rol | [docs/manuales/manual-usuario.md](docs/manuales/manual-usuario.md) |
| Manual de instalación y operación | [docs/manuales/manual-instalacion-operacion.md](docs/manuales/manual-instalacion-operacion.md) |
| Manual técnico | [docs/manuales/manual-tecnico.md](docs/manuales/manual-tecnico.md) |
| Bitácoras individuales | [docs/bitacoras/](docs/bitacoras/) |
| Planificación: plan, cronograma, trazabilidad, seguimiento, riesgos y tablero | [docs/planificacion/](docs/planificacion/README.md) |
| Evidencia de los requisitos no funcionales | [docs/rnf/](docs/rnf/README.md) |
| Dossier de entrega | [docs/entregables/](docs/entregables/README.md) |
| Contrato OpenAPI exportado | [fz-backend/swagger.json](fz-backend/swagger.json) |
| Pipeline de CI | [docs/PIPELINE_CI.md](docs/PIPELINE_CI.md) |
| Colecciones de Bruno por módulo | [docs/bruno/](docs/bruno/) |

## 6. Pruebas y cobertura

| Proyecto | Pruebas | Cobertura (2026-11-19) |
| :-- | :-- | :-- |
| Backend (JUnit 5 + Mockito, JaCoCo) | 357 en verde | 73,8 % de líneas · 72,8 % de instrucciones · 57,4 % de ramas |
| Frontend (Vitest + Testing Library, V8) | 483 en verde | 72,7 % de líneas · 70,1 % de sentencias · 67,2 % de ramas |

El umbral declarado es 60 % de líneas en cada proyecto ([ADR-007](docs/adr/ADR-007-estrategia-de-pruebas.md)). Para correr la suite y generar los reportes:

```bash
cd fz-backend && ./mvnw verify       # pruebas + reporte JaCoCo en target/site/jacoco/
cd fz-frontend && npm run coverage   # pruebas + reporte V8 en coverage/
```

Cada Pull Request hacia `develop` corre las dos suites y el build en GitHub Actions y publica los reportes de cobertura. Etapas y cómo leer los reportes: [docs/PIPELINE_CI.md](docs/PIPELINE_CI.md).

---

## Estructura del repositorio

```text
fitzone-sports-p5/
├── README.md, LICENSE, .env.example, docker-compose.yml
├── fz-backend/      # API REST: Java 21, Spring Boot 3.4, JPA y PostgreSQL
│   ├── src/main/java/com/fitzone/modulo/   # usuarios, gimnasio (acceso), clases, canchas, pagos
│   ├── src/main/java/com/fitzone/core/     # seguridad, configuración, errores y entidades comunes
│   ├── src/test/                            # pruebas unitarias y de controladores
│   └── swagger.json                         # contrato OpenAPI exportado
├── fz-frontend/     # Web: React 19, TypeScript y Vite (pages, components, services, context)
├── docker/initdb/   # Scripts SQL de inicialización local
└── docs/            # adr, diagramas, bitacoras, manuales, planificacion, rnf, entregables
```

Los nombres siguen las convenciones de Maven (`src/main` y `src/test`) y de Vite. Equivalencia con la estructura del punto 4 de los lineamientos: `backend/` es `fz-backend/`, `frontend/` es `fz-frontend/`, el portal del socio y la consola de administración están en `fz-frontend/src/pages` según el rol, y el estado global está en `fz-frontend/src/context`.

## Desarrollo sin Docker

```bash
docker compose up -d postgres                 # sólo la base
cd fz-backend && ./mvnw spring-boot:run       # API en http://localhost:8080/api (perfil local)
cd fz-frontend && npm install && npm run dev  # web en http://localhost:5173
```

## Uso de bibliotecas y asistentes de IA

Las bibliotecas de terceros están declaradas en `fz-backend/pom.xml` y `fz-frontend/package.json`. El equipo usó asistentes de inteligencia artificial durante el desarrollo, para escribir y revisar código, pruebas y documentación, con las reglas de [docs/AI_DEVELOPMENT_GUIDE.md](docs/AI_DEVELOPMENT_GUIDE.md). Cada cambio pasó por revisión de un integrante en su Pull Request.

## Licencia

[MIT](LICENSE). Trabajo Integrador Final de Programación V, Licenciatura en Sistemas, FCAD-UNER, 2026.
