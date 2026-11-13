# Diagramas

Cada diagrama tiene su fuente editable en Mermaid (`.mmd`) y su exportación en SVG. Autor, fecha y versión van en el título del diagrama y en el encabezado de la fuente.

| Diagrama | Fuente | Exportación | Autor · Fecha · Versión |
|---|---|---|---|
| C4-1 Contexto | [c4-1-contexto.mmd](c4-1-contexto.mmd) | [SVG](c4-1-contexto.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| C4-2 Contenedores | [c4-2-contenedores.mmd](c4-2-contenedores.mmd) | [SVG](c4-2-contenedores.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| C4-3 Componentes — Canchas | [c4-3-componentes-canchas.mmd](c4-3-componentes-canchas.mmd) | [SVG](c4-3-componentes-canchas.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| C4-3 Componentes — Acceso | [c4-3-componentes-acceso.mmd](c4-3-componentes-acceso.mmd) | [SVG](c4-3-componentes-acceso.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| DER físico | [der-fisico.mmd](der-fisico.mmd) | [SVG](der-fisico.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| Despliegue | [despliegue.mmd](despliegue.mmd) | [SVG](despliegue.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |
| Pipeline CI/CD | [pipeline-ci-cd.mmd](pipeline-ci-cd.mmd) | [SVG](pipeline-ci-cd.svg) | Leiva, Marcos Joel · 2026-11-10 · 1.0 |

## Notación

Los C4 están dibujados como `flowchart` de Mermaid con los colores de la notación C4: azul oscuro para personas, azul para el sistema y sus contenedores, celeste para componentes y gris para sistemas externos. Se eligió así porque el renderizador C4 nativo de Mermaid superpone las etiquetas de las relaciones. En el C4-3 de Acceso, el recuadro rojo punteado marca el camino offline que pide RNF-01 y que no está implementado (ADR-003).

## Qué refleja cada uno

- Los diagramas describen el código de `develop` al 2026-11-10, no el diseño inicial del Drive. Las diferencias con ese diseño están en los ADR reemplazados (ADR-011, ADR-013, ADR-017).
- **DER:** es el esquema que genera Hibernate (ADR-016). Las restricciones con nombre (`fk_*`, `ck_gym_accesos_una_reserva`, `ck_pag_transacciones_origen`) salen de las entidades y de `docs/sql/SCRUM-93-restricciones.sql`. Índices declarados: las PK y las únicas (`auth_id`, `dni`, `codigo_reserva`). La no sobreventa de canchas la garantiza hoy el bloqueo pesimista del servicio (ADR-004). La restricción `EXCLUDE USING gist` en la base y el índice de disponibilidad de RNF-03 están pendientes, y el diagrama lo indica sobre `fz_cch_reservas`.
- **Despliegue:** muestra el entorno dev (Render + Vercel + Supabase), que sigue `develop`. Al publicar el MVP desde `main` la topología es la misma.

## Cómo regenerar las exportaciones

```bash
npx -p @mermaid-js/mermaid-cli@11.4.2 mmdc -i c4-1-contexto.mmd -o c4-1-contexto.svg -b white
```

Si Puppeteer no descarga su navegador, se le puede indicar el Chrome instalado con `-p puppeteer.json`, donde `puppeteer.json` contiene `{"executablePath": "<ruta a chrome>"}`. Las fuentes también se pueden editar y previsualizar en https://mermaid.live.
