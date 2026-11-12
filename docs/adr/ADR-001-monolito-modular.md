# ADR-001 — Monolito modular como estilo arquitectónico

- **Estado:** Aceptado
- **Fecha:** 2026-09-06
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (redacción: Leiva, Marcos Joel)
- **Sprint:** 2

## Contexto
FitZone Sports tenía que cubrir cinco módulos (usuarios y membresías, gimnasio y acceso, clases, canchas y pagos) para una cadena de más de 25 sedes. Varias reglas cruzan módulos dentro de una misma operación: reservar una cancha (RN-02) toca la cancha, la reserva, el precio según la membresía (RN-03) y la transacción de pago. El equipo era de seis estudiantes, con experiencia despareja en Spring Boot, un cuatrimestre de plazo y un solo servicio gratuito de hosting para el backend (Render, plan free). RNF-04 pide que el sistema se pueda extender a nuevos tipos de recurso sin rediseñarlo.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Microservicios (uno por módulo) | Despliegue y escalado independientes; límites de módulo forzados por la red | Las reglas que cruzan módulos (reserva + precio + pago) pasan a ser transacciones distribuidas (sagas); seis servicios para operar y monitorear; varias instancias pagas | El costo operativo y la consistencia de RN-02 entre servicios superaban lo que el equipo podía sostener en un cuatrimestre |
| SOA con bus de servicios | Integración desacoplada por contratos | Necesita un ESB o broker y gobierno de contratos; mucho andamiaje para un único sistema | No hay sistemas heterogéneos que integrar: sería infraestructura sin un problema que resuelva |
| Serverless (funciones por endpoint) | Cero servidores para administrar; se paga por uso | Arranques en frío, sin transacciones largas con bloqueo pesimista, estado repartido en servicios gestionados | El control de concurrencia de RN-02 y RN-01 necesita una transacción con bloqueo en la base, que se adapta mal a funciones efímeras |
| Monolito en capas sin módulos | El más simple de arrancar | Con seis personas en paralelo, todo termina acoplado a todo | No da límites claros para repartir el trabajo ni para extender (RNF-04) |
| **Monolito modular** | Una sola unidad de despliegue y una sola transacción ACID; módulos con paquetes propios | Los límites entre módulos los cuida la disciplina, no el compilador | — |

## Decisión
Vamos a construir un monolito modular en Spring Boot: una sola aplicación desplegable, organizada en `com.fitzone.modulo.{usuarios, gimnasio, clases, canchas, pagos}`, cada uno con sus propias capas (`controller`, `service`, `repository`, `models`), y un paquete `core` con lo transversal (seguridad, errores, configuración). Lo que terminó de definirlo fue poder resolver RN-02 y el pago de una reserva dentro de una sola transacción de base de datos.

## Consecuencias
- **Positivas:** las operaciones que cruzan módulos (reservar y cobrar) son transacciones locales con `@Transactional`. Hay un solo pipeline, un solo despliegue y un solo log. Cada integrante trabaja en su paquete con pocos conflictos de merge. Para sumar un tipo de recurso alcanza con un módulo o un tipo nuevo, sin servicios nuevos (RNF-04).
- **Negativas:** todo escala junto: un pico de reservas de canchas consume los mismos recursos que el control de acceso. Un error grave tira abajo todos los módulos a la vez.
- **Deuda asumida:** hoy los servicios de un módulo llaman directo a repositorios de otro (por ejemplo, `pagos` usa `ReservaCanchaRepository`). Si algún módulo se extrajera como servicio, primero habría que poner interfaces o eventos en esos puntos, como ya se hizo en `clases` con `CupoLiberadoEvent`.

## Requisitos relacionados
RN-02, RNF-04
