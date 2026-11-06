# Kit de QA y desarrollo

Documento interno del equipo de FitZone Sports. Explica qué contiene el kit, para qué sirve cada archivo y cómo se usa en el trabajo diario.

## Qué contiene

| Archivo | Para quién | Qué responde |
| :-- | :-- | :-- |
| [HISTORIAS_DE_USUARIO.md](HISTORIAS_DE_USUARIO.md) | QA | Qué debe poder hacer cada rol y qué hay que probar |
| [BACKLOG_DESARROLLO.md](BACKLOG_DESARROLLO.md) | Desarrollo | Qué falta construir por módulo y qué prueba cada desarrollador |
| [DATOS_DE_PRUEBA.md](DATOS_DE_PRUEBA.md) | Todos | Usuarios, sedes, planes, canchas y clases para probar |

Las historias de QA tienen 57 historias por rol. El backlog tiene 36 historias técnicas por módulo. Las dos listas se conectan por ID: cada historia técnica cita las de QA que destraba.

## Cómo leer los IDs

| ID | Significado | Ejemplo |
| :-- | :-- | :-- |
| `SOC`, `MOR`, `EXT`, `REC`, `GER` | Historia de QA por rol | `SOC-10`: reservar una clase |
| `SEG` | Historia de QA de seguridad | `SEG-01`: proteger funciones por rol |
| `DEV-M1` a `DEV-M5` | Historia técnica por módulo | `DEV-M3-01`: integrar reservas de clases |
| `DEV-T` | Historia técnica transversal | `DEV-T-01`: autorización de endpoints |

Los módulos siguen a la cátedra: M1 Usuarios y Membresías, M2 Gimnasio y Acceso, M3 Clases, M4 Canchas y M5 Pagos.

## Flujo de trabajo

1. **Elegir una historia.** Tomar una `DEV-*` según prioridad y orden sugerido del backlog.
2. **Crear el ticket.** Cada historia necesita su ticket de Jira. El kit no los crea.
3. **Revisar dependencias.** Si cita una decisión pendiente, resolverla antes de empezar.
4. **Desarrollar.** Trabajar en una rama `SCRUM-<N>` desde `develop`.
5. **Probar como desarrollador.** Completar la "Prueba del desarrollador" en la web, con `VITE_USE_MOCK=false`.
6. **Abrir el PR.** Dejar el resultado de esas pruebas en la descripción.
7. **Probar como QA.** Ejecutar todas las casillas de las historias citadas en **QA**.
8. **Reportar fallas.** Registrar ID, pasos, resultado esperado y resultado obtenido.

Si falla la prueba del desarrollador, la historia no pasa a QA.

## Quién prueba qué

| | Desarrollador | QA |
| :-- | :-- | :-- |
| Alcance | Camino principal y errores críticos | Todas las casillas de la historia |
| Cuándo | Antes de abrir el PR | Después del PR |
| Dónde queda | En el PR | En la guía o en el reporte de fallas |

## Antes de probar

1. Levantar el entorno según el [README.md](../README.md) de la raíz.
2. Revisar [DATOS_DE_PRUEBA.md](DATOS_DE_PRUEBA.md).
3. Confirmar `VITE_USE_MOCK=false`.
4. Si Windows reserva el puerto 8080, usar otro con `PORT` y `VITE_API_BASE_URL`.

Si una historia requiere comportamiento todavía sin definir, marcarla como bloqueada, no como fallida.

## Reglas de mantenimiento

- Las historias de QA describen lo esperado según la especificación, no el estado actual del sistema.
- Las casillas se marcan en una copia de trabajo o en el reporte de QA, no en este repositorio.
- Al resolver una decisión pendiente, actualizar los dos documentos.
- Al agregar una historia nueva, mantener el cruce de IDs entre QA y backlog.
- El backlog refleja `develop` y `SCRUM-97` al 2026-11-01. Revisarlo antes de planificar, porque el equipo mergea seguido.

## Pendientes conocidos

- Hay 6 decisiones abiertas, listadas al final de ambos documentos.
- La tabla de permisos de `DEV-T-01` es una propuesta y debe confirmarse.
- Las prioridades y el reparto de pruebas son una propuesta del relevamiento.
- Los resultados del relevamiento inicial no forman parte de este kit: login real, rutas y pagos deben volver a probarse.
