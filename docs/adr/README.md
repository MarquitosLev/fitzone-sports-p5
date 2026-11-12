# Registros de decisión arquitectónica (ADR)

Un ADR por archivo, con la plantilla del Anexo B de los lineamientos. Un ADR no se corrige: se supera. Cuando una decisión cambia, el original pasa a «Reemplazado por ADR-0NN» y se escribe uno nuevo.

Los ADR-001 a ADR-009 son los obligatorios de la cátedra, con su numeración. Del ADR-010 en adelante están las decisiones propias del equipo. Algunas se tomaron en Sprint 2 y 3 y quedaron en el documento compartido del Drive con otra numeración: cada una aclara en «Autor» con qué número figuraba allá.

| ADR | Decisión | Estado |
|---|---|---|
| [ADR-001](ADR-001-monolito-modular.md) | Monolito modular como estilo arquitectónico | Aceptado |
| [ADR-002](ADR-002-postgresql.md) | PostgreSQL como motor de base de datos | Aceptado |
| [ADR-003](ADR-003-estrategia-offline-acceso.md) | Control de acceso en línea, sin modo offline | Aceptado |
| [ADR-004](ADR-004-concurrencia-reserva-canchas.md) | Bloqueo pesimista para la reserva de canchas | Aceptado |
| [ADR-005](ADR-005-spring-boot-jpa.md) | Spring Boot 3, Spring IoC y JPA/Hibernate | Aceptado |
| [ADR-006](ADR-006-react-tailwind-context.md) | React + TypeScript, Tailwind y Context API | Aceptado |
| [ADR-007](ADR-007-estrategia-de-pruebas.md) | Pirámide de pruebas y umbral de cobertura del 60 % | Aceptado |
| [ADR-008](ADR-008-despliegue-contenedores.md) | Docker, Render, Vercel y reversión por Git | Aceptado |
| [ADR-009](ADR-009-medios-de-pago.md) | Pasarela externa sin guardar datos de tarjeta | Aceptado |
| [ADR-010](ADR-010-supabase-auth.md) | Autenticación con Supabase Auth, autorización en el backend | Aceptado |
| [ADR-011](ADR-011-rls-multisede.md) | Aislamiento multisede con Row Level Security | Reemplazado por ADR-015 |
| [ADR-012](ADR-012-vinculo-pagos-reservas.md) | La transacción apunta a la reserva | Aceptado |
| [ADR-013](ADR-013-uuid-como-clave-primaria.md) | UUID como clave primaria | Reemplazado por ADR-016 |
| [ADR-014](ADR-014-trazabilidad-accesos-reservas.md) | Vincular el acceso físico con la reserva | Aceptado |
| [ADR-015](ADR-015-aislamiento-por-sede-en-servicios.md) | Aislamiento por sede en la capa de servicio | Aceptado |
| [ADR-016](ADR-016-esquema-generado-por-jpa.md) | Esquema generado por JPA: ids `Long` y enums como texto | Aceptado |
| [ADR-017](ADR-017-enum-nativos-postgresql.md) | ENUM nativos de PostgreSQL | Reemplazado por ADR-016 |
