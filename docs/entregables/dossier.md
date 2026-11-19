Universidad Nacional de Entre Ríos — Facultad de Ciencias de la Administración

Licenciatura en Sistemas — Programación V — Año 2026

# Trabajo Integrador Final — Caso «FitZone Sports»

## Equipo {EQUIPO}

| Integrante | Rol | Usuario de Git |
| :-- | :-- | :-- |
| Leiva, Marcos Joel | P1 | MarquitosLev |
| Aquino, Benjamín | P2 | Benjamim023 |
| Bravo, Agustín | P2 | agusbravo09 |
| Chang, Maximiliano | P3 | MaxiTonoto |
| Coppes, Matías | P3 | maticoppes |
| Pérez, Luciano | P3 | cirez7 |

| | |
| :-- | :-- |
| Fecha de entrega | 19 de noviembre de 2026 |
| Repositorio | https://github.com/MarquitosLev/fitzone-sports-p5 |
| Tag | `{TAG}` |
| Hash del commit | `{HASH}` |

<!-- fin-portada -->

## Índice

1. Resumen ejecutivo del sistema
2. Arquitectura: diagramas C4 de los niveles 1, 2 y 3
3. Registros de decisión arquitectónica: ADR-001 a ADR-020
4. Modelado: clases, secuencia, estados, actividad, DER y despliegue
5. Patrones de diseño aplicados y su justificación
6. Estrategia de pruebas y reporte de cobertura
7. Cumplimiento de los requisitos no funcionales, con su evidencia
8. Planificación: plan, cronograma, trazabilidad, seguimiento y riesgos
9. Bitácoras individuales de los seis integrantes
10. Índice de los manuales entregados, con su ubicación en el repositorio
11. Anexo: tablero del proyecto exportado

# 1. Resumen ejecutivo del sistema

FitZone Sports es una plataforma web para administrar una cadena de gimnasios con varias sedes. Reúne en un solo sistema lo que hoy la cadena resuelve por separado: la membresía de los socios, la agenda de clases grupales, el alquiler de canchas, el control de acceso en la recepción y los cobros.

**Quién la usa.** El *socio* paga su membresía, reserva clases y canchas, y entra a cualquier sede mostrando un código QR desde el celular. El *cliente externo* reserva y paga una cancha sin crear una cuenta, y recibe un comprobante con un código para consultarla. El *recepcionista* da de alta socios, cobra, valida los ingresos y ve el aforo de su sede en tiempo real. El *gerente central* administra sedes, personal, planes, canchas y clases de toda la cadena.

**Qué resuelve.**

| Módulo | Requisitos | Qué hace |
| :-- | :-- | :-- |
| M1 Usuarios y Membresías | RF-01 a RF-03 | Alta de socios y personal con Supabase Auth, planes, membresías y su vencimiento |
| M2 Gimnasio y Acceso | RF-04, RF-05 | QR firmado en el celular del socio, validación en la recepción con RN-01 (un ingreso abierto por socio) y control de aforo, también sin conexión |
| M3 Clases | RF-06 a RF-08 | Agenda por sede, reserva con cupo y lista de espera que avisa cuando se libera un lugar (patrón Observer) |
| M4 Canchas | RF-09 a RF-12 | Grilla de disponibilidad, reserva sin sobreventa (RN-02) y precio dinámico: descuento de socio al día, tarifa externa para el moroso (RN-03) y recargo en horario pico |
| M5 Pagos | RF-13, RF-14 | Cobro de membresías y reservas por una pasarela (simulada), comprobante en PDF y reintento de pagos rechazados |

**Cómo está construida.** Es un monolito modular (ADR-001): una API REST en Java 21 con Spring Boot 3.4 y JPA sobre PostgreSQL 16 (ADR-002, ADR-005), y una aplicación web en React 19 con TypeScript y Tailwind (ADR-006). Las reservas de canchas, los cupos de clases, RN-01 y el aforo se protegen con bloqueo pesimista dentro de la transacción (ADR-004). La autenticación la hace Supabase Auth y la autorización por rol y por sede, el backend (ADR-020, ADR-015). El control de acceso sigue funcionando si se cae internet en la sede: el celular firma el QR y el terminal valida con una lista local y sincroniza al reconectar (ADR-007).

**Estado de la entrega.** Los cinco módulos están integrados y publicados desde `main`: la API en Render, la web en Vercel y la base en Supabase. Localmente, `docker compose up --build` levanta base, API y web. La suite tiene 357 pruebas en el backend y 483 en el frontend, todas en verde, con 73,8 % y 72,7 % de cobertura de líneas. Cada Pull Request pasa por un pipeline de GitHub Actions con pruebas, build y reporte de cobertura.

**Lo que queda pendiente**, documentado en los ADR y en la evidencia de RNF: el índice de disponibilidad de canchas de RNF-03 y la restricción `EXCLUDE USING gist` (hoy la garantía es el bloqueo del servicio), la integración real con Mercado Pago (se usa una pasarela simulada) y una app móvil empaquetada (el pase QR offline vive en la web).
