# ADR-008 — Despliegue con Docker, Render y Vercel, y reversión por Git

- **Estado:** Aceptado
- **Fecha:** 2026-09-14
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (redacción: Leiva, Marcos Joel)
- **Sprint:** 3

## Contexto
Necesitábamos tres cosas: (1) que cualquier integrante, y la cátedra, levantara el sistema en local con un comando; (2) un entorno en la nube para probar integrado; (3) poder volver atrás si un despliegue rompía algo. El presupuesto era cero, así que solo entraban planes gratuitos. La rama `develop` integra el trabajo diario, y `main` se reservó para publicar cuando hubiera un MVP. Base y autenticación ya estaban en Supabase (ADR-002, ADR-010).

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| VPS propio (máquina virtual) con Docker Compose | Control total; mismo compose en local y en la nube | Hay que administrar el servidor, TLS, actualizaciones y backups; no es gratis | Costo y carga operativa |
| Kubernetes (gestionado) | Escalado y rollouts nativos | Muy por encima de la escala del proyecto; costo | Sobredimensionado |
| Heroku / Railway / Fly.io para todo | PaaS simple | Planes gratuitos discontinuados o con crédito limitado | Sin plan gratuito estable al decidir |
| Todo en Vercel (front + funciones serverless) | Un solo proveedor | El backend Spring no corre como funciones (ver ADR-001) | Incompatible con el backend elegido |
| **Docker local, backend en Render (imagen Docker), frontend en Vercel, base en Supabase** | Plan gratuito en los tres; despliegue automático al hacer push; previews de Vercel por rama | Render free duerme el servicio y tarda más de un minuto en despertar; tres consolas distintas | — |

## Decisión
Vamos a contenerizar con Docker: el backend tiene un `Dockerfile` multi-etapa (build con `eclipse-temurin:21-jdk` y ejecución con `21-jre-alpine`), y `docker-compose.yml` levanta PostgreSQL 16 con datos iniciales. En la nube, Render (`fitzone-backend-dev`) construye la imagen del backend, Vercel (`fitzone-sports-p5`) publica el frontend con previews por rama, y Supabase aloja la base y el Auth. Los dos servicios siguen `develop`, y al publicar el MVP se apuntan a `main`. Para revertir se hace `git revert` del merge en la rama desplegada, o se usa la acción de redeploy o rollback de un despliegue anterior en Render y Vercel. Lo decidió poder tener todo sin costo y con despliegue automático.

## Consecuencias
- **Positivas:** un `git push` despliega solo. Cada PR tiene su preview en Vercel. Las configuraciones van por variables de entorno (`SUPABASE_*`, `QR_SECRET`, `ROOT_API_KEY`) y no hay secretos en el repositorio (solo `.env.example`). Revertir un despliegue no requiere herramientas extra.
- **Negativas:** el primer pedido después de un rato de inactividad tarda más de un minuto (cold start de Render free). La reversión de código no revierte el esquema de base: un cambio de entidad desplegado con `ddl-auto=update` queda aplicado (ADR-016).
- **Deuda asumida:** falta el `Dockerfile` del frontend y sumar backend y frontend a `docker-compose.yml` para cumplir `docker compose up --build` (ticket aparte). El pipeline de CI (ADR-007) valida pero no despliega: el despliegue lo hacen Render y Vercel al detectar el push.

## Requisitos relacionados
Unidad V
