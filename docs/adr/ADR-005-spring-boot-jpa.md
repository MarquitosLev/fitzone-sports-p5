# ADR-005 — Spring Boot 3, Spring IoC y JPA/Hibernate para el backend

- **Estado:** Aceptado
- **Fecha:** 2026-08-22
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (redacción: Leiva, Marcos Joel)
- **Sprint:** 1

## Contexto
La API tenía que exponer REST para el frontend web, validar el JWT de Supabase (ADR-010), aplicar las reglas de negocio con transacciones y bloqueos (ADR-004) y persistir en PostgreSQL (ADR-002). La cátedra trabaja la Unidad II (inyección de dependencias, patrones y persistencia) sobre Java. En la primera reunión se discutió Python contra Java. Parte del equipo ya había usado Java en materias anteriores, y nadie tenía experiencia productiva con frameworks de Python.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Python + FastAPI + SQLAlchemy | Menos código ceremonial; arranque rápido | Sin contenedor IoC estándar; transacciones y bloqueos más manuales; distinto del lenguaje de la cátedra | Se alejaba de los contenidos de la Unidad II y del conocimiento previo del equipo |
| Node.js + NestJS + TypeORM | Mismo lenguaje que el front; DI al estilo Angular | Ecosistema ORM menos maduro para bloqueos pesimistas; tipado que se pierde en runtime | Dividía al equipo en un segundo lenguaje de servidor sin ganancia clara |
| Java + Jakarta EE / Quarkus | Estándar; Quarkus arranca rápido | Menos material de estudio y ejemplos para el equipo; menos integración lista con Supabase JWT | Spring tiene más documentación y starters (`oauth2-resource-server`, `springdoc`) |
| Java + Spring Boot con JDBC/MyBatis | SQL explícito | Mapear a mano cinco módulos de entidades | Demasiado código repetitivo para el plazo |
| **Java 21 + Spring Boot 3.4 + Spring Data JPA (Hibernate)** | Contenedor IoC, `@Transactional`, `@Lock`, validación, seguridad y OpenAPI por starters | Mucha "magia" que hay que entender; `ddl-auto` tienta a no versionar el esquema | — |

## Decisión
Vamos a construir el backend con Java 21 y Spring Boot 3.4: el contenedor IoC de Spring con inyección por constructor (`@RequiredArgsConstructor` de Lombok), Spring Data JPA con Hibernate como ORM, Bean Validation para el formato de los datos, Spring Security como Resource Server JWT y springdoc para Swagger. Lo decidió la combinación de `@Transactional` + `@Lock(PESSIMISTIC_WRITE)`, que resuelve RN-01 y RN-02 de forma declarativa.

## Consecuencias
- **Positivas:** los servicios declaran sus dependencias por constructor y se prueban con Mockito sin levantar el contexto. Los controladores se prueban con `@WebMvcTest`. Los repositorios son interfaces con consultas derivadas o JPQL. Los patrones de la Unidad II se apoyan en el contenedor: Strategy (`EstrategiaPrecio`), Observer (`CupoLiberadoEvent` + `@EventListener`) y Repository.
- **Negativas:** el arranque es lento (importa en Render free, que duerme el servicio). Las relaciones `LAZY` obligan a `@JsonIgnoreProperties` o a `JOIN FETCH` porque los controladores exponen entidades.
- **Deuda asumida:** el esquema lo genera Hibernate (ADR-016). Hay que reemplazarlo por migraciones versionadas (SCRUM-133) antes de producción.

## Requisitos relacionados
Unidad II, RN-01, RN-02, RF-08, RF-11
