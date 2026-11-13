# ADR-002 — PostgreSQL como motor de base de datos

- **Estado:** Aceptado
- **Fecha:** 2026-08-22
- **Registrado:** 2026-11-10
- **Autor:** Leiva, Marcos Joel
- **Sprint:** 1

## Contexto
El dominio es transaccional: reservas que no se pueden superponer (RN-02), un único ingreso abierto por socio (RN-01), cupos de clases, aforo por sede y pagos que tienen que quedar asociados a su reserva o membresía. RNF-03 pide que la consulta de disponibilidad de canchas responda bien con volumen de datos. Hacía falta además un hosting gratuito para los entornos de desarrollo y de producción, y que el equipo pudiera levantar la base en local con Docker.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| MySQL / MariaDB | Conocido por parte del equipo; mucho hosting barato | Sin restricciones de exclusión por rango (`EXCLUDE USING gist`) ni RLS; tipos de rango y CHECK más limitados | Perdíamos las herramientas propias del motor para garantizar RN-02 en la base |
| MongoDB (documental) | Esquema flexible; fácil de arrancar desde JavaScript | Transacciones multidocumento más caras; sin claves foráneas; la integridad pasa a la aplicación | El dominio es relacional (usuario-membresía-reserva-pago) y la integridad referencial era un requisito |
| SQLite / H2 en archivo | Cero infraestructura | Una sola conexión de escritura; no sirve como base compartida en la nube | No soporta el despliegue multisede ni los bloqueos concurrentes reales |
| **PostgreSQL 16** | ACID, `SELECT … FOR UPDATE`, CHECK y FK con nombre, índices parciales y por rango, RLS; hosting gratuito en Supabase con el Auth integrado | Una instancia única concentra el tráfico de todas las sedes | — |

## Decisión
Vamos a usar PostgreSQL 16 como única base de datos del sistema: `postgres:16-alpine` en Docker para el desarrollo local, y el proyecto de Supabase para los entornos en la nube. Lo que lo decidió fue la integridad transaccional: bloqueos pesimistas por fila, claves foráneas y CHECK que el motor hace cumplir aunque alguien escriba directo en la base.

## Consecuencias
- **Positivas:** RN-01, RN-02, los cupos y el aforo se resuelven con `PESSIMISTIC_WRITE` (`SELECT … FOR UPDATE`) dentro de la transacción. Las FK y los CHECK con nombre (`ck_gym_accesos_una_reserva`, `ck_pag_transacciones_origen`) protegen la consistencia entre módulos. Supabase da la base y la autenticación en un solo servicio (ADR-010).
- **Negativas:** todas las sedes comparten una sola instancia (ver ADR-011 y ADR-015). Las capacidades más avanzadas del motor, como las restricciones de exclusión, no tienen equivalente en JPA y hay que escribirlas en SQL aparte.
- **Deuda asumida:** RNF-03 pide índices para la disponibilidad de canchas, y todavía no están declarados (`@Index` sobre `id_cancha, fecha_hora_inicio`). El esquema no tiene migraciones versionadas (ADR-016).

## Requisitos relacionados
RNF-03, RN-01, RN-02
