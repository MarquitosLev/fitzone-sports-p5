# Programación V — Lineamientos de Entrega

**Trabajo Integrador Final · Caso «FitZone Sports»**

**Fecha límite de entrega: jueves 19 de noviembre de 2026, 18:00 h**

Prof. Lic. Aguirre, Juan José · Ciclo lectivo 2026 · 2do Cuatrimestre · Régimen T/P

> Transcripción a Markdown del PDF `Lineamientos_Entrega_TIF_FitZone_Sports_2do_Cuatrimestre_2026` entregado por la cátedra. Ante cualquier duda manda el PDF original.

## Índice

1. [Objeto y alcance](#1-objeto-y-alcance)
2. [Fecha y condiciones de entrega](#2-fecha-y-condiciones-de-entrega)
3. [Canal de entrega](#3-canal-de-entrega)
4. [Estructura del repositorio](#4-estructura-del-repositorio)
5. [Artefactos obligatorios](#5-artefactos-obligatorios)
6. [Evaluación](#6-evaluación)
7. [Entrega fuera de término y situaciones especiales](#7-entrega-fuera-de-término-y-situaciones-especiales)
8. [Checklist de autoevaluación](#8-checklist-de-autoevaluación)
- [Anexos](#anexos)

---

## 1. Objeto y alcance

Este documento fija qué debe entregar cada equipo al cierre del Trabajo Integrador Final de Programación V, en qué formato, por qué canal y con qué criterios se evalúa. Es el único documento de referencia para la entrega: lo que no esté enumerado aquí no es obligatorio, y lo que esté enumerado aquí no se negocia individualmente.

El Trabajo Integrador es el «requerimiento específico de evaluación» previsto en el Art. 26 inciso c) del Reglamento Académico de la Facultad (Resolución N.º 135/2019) para la promoción directa de la asignatura. Su aprobación es condición necesaria para promocionar; su no aprobación, cumpliendo el resto de los requisitos, mantiene la condición de regular y obliga a rendir examen final oral.

### 1.1 A quién está dirigido

A los equipos de cuatro integrantes que desarrollan el caso «FitZone Sports»: una plataforma de gestión para una cadena de gimnasios con 25 o más sucursales, que unifica el control de acceso, las clases grupales y el alquiler de canchas deportivas, con clientes web.

### 1.2 Qué se entrega, en una frase

Un repositorio único, etiquetado y reproducible, que contenga el código fuente de la aplicación, los registros de decisión arquitectónica, los diagramas del sistema, los tres manuales y las bitácoras individuales de los cuatro integrantes; más un dossier en PDF subido al campus virtual como constancia de fecha.

> **Principio que ordena todo lo demás**
>
> La entrega se evalúa como se evalúa un sistema profesional: alguien ajeno al equipo debe poder clonar el repositorio, levantar la aplicación siguiendo el manual de instalación, entender por qué está construida así leyendo los ADR y los diagramas, y verificar quién hizo qué leyendo las bitácoras. Si alguno de esos cuatro recorridos se corta, la entrega está incompleta, por más código que tenga.

## 2. Fecha y condiciones de entrega

### 2.1 Fecha límite

La entrega cierra el jueves 19 de noviembre de 2026 a las 18:00 h. Esa fecha corresponde a la semana 15 del cursado y opera como congelamiento de código: ningún commit posterior se considera parte de la entrega, aunque el repositorio siga activo.

La semana 16 queda reservada exclusivamente para el Demo Day y la defensa técnica. En esa semana no se desarrolla: se presenta lo entregado.

| Hito | Fecha | Qué ocurre |
| :-- | :-- | :-- |
| Congelamiento de código | Jue 19/11/2026, 18:00 | Se crea el tag `v1.0-entrega`. Último commit válido. |
| Subida al campus virtual | Jue 19/11/2026, 18:00 | Dossier PDF y enlace al repositorio en Moodle. |
| Verificación de admisibilidad | Vie 20/11 – Dom 22/11 | La cátedra clona, levanta y revisa la completitud formal. |
| Demo Day y defensa | Semana 16 (23/11 – 29/11) | Presentación de 15 minutos por equipo. |

### 2.2 Observación sobre el cronograma

El cronograma original de la asignatura ubica el sprint de cierre entre el 16 y el 29 de noviembre. Al fijarse la entrega el 19 de noviembre, ese sprint queda reducido a cuatro días, insuficientes para integrar los tres clientes, cerrar defectos y redactar los manuales.

Por eso la cátedra recomienda a los equipos adelantar la planificación interna según el siguiente reacomodamiento, sin alterar el total de horas prácticas:

| Tramo | Fechas | Foco |
| :-- | :-- | :-- |
| Integración y manuales | Lun 09/11 – Dom 15/11 | Integración de los tres clientes, redacción de manuales y cierre de bitácoras. |
| Congelamiento | Lun 16/11 – Jue 19/11 | Corrección de defectos críticos, verificación del checklist y entrega. |
| Defensa | Lun 23/11 – Dom 29/11 | Ensayo y Demo Day. Sin desarrollo. |

> **Lo que esto significa en la práctica**
>
> Los manuales y las bitácoras no se escriben la última semana. Se redactan durante el tramo del 9 al 15 de noviembre, cuando el sistema ya está integrado y todavía queda margen para corregir. Un equipo que llega al 16 de noviembre sin manuales va a entregar código sin documentación, que es el modo más frecuente de perder la promoción en esta asignatura.

## 3. Canal de entrega

La entrega tiene dos componentes simultáneos y obligatorios. Falta cualquiera de los dos y la entrega se considera no presentada.

### 3.1 Repositorio Git — el entregable real

El equipo debe mantener un repositorio único, privado, con la cátedra agregada como colaboradora con permiso de lectura. Al cerrar la entrega se crea una etiqueta anotada:

```bash
git tag -a v1.0-entrega -m "Entrega Trabajo Integrador FitZone Sports - Equipo NN"
git push origin v1.0-entrega
```

La fecha del tag es la fecha de entrega a todos los efectos. Un tag creado después del 19/11 a las 18:00 cuenta como entrega fuera de término, aunque los commits que etiqueta sean anteriores.

### 3.2 Campus virtual (Moodle) — la constancia

Un único integrante por equipo, designado como responsable de entrega, sube a la tarea habilitada en Moodle:

- El dossier en PDF, generado según el Anexo A, con portada, índice y los ADR y diagramas incorporados.
- La URL del repositorio y el nombre exacto del tag.
- El hash completo del commit etiquetado (`git rev-parse v1.0-entrega`).

El dossier en PDF no reemplaza al repositorio: es la constancia con sello de fecha del campus y el documento que la cátedra lee en papel durante la corrección. Debe ser coherente con el repositorio; cualquier discrepancia se resuelve a favor de lo que esté en el tag.

### 3.3 Nomenclatura de los archivos subidos

| Archivo | Nombre exacto |
| :-- | :-- |
| Dossier PDF | `PROGV-2026-TIF-Grupo-NN-Dossier.pdf` |
| Planilla de registro (si no se usó Jira o GitHub Projects) | `PROGV-2026-TIF-Grupo-NN-Registro.xlsx` |

Donde NN es el número de equipo asignado por la cátedra, con dos dígitos. Un archivo mal nombrado no invalida la entrega, pero demora la corrección y se consigna como observación formal.

## 4. Estructura del repositorio

El repositorio debe seguir una estructura similar (no obligatoria). La cátedra la usa como mapa de corrección: cada carpeta se revisa contra la sección correspondiente de este documento.

```text
fitzone-sports/
├── README.md                ← puerta de entrada al proyecto
├── LICENSE
├── docker-compose.yml       ← levanta todo con un comando (opcional)
├── .env.example             ← las variables, sin valores reales
│
├── backend/                 ← API REST monolítica modular
│   ├── src/
│   │   ├── usuarios/        ← M1 RF-01 a RF-03
│   │   ├── acceso/          ← M2 RF-04, RF-05
│   │   ├── clases/          ← M3 RF-06 a RF-08
│   │   ├── canchas/         ← M4 RF-09 a RF-12
│   │   ├── pagos/           ← M5 RF-13, RF-14
│   │   └── common/          ← guards, decoradores y DTOs
│   ├── test/                ← unitarias, integración, concurrencia
│   └── swagger.json         ← contrato OpenAPI exportado
│
├── frontend/                ← aplicación web de administración
│   ├── src/components/      ← átomos, moléculas y organismos
│   ├── src/services/        ← capa de servicio contra la API
│   └── src/store/           ← estado global
│
└── docs/
    ├── adr/                 ← ADR-001 … ADR-0NN, uno por archivo
    ├── diagramas/           ← fuentes y exportaciones PNG/SVG
    ├── bitacoras/           ← LOG-<apellido>.md, uno por integrante
    ├── manuales/            ← los tres manuales
    ├── rnf/                 ← evidencia de los RNF
    └── entregables/         ← dossier y entregables por unidad
```

### 4.1 El README raíz

Es lo primero que lee la cátedra y lo primero que leería un desarrollador nuevo. Debe contener, en este orden:

1. Qué es el sistema, en tres o cuatro oraciones, sin jerga de la materia.
2. Integrantes del equipo con su rol (P1 a P4) y su usuario de Git, para poder cruzar commits con bitácoras.
3. Puesta en marcha en no más de cinco pasos, copiables y pegables.
4. Credenciales de los usuarios de prueba cargados por el seed, uno por cada rol del sistema.
5. Tabla de enlaces a los ADR, los diagramas, los manuales y las bitácoras.
6. Estado de la suite de pruebas y porcentaje de cobertura alcanzado.

> **Criterio de aceptación del README**
>
> Un docente con la máquina recién formateada, sin preguntar nada al equipo, debe poder llegar de la clonación del repositorio a la aplicación funcionando en el navegador. Si hace falta escribir al equipo para que explique un paso, el README no cumple.

## 5. Artefactos obligatorios

Son cinco conjuntos. Los cinco se entregan; ninguno sustituye a otro.

| # | Artefacto | Dónde vive | Condición mínima |
| :-- | :-- | :-- | :-- |
| 5.1 | Bitácoras individuales | `docs/bitacoras/` | Una por integrante, con entradas en los 8 sprints |
| 5.2 | Registros de decisión (ADR) | `docs/adr/` | Los obligatorios, uno por archivo |
| 5.3 | Diagramas | `docs/diagramas/` | Los obligatorios, con fuente editable |
| 5.4 | Código fuente | `backend/` `frontend/` | Compila, levanta y pasa las pruebas |
| 5.5 | Manuales | `docs/manuales/` | Los tres manuales completos |

### 5.1 Bitácoras individuales de los desarrolladores

Cada integrante mantiene su propia bitácora, en su propio archivo, escrita en primera persona. No existe la bitácora grupal: el objeto de este artefacto es poder distinguir el aporte de cada uno dentro de un trabajo que se califica en conjunto.

#### 5.1.1 Archivo y ubicación

`docs/bitacoras/LOG-<apellido>.md` (ej.: `LOG-gimenez.md`)

#### 5.1.2 Qué registra cada entrada

| Campo | Contenido |
| :-- | :-- |
| Fecha | Día de la sesión de trabajo. |
| Sprint y unidad | Sprint 1 a 8 y unidad temática que se estaba trabajando. |
| Actividad | Qué hizo, concretamente. No «avancé con el backend», sino «implementé la validación del QR rotativo y su prueba unitaria». |
| Decisión | Qué decidió y por qué, cuando hubo una opción. Si la decisión fue estructural, se enlaza el ADR correspondiente. |
| Problema o bloqueo | Qué lo frenó y cómo lo resolvió, o por qué sigue abierto. Esta es la parte de la bitácora que más se valora. |
| Commits | Hash corto de los commits producidos en esa sesión. |
| Horas | Horas efectivas de trabajo. |

#### 5.1.3 Frecuencia mínima

- Mínimo exigido: una entrada por sprint, es decir ocho entradas por integrante.
- Recomendado: una entrada por semana de cursado, es decir dieciséis.
- Las entradas deben estar distribuidas en el tiempo. Dieciséis entradas creadas el mismo día no acreditan seguimiento del proceso: acreditan que se escribieron el mismo día.

#### 5.1.4 Qué invalida una bitácora

- No tener commits asociados. Una bitácora que declara trabajo sin huella en el repositorio no es verificable.
- Ser idéntica o casi idéntica a la de otro integrante. Cuatro bitácoras iguales describen un equipo donde nadie registró nada y alguien copió al final.
- Describir únicamente tareas, sin una sola decisión ni un solo problema en dieciséis semanas de desarrollo.

> **Por qué la cátedra insiste con esto**
>
> La bitácora es la única evidencia del proceso. El código terminado muestra el resultado, no el camino: no dice qué se probó y se descartó, ni dónde se perdieron tres días, ni quién desbloqueó a quién. En la defensa se pregunta por esos tramos, y la bitácora es lo que permite al estudiante responder con precisión en vez de con generalidades.

La plantilla de entrada está en el Anexo C.

### 5.2 Registros de decisión arquitectónica (ADR)

Un ADR por archivo, numerado correlativamente, en formato Markdown, dentro de `docs/adr/`. Cada ADR respeta la plantilla del Anexo B: Título, Estado, Contexto, Decisión, Alternativas consideradas, Consecuencias y Fecha.

Un ADR no se corrige: se supera. Si una decisión se revierte, el ADR original pasa a estado «Reemplazado por ADR-0NN» y se escribe uno nuevo. El historial de decisiones es parte del valor del artefacto.

#### 5.2.1 Los ADR obligatorios

| ADR | Decisión a registrar | Dispara |
| :-- | :-- | :-- |
| ADR-001 | Estilo arquitectónico: monolito modular frente a microservicios, SOA y serverless. | RN-02, RNF-04 |
| ADR-002 | Motor de base de datos relacional y justificación por integridad transaccional. | RNF-03 |
| ADR-003 | Estrategia offline del control de acceso ante caída de la conexión principal. | RNF-01 |
| ADR-004 | Control de concurrencia en la reserva de canchas: bloqueo optimista o pesimista, y garantía en base de datos. | RN-02 |
| ADR-005 | Framework backend, contenedor de inversión de control y ORM. | Unidad II |
| ADR-006 | Framework frontend, librería de componentes y gestión de estado global. | Unidad IV |
| ADR-007 | Estrategia de pruebas, pirámide adoptada y umbral mínimo de cobertura. | Unidad V |
| ADR-008 | Estrategia de despliegue, contenerización y procedimiento de reversión. | Unidad V |
| ADR-009 | Tratamiento de los medios de pago: tokenización y no persistencia de datos de tarjeta. | RNF-02 |

Los equipos pueden y deben agregar los ADR que su propio desarrollo haya requerido. Nueve es el piso, no el techo. Un equipo que tomó una decisión estructural relevante y no la registró pierde puntaje aunque la decisión haya sido correcta.

> **Lo que la cátedra busca en un ADR**
>
> La sección que más pesa no es «Decisión»: es «Alternativas consideradas». Un ADR que enumera una sola opción no documenta una decisión, documenta una preferencia. Si el equipo eligió PostgreSQL, tiene que estar escrito contra qué lo eligió y qué perdió al hacerlo.

### 5.3 Diagramas

Todos los diagramas se entregan en dos formas: la fuente editable (Archi, Structurizr, PlantUML, Mermaid o draw.io) y la exportación en PNG o SVG legible. Una imagen sin fuente no se acepta: no se puede verificar ni mantener.

Cada diagrama lleva, en su archivo o en un pie de figura, el nombre del autor, la fecha y la versión.

#### 5.3.1 Modelado C4

| Nivel | Diagrama | Alcance exigido |
| :-- | :-- | :-- |
| C4-1 | Contexto | Los cuatro actores (socio activo, cliente externo, recepcionista o administrador de sede, gerente central) y los sistemas externos, incluida la pasarela de pagos. |
| C4-2 | Contenedores | Frontend web, API backend y base de datos, con tecnología y protocolo de cada relación. |
| C4-3 | Componentes — Canchas | Obligatorio. Descomposición del módulo M4 con el servicio de reservas, la estrategia de precios, el repositorio y el gestor de bloqueos. |
| C4-3 | Componentes — Acceso | Obligatorio. Descomposición del módulo M2, incluido el camino offline del QR. |
| C4-4 | Código | Opcional. Si se incluye, limitarlo a la jerarquía de `PricingStrategy`. |

#### 5.3.2 Datos, despliegue e integración

| Diagrama | Alcance exigido |
| :-- | :-- |
| Diagrama entidad-relación | DER físico con claves, índices declarados y la restricción de unicidad que impide la sobreventa de canchas. |
| Diagrama de despliegue | Contenedores, red, base de datos y los terminales de sede, mostrando qué sigue funcionando ante una caída de la conexión principal. |
| Arquitectura del pipeline | Etapas de integración y entrega continuas, desde el Pull Request hasta el despliegue en el entorno de pruebas. |

### 5.4 Código fuente de la aplicación

Los tres componentes (backend, frontend y móvil) se entregan en el mismo repositorio, en el estado etiquetado por el tag. No se acepta código enviado por otro medio ni fuera del tag.

#### 5.4.1 Condiciones de admisibilidad del código

| Condición | Cómo se verifica |
| :-- | :-- |
| Levanta con un comando | `docker compose up --build` deja el sistema operativo y accesible. |
| Carga datos de prueba | Tener datos para crear al menos 25 sedes con canchas, clases y usuarios de los roles. |
| Pruebas en verde | La suite completa corre sin fallos y emite el reporte de cobertura. |
| Sin secretos versionados | No hay credenciales, claves ni tokens reales en el repositorio. Solo `.env.example`. |
| Contrato publicado | `swagger.json` exportado y Swagger UI accesible en el entorno de desarrollo. |
| Historial limpio | Commits con mensajes significativos y referencia a la tarjeta del tablero. Sin commits del tipo «cambios» o «fix». |

#### 5.4.2 Funcionalidad mínima exigible

Deben estar implementados y demostrables los catorce requisitos funcionales y las tres reglas de negocio del enunciado. La cátedra verifica en particular estos cuatro puntos, que son los que distinguen una implementación completa de una parcial:

1. **Acceso multi-sede:** un socio registrado en una sede ingresa en otra sin trámite adicional (RF-03), y no puede estar dentro de dos sedes a la vez (RN-01).
2. **No sobreventa:** dos reservas simultáneas de la misma cancha, fecha y horario resuelven con exactamente una confirmación (RN-02), garantizado también en base de datos.
3. **Precio dinámico:** tarifa estándar, descuento de socio del 15 % y recargo en horario pico de 19 a 21 h, resueltos por estrategias intercambiables (RF-11), con tarifa de externo para el socio en mora (RN-03).
4. **QR offline:** el código de socio se genera y valida sin conexión a internet (RNF-01, RF-04), con sincronización diferida de los ingresos.

> **Sobre el uso de asistentes de inteligencia artificial**
>
> Está permitido y es esperable que los equipos usen asistentes de IA durante el desarrollo. Lo que se evalúa es la comprensión, no la autoría de cada línea. En la defensa se pregunta el porqué de las decisiones y se puede pedir modificar el código en vivo ante un requerimiento nuevo: un integrante que no puede explicar ni modificar el código que entregó no acredita el resultado de aprendizaje, haya escrito ese código quien lo haya escrito.

### 5.5 Manuales

Tres manuales, tres lectores distintos, tres propósitos distintos. Un documento único que mezcle los tres no cumple: parte del ejercicio es distinguir a quién se le escribe.

| Manual | Lector | Pregunta que responde | Extensión |
| :-- | :-- | :-- | :-- |
| De usuario | Socio, recepcionista y gerente | ¿Cómo hago mi tarea en el sistema? | 15 a 25 págs. |
| De instalación y operación | Quien pone el sistema en marcha y lo mantiene | ¿Cómo lo levanto, lo configuro y lo recupero? | 8 a 15 págs. |
| Técnico | El desarrollador que se suma al equipo | ¿Cómo está construido y dónde toco para extenderlo? | 15 a 30 págs. |

#### 5.5.1 Manual de usuario

Organizado por rol, no por pantalla. Cada rol encuentra sus propios recorridos completos, con capturas reales del sistema entregado y las credenciales de prueba para reproducirlos.

- **Socio:** alta, pago de membresía, reserva de clase, lista de espera, reserva de cancha, uso del QR y qué hacer cuando no hay señal.
- **Recepcionista o administrador de sede:** validación de ingreso, consulta de aforo, alta de clases, inhabilitación de cancha por mantenimiento y resolución de los problemas frecuentes del mostrador.
- **Gerente central:** alta de sede, definición de precios y lectura de los reportes consolidados.

#### 5.5.2 Manual de instalación y operación

- Requisitos previos de software y hardware, con versiones exactas.
- Puesta en marcha en entorno de desarrollo y en entorno de producción.
- Tabla completa de variables de entorno: nombre, para qué sirve, valor de ejemplo y si es obligatoria.
- Aplicación y reversión de migraciones de base de datos.
- Procedimiento de respaldo y restauración.
- Alta de una sede nueva sin detener el sistema, que es el procedimiento que demuestra el RNF-04.
- Qué hacer cuando cae la conexión principal: operación degradada del control de acceso y resincronización posterior.

#### 5.5.3 Manual técnico

- Visión arquitectónica con los diagramas C4 incorporados e índice de los ADR.
- Mapa de los cinco módulos funcionales y sus responsabilidades.
- Modelo de datos y convenciones de persistencia.
- Patrones aplicados, con la ubicación en el código de cada uno.
- Guía de extensión con dos casos resueltos paso a paso: agregar un tipo de cancha nuevo y agregar una estrategia de precio nueva. Son las dos preguntas de situación del Demo Day.
- Cómo correr las pruebas y cómo leer el reporte de cobertura.
- Convenciones de código, de ramas y de mensajes de commit.

Los índices sugeridos de los tres manuales están en los Anexos D, E y F.

## 6. Evaluación

### 6.1 Admisibilidad

Antes de calificar, la cátedra verifica que la entrega sea admisible. Una entrega no admisible se devuelve sin nota y el equipo dispone de 48 horas para completarla, con la penalización del punto 7.1.

Son condiciones de admisibilidad:

- El tag `v1.0-entrega` existe y es anterior al vencimiento.
- El sistema levanta siguiendo el manual de instalación.
- Están los archivos de bitácora, uno por integrante.
- Están los nueve ADR obligatorios.
- Están los diagramas obligatorios, con su fuente editable.
- Están los manuales.

### 6.2 Rúbrica analítica

La calificación del Trabajo Integrador se compone según los pesos definidos para cada unidad. Cada criterio se evalúa en cuatro niveles de desempeño.

| Criterio | Peso | Destacado (10–9) | Bueno (8–7) | Suficiente (6) | Insuficiente (< 6) |
| :-- | :-- | :-- | :-- | :-- | :-- |
| I. Definición y modelado arquitectónico | 10 % | C4 completo y coherente con el código entregado. ADR con alternativas y consecuencias explícitas. | C4 completo con desvíos menores respecto del código. ADR correctos pero con alternativas pobres. | C4 en niveles 1 y 2. ADR presentes sin análisis de alternativas. | Falta algún nivel de C4 o los ADR no registran decisiones reales. |
| II. Desarrollo de la API y frameworks | 25 % | Los 14 RF implementados, contrato OpenAPI completo, modularidad limpia e IoC bien aprovechada. | RF implementados con alguna cobertura parcial. Contrato completo. Modularidad correcta. | Recorridos principales operativos. Contrato incompleto. Acoplamiento entre módulos. | Faltan módulos funcionales o la API no responde según el contrato. |
| III. Patrones de diseño y refactoring | 15 % | Strategy, Observer y Repository resuelven problemas reales del caso. Refactoring documentado y justificado contra alternativas. | Los tres patrones aplicados correctamente. Justificación presente pero superficial. | Patrones presentes, alguno forzado o decorativo. Sin análisis de code smells. | Patrones ausentes, mal aplicados o aplicados sin que resuelvan nada. |
| IV. Frontend basado en componentes | 15 % | Atomic Design consistente, catálogo documentado, estado global con una sola fuente de verdad y capa de servicio desacoplada. | Componentes reutilizables y documentados. Estado global correcto con alguna duplicación. | Pantallas funcionales con componentes poco reutilizables. Lógica de negocio filtrada a la vista. | Sin arquitectura de componentes reconocible o sin documentación. |
| V. Pruebas, integración y despliegue | 15 % | Pirámide completa, cobertura sobre el umbral declarado, prueba de concurrencia incluida y pipeline que bloquea el merge. | Unitarias e integración con buena cobertura. Pipeline operativo. E2E parcial. | Pruebas unitarias sobre lo principal. Pipeline que solo construye. | Sin pruebas automatizadas o sin pipeline funcionando. |
| Cierre: integración, manuales y defensa | 10 % | Sistema integrado, tres manuales de calidad profesional y defensa que sostiene cada decisión con argumentos. | Sistema integrado y manuales completos. Defensa correcta con algún titubeo técnico. | Integración con intervención manual. Manuales mínimos. Defensa desigual entre integrantes. | Sin integración real, manuales ausentes o defensa que no explica lo entregado. |

La calificación resultante se aprueba con 6 (seis). Por debajo de esa nota, el estudiante que cumpla el resto de los requisitos mantiene la regularidad y rinde examen final oral.

### 6.3 Nota grupal y ajuste individual

La calificación del Trabajo Integrador es grupal. La bitácora individual, cruzada con el historial de commits y con el desempeño en la defensa, permite ajustar la nota de cada integrante hasta en dos puntos, en más o en menos, respecto de la nota del equipo.

Este ajuste no busca premiar a quien más escribió, sino corregir las dos situaciones que una nota puramente grupal no distingue: el integrante cuyo aporte sostuvo el trabajo y el integrante que no participó del desarrollo y no puede explicar lo entregado.

## 7. Entrega fuera de término y situaciones especiales

### 7.1 Fuera de término

| Demora | Consecuencia |
| :-- | :-- |
| Hasta 24 h | Se recibe con una reducción de dos puntos sobre la nota final del trabajo. |
| Más de 24 h | No se recibe. El equipo pierde la promoción directa; conserva la regularidad si cumple el resto de los requisitos. |
| Entrega no admisible (punto 6.1) | Se devuelve para completar dentro de las 72 h, con la reducción de dos puntos. |

### 7.2 Situaciones que deben informarse antes del vencimiento

Cualquiera de estas situaciones se comunica por el foro de la asignatura antes del 19 de noviembre, no después. Informada a tiempo, la cátedra evalúa alternativas; informada después, se trata como incumplimiento.

- Baja o ausencia prolongada de un integrante, con el reparto de su trabajo entre el resto.
- Imposibilidad técnica fundada de completar un requisito funcional, con la alternativa implementada en su lugar.
- Conflicto interno del equipo que afecte la distribución del trabajo.

### 7.3 Integridad académica

La entrega es producto del trabajo del equipo. Se considera falta la presentación de código ajeno sin atribución, la fabricación de bitácoras o de evidencia de pruebas, y la manipulación de fechas de commits o de tags. La consecuencia es la pérdida de la promoción directa y la elevación del caso según el Reglamento Académico.

El uso de bibliotecas de terceros, plantillas públicas y asistentes de IA no constituye falta: se declara en el README y se explica en la defensa.

## 8. Checklist de autoevaluación

Recorrer esta lista antes de crear el tag. El Anexo G la reproduce en formato imprimible, con casillas, para marcarla en equipo.

| Ámbito | Verificación |
| :-- | :-- |
| Repositorio | La estructura coincide con el punto 4. |
| | El tag `v1.0-entrega` está creado y empujado. |
| | El README permite llegar de la clonación a la aplicación funcionando. |
| Código | `docker compose up --build` levanta el sistema en una máquina limpia. |
| | El set de datos de prueba para 25 sedes y los usuarios de los roles. |
| | La suite de pruebas corre en verde. |
| | No hay secretos versionados. |
| Funcionalidad | Los 14 RF son demostrables. |
| | Dos reservas simultáneas confirman una sola. |
| | El QR funciona en modo avión. |
| | El socio en mora paga tarifa de externo. |
| ADR | Los obligatorios están, con alternativas y consecuencias. |
| | Ninguno quedó en estado «Propuesto» sin resolver. |
| Diagramas | Los obligatorios, con fuente editable y exportación legible. |
| | Coinciden con el código entregado. |
| Bitácoras | Hay archivos, uno por integrante. |
| | Cada uno tiene al menos ocho entradas distribuidas en el tiempo. |
| | Las entradas enlazan commits reales. |
| | No son copias entre sí. |
| Manuales | Los tres están completos. |
| | El de usuario tiene capturas del sistema entregado. |
| | El técnico resuelve los dos casos de extensión. |
| Campus | El dossier PDF está subido. |
| | Incluye la URL del repositorio, el tag y el hash del commit. |
| Defensa | Los integrantes pueden explicar cualquier parte del sistema. |
| | La demo de cinco minutos está ensayada y cronometrada. |
| | Hay plan B ante fallo de conectividad. |

---

## Anexos

Los anexos que siguen son plantillas de uso directo. Los equipos pueden adaptarlas, pero no reducir los campos exigidos.

### Anexo A — Portada e índice del dossier

El dossier en PDF que se sube al campus se arma con esta estructura.

```text
PORTADA
Universidad Nacional de Entre Ríos — Facultad de Ciencias de la Administración
Licenciatura en Sistemas — Programación V — Año 2026
Trabajo Integrador Final — Caso «FitZone Sports»
Equipo NN
Integrantes: apellido y nombre, legajo, rol (P1 a P4) y usuario de Git
Fecha de entrega — URL del repositorio — Tag — Hash del commit

1. Resumen ejecutivo del sistema (1 página)
2. Arquitectura: diagramas C4 de los niveles 1, 2 y 3
3. Registros de decisión arquitectónica: ADR-001 a ADR-0NN
4. Modelado: clases, secuencia, estados, actividad, DER y despliegue
5. Patrones de diseño aplicados y su justificación
6. Estrategia de pruebas y reporte de cobertura
7. Cumplimiento de los requisitos no funcionales, con su evidencia
8. Bitácoras individuales de los cuatro integrantes
9. Índice de los manuales entregados, con su ubicación en el repositorio
10. Anexo: tablero del proyecto exportado
```

### Anexo B — Plantilla de ADR

```markdown
# ADR-0NN — <Título de la decisión, en una línea>

- **Estado:** Propuesto | Aceptado | Reemplazado por ADR-0NN | Obsoleto
- **Fecha:** AAAA-MM-DD
- **Autor:** <apellido y nombre>
- **Sprint:** <1 a 8>

## Contexto
Qué problema había que resolver y qué restricciones existían al momento
de decidir: requisitos involucrados, tamaño del equipo, plazos, conocimiento
previo. Se escribe en pasado y sin anticipar la decisión.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| ... | ... | ... | ... |

## Decisión
Qué se decidió, enunciado en una oración afirmativa, y el criterio que
terminó siendo determinante.

## Consecuencias
- **Positivas:** qué habilita esta decisión.
- **Negativas:** qué cuesta, qué se vuelve más difícil.
- **Deuda asumida:** qué habrá que rehacer si el contexto cambia.

## Requisitos relacionados
RF-NN, RN-NN, RNF-NN
```

### Anexo C — Plantilla de entrada de bitácora

```markdown
# Bitácora — <Apellido y nombre> — Rol <P1 a P4>

## Sprint N — Unidad <I a VI / Cierre> — Semana del AAAA-MM-DD

### AAAA-MM-DD · <horas> h

**Actividad**
Qué hice concretamente en esta sesión.

**Decisión**
Qué decidí y por qué, si hubo opciones. Si fue estructural: ver ADR-0NN.

**Problema o bloqueo**
Qué me frenó, qué probé y cómo lo resolví. Si sigue abierto, por qué.

**Commits**
`a1b2c3d` descripción · `e4f5g6h` descripción

---
```

**Ejemplo de una entrada que acredita y una que no**

- **No acredita:** «Trabajé en el módulo de canchas. Avancé bastante. Commit: varios.»
- **Acredita:** «Implementé el bloqueo optimista en la reserva de canchas. Primero lo resolví con un SELECT previo, pero la prueba de concurrencia seguía confirmando dos reservas, así que agregué la restricción de exclusión en la base: la condición de carrera estaba entre la consulta y el insert, no en el servicio. Queda documentado en ADR-004. Commits: a1b2c3d, e4f5g6h.»

### Anexo D — Índice del manual de usuario

1. Qué es FitZone Sports y para qué sirve
2. Cómo leer este manual · Glosario de términos
3. Manual del Socio
   - 3.1 Registro y carga del perfil
   - 3.2 Contratación y renovación de la membresía
   - 3.3 Ingreso al gimnasio con el código QR
   - 3.4 Qué hacer si el QR no funciona o no hay señal
   - 3.5 Reserva de clases grupales y lista de espera
   - 3.6 Reserva de canchas y cómo se calcula el precio
   - 3.7 Cancelaciones, plazos y penalidades
   - 3.8 Comprobantes de pago
4. Manual del Recepcionista / Administrador de sede
   - 4.1 Validación de ingreso y lectura del aforo
   - 4.2 Gestión de la agenda de clases
   - 4.3 Inhabilitación de una cancha por mantenimiento
   - 4.4 Problemas frecuentes del mostrador y cómo resolverlos
5. Manual del Gerente central
   - 5.1 Alta y configuración de una sede
   - 5.2 Definición de precios, descuentos y horario pico
   - 5.3 Lectura de los reportes consolidados
6. Preguntas frecuentes

### Anexo E — Índice del manual de instalación y operación

1. Requisitos previos · Versiones exactas de software
2. Puesta en marcha en entorno de desarrollo
3. Puesta en marcha en entorno de producción
4. Variables de entorno: tabla completa
5. Base de datos: migraciones, reversión y datos semilla
6. Despliegue: estrategia adoptada y procedimiento de reversión
7. Respaldo y restauración
8. Operación degradada: caída de la conexión principal y resincronización
9. Alta de una sede nueva sin detener el sistema
10. Monitoreo: registros, métricas y verificación de estado
11. Resolución de problemas de instalación

### Anexo F — Índice del manual técnico

1. Visión arquitectónica · Diagramas C4 · Índice de ADR
2. Los cinco módulos funcionales y sus responsabilidades
3. Modelo de datos y convenciones de persistencia
4. Patrones de diseño aplicados y su ubicación en el código
   - 4.1 Strategy — precio dinámico de canchas
   - 4.2 Observer — lista de espera de clases
   - 4.3 Repository — abstracción de la persistencia
   - 4.4 Patrones creacionales y estructurales
5. Control de concurrencia en las reservas
6. Arquitectura offline del control de acceso
7. Guía de extensión
   - 7.1 Caso resuelto: agregar canchas de tenis
   - 7.2 Caso resuelto: agregar una estrategia de precio
8. Pruebas: cómo correrlas y cómo leer la cobertura
9. Pipeline de integración y entrega continuas
10. Convenciones de código, ramas y mensajes de commit

### Anexo G — Checklist imprimible

Marcar en equipo antes de crear el tag. Una casilla sin marcar es un punto a resolver, no un detalle.

**Repositorio y entrega**

- [ ] La estructura de carpetas coincide con el punto 4 de este documento
- [ ] El tag `v1.0-entrega` está creado, anotado y empujado al remoto
- [ ] La cátedra tiene acceso de lectura al repositorio
- [ ] El dossier PDF está subido a Moodle con URL, tag y hash del commit
- [ ] Los archivos subidos respetan la nomenclatura del punto 3.3

**Código**

- [ ] `docker compose up --build` levanta el sistema en una máquina limpia
- [ ] El set de prueba carga 25 sedes con canchas, clases y los cuatro roles
- [ ] La suite de pruebas corre completa y en verde
- [ ] El reporte de cobertura está generado y supera el umbral declarado en ADR-008
- [ ] No hay credenciales, claves ni tokens reales versionados
- [ ] `swagger.json` está exportado y Swagger UI responde

**Funcionalidad**

- [ ] Los catorce requisitos funcionales son demostrables
- [ ] Dos reservas simultáneas de la misma cancha confirman una sola (RN-02)
- [ ] Un socio no puede estar dentro de dos sedes a la vez (RN-01)
- [ ] El socio con cuota vencida paga tarifa de externo (RN-03)
- [ ] La consulta de disponibilidad responde en milisegundos (RNF-03)
- [ ] Se puede dar de alta una sede sin detener el sistema (RNF-04)

**Documentación**

- [ ] Los ADR obligatorios están, con alternativas y consecuencias
- [ ] Ningún ADR quedó en estado «Propuesto» sin resolver
- [ ] Los diagramas obligatorios están, con fuente editable y exportación
- [ ] Los diagramas coinciden con el código efectivamente entregado
- [ ] Los tres manuales están completos
- [ ] El manual de usuario tiene capturas del sistema entregado
- [ ] El manual técnico resuelve los dos casos de extensión

**Bitácoras**

- [ ] Hay cuatro archivos de bitácora, uno por integrante
- [ ] Cada bitácora tiene al menos ocho entradas
- [ ] Las entradas están distribuidas a lo largo del cuatrimestre
- [ ] Cada entrada enlaza commits que existen en el repositorio
- [ ] Las bitácoras son distintas entre sí
- [ ] Cada bitácora registra al menos una decisión y un problema por unidad

**Defensa**

- [ ] Los integrantes pueden explicar cualquier parte del sistema
- [ ] La demo de cinco minutos está ensayada y cronometrada
- [ ] Están preparadas las respuestas de revisión técnica
- [ ] Está analizado el escenario de extensión a canchas de tenis
- [ ] Hay plan B ante un fallo de conectividad durante la presentación

---

*Programación V · Licenciatura en Sistemas · Facultad de Ciencias de la Administración · UNER · 2026*
