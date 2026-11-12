# ADR-015 — Aislamiento por sede validado en la capa de servicio

- **Estado:** Aceptado
- **Fecha:** 2026-11-01
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (redacción: Leiva, Marcos Joel)
- **Sprint:** 7
- **Reemplaza a:** ADR-011

## Contexto
El ADR-011 proponía aislar las sedes con RLS de PostgreSQL. Al integrar la autenticación (ADR-010), el backend quedó conectado a la base con un único usuario técnico a través de JPA, así que el JWT de cada usuario nunca llega al motor. Había que resolver igual que un recepcionista solo opere su sede, que el gerente vea todas y que un socio pueda entrar en cualquiera (RF-03).

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Mantener RLS propagando la sede con `SET LOCAL app.sede_id` en cada transacción | Garantía en la base | Un interceptor de conexión, políticas SQL fuera del esquema de Hibernate y casos especiales para el gerente (global) y los socios (multisede) | Mucho mecanismo para tres reglas; difícil de probar sin base |
| Filtro de Hibernate (`@Filter`) por sede | Filtra solo, a nivel ORM | Hay que activarlo en cada sesión; no aplica a las consultas nativas | Mismo problema con las excepciones de rol |
| **Validación explícita en los servicios con `UsuarioActual.validarSede`** | Simple, visible en el código y fácil de probar con Mockito | Depende de que cada servicio nuevo la llame | — |

## Decisión
La sede del operador se toma siempre del usuario autenticado (`UsuarioActual`, que lo resuelve por el `sub` del JWT) y nunca de un parámetro del request. Las operaciones de personal llaman a `UsuarioActual.validarSede(idSede)`: el recepcionista solo opera su sede asignada, el gerente sin sede es global y los socios acceden a cualquier sede (RF-03). La base es una sola, compartida por todas las sedes, con `id_sede` en las tablas operativas.

## Consecuencias
- **Positivas:** la regla está en Java, junto al resto de las reglas de negocio, y tiene tests unitarios. Los reportes consolidados del gerente son una consulta sobre una sola base.
- **Negativas:** el aislamiento depende de la disciplina: un endpoint nuevo que no llame a `validarSede` expone datos de otras sedes. Quien acceda directo a la base ve todas las sedes.
- **Deuda asumida:** no hay un test que recorra todos los endpoints de personal y verifique que llaman a `validarSede`. Un chequeo así (por ejemplo, un test de arquitectura) evitaría que un endpoint nuevo lo olvide.

## Requisitos relacionados
RF-03, RF-05, RN-01
