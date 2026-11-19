# Diagramas

Cada diagrama tiene su fuente editable en Mermaid (`.mmd`) y su exportación en SVG. Autor, fecha y versión van en el título del diagrama y en el encabezado de la fuente.

| Diagrama | Fuente | Exportación | Autor · Fecha · Versión |
|---|---|---|---|
| C4-1 Contexto | [c4-1-contexto.mmd](c4-1-contexto.mmd) | [SVG](c4-1-contexto.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| C4-2 Contenedores | [c4-2-contenedores.mmd](c4-2-contenedores.mmd) | [SVG](c4-2-contenedores.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| C4-3 Componentes — Canchas | [c4-3-componentes-canchas.mmd](c4-3-componentes-canchas.mmd) | [SVG](c4-3-componentes-canchas.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| C4-3 Componentes — Acceso | [c4-3-componentes-acceso.mmd](c4-3-componentes-acceso.mmd) | [SVG](c4-3-componentes-acceso.svg) | Leiva, Marcos Joel · 2026-11-19 · 1.1 |
| DER físico | [der-fisico.mmd](der-fisico.mmd) | [SVG](der-fisico.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0; Bravo, Agustín · 2026-11-19 · 1.1 |
| Despliegue | [despliegue.mmd](despliegue.mmd) | [SVG](despliegue.svg) | Leiva, Marcos Joel · 2026-11-19 · 1.1 |
| Pipeline CI/CD | [pipeline-ci-cd.mmd](pipeline-ci-cd.mmd) | [SVG](pipeline-ci-cd.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| UML Clases del dominio (Strategy, Observer y Repository) | [uml-clases-dominio.mmd](uml-clases-dominio.mmd) | [SVG](uml-clases-dominio.svg) · [JPG](uml-clases-dominio.jpg) | Bravo, Agustín · 2026-11-19 · 1.0 |
| UML Secuencia — Reserva de cancha con pago | [uml-secuencia-reserva-cancha-pago.mmd](uml-secuencia-reserva-cancha-pago.mmd) | [SVG](uml-secuencia-reserva-cancha-pago.svg) · [JPG](uml-secuencia-reserva-cancha-pago.jpg) | Bravo, Agustín · 2026-11-19 · 1.0 |
| UML Secuencia — Reserva concurrente (RN-02) | [uml-secuencia-reserva-concurrente.mmd](uml-secuencia-reserva-concurrente.mmd) | [SVG](uml-secuencia-reserva-concurrente.svg) · [JPG](uml-secuencia-reserva-concurrente.jpg) | Bravo, Agustín · 2026-11-19 · 1.0 |
| UML Secuencia — Validación de acceso offline (RNF-01) | [uml-secuencia-acceso-offline.mmd](uml-secuencia-acceso-offline.mmd) | [SVG](uml-secuencia-acceso-offline.svg) · [JPG](uml-secuencia-acceso-offline.jpg) | Bravo, Agustín · 2026-11-19 · 1.0 |
| UML Estados — Membresía | [uml-estados-membresia.mmd](uml-estados-membresia.mmd) | [SVG](uml-estados-membresia.svg) · [JPG](uml-estados-membresia.jpg) | Bravo, Agustín · 2026-11-19 · 1.0 |
| UML Estados — Reserva de cancha y de clase | [uml-estados-reserva.mmd](uml-estados-reserva.mmd) | [SVG](uml-estados-reserva.svg) · [JPG](uml-estados-reserva.jpg) | Bravo, Agustín · 2026-11-19 · 1.0 |
| UML Actividad — Lista de espera (Observer) | [uml-actividad-lista-espera.mmd](uml-actividad-lista-espera.mmd) | [SVG](uml-actividad-lista-espera.svg) · [JPG](uml-actividad-lista-espera.jpg) | Bravo, Agustín · 2026-11-19 · 1.0 |

Los siete UML describen el código de `main` al 2026-11-19. Se exportaron con Mermaid 11.4.1 desde el navegador, con `htmlLabels` desactivado para que el texto quede como texto del SVG.

## Notación

Los C4 están dibujados como `flowchart` de Mermaid con los colores de la notación C4: azul oscuro para personas, azul para el sistema y sus contenedores, celeste para componentes y gris para sistemas externos. Se eligió así porque el renderizador C4 nativo de Mermaid superpone las etiquetas de las relaciones. En el C4-3 de Acceso, el recuadro verde punteado marca el camino offline del terminal de sede que cumple RNF-01 (ADR-007, que reemplaza a ADR-003).

## Qué refleja cada uno

- Los diagramas describen el código de `develop` al 2026-11-10, no el diseño inicial del Drive. El C4-3 de Acceso y el de despliegue se actualizaron al 2026-11-19 con el modo offline (PR #102 y #103). Las diferencias con ese diseño están en los ADR reemplazados (ADR-011, ADR-013, ADR-017).
- **DER:** es el esquema que genera Hibernate (ADR-016). Las restricciones con nombre (`fk_*`, `ck_gym_accesos_una_reserva`, `ck_pag_transacciones_origen`) salen de las entidades y de `docs/sql/SCRUM-93-restricciones.sql`. Índices declarados: las PK y las únicas (`auth_id`, `dni`, `codigo_reserva`). La no sobreventa de canchas la garantiza hoy el bloqueo pesimista del servicio (ADR-004). La restricción `EXCLUDE USING gist` en la base y el índice de disponibilidad de RNF-03 están pendientes, y el diagrama lo indica sobre `fz_cch_reservas`.
- **Despliegue:** muestra Render + Vercel + Supabase publicados desde `main`, la máquina local con `docker compose up --build` y qué sigue funcionando en la sede si se cae la conexión principal.

## Cómo regenerar las exportaciones

```bash
npx -p @mermaid-js/mermaid-cli@11.4.2 mmdc -i c4-1-contexto.mmd -o c4-1-contexto.svg -b white
```

Si Puppeteer no descarga su navegador, se le puede indicar el Chrome instalado con `-p puppeteer.json`, donde `puppeteer.json` contiene `{"executablePath": "<ruta a chrome>"}`. Las fuentes también se pueden editar y previsualizar en https://mermaid.live.
