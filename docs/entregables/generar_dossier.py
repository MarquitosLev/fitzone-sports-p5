"""Arma el dossier PDF de la entrega (Anexo A de los lineamientos) a partir de la documentación del repo.

No duplica contenido: toma la portada y el resumen de dossier.md y les suma los ADR, los diagramas,
los diagramas UML, la evidencia de RNF, los patrones y las pruebas del manual técnico, la planificación,
las bitácoras y el tablero exportado, tal como están en el repo. Así el PDF sale coherente con el tag, que es lo que pide la cátedra.

Uso (desde la raíz del repo, después de crear el tag):
    pip install markdown
    python docs/entregables/generar_dossier.py --hash "$(git rev-parse v1.0-entrega)" --legajos legajos.txt

legajos.txt (opcional, fuera del repo) tiene una línea por integrante: APELLIDO=legajo, por ejemplo LEIVA=12345.
Necesita Chrome o Edge instalado para imprimir el HTML a PDF.
"""
import argparse
import base64
import csv
import re
import shutil
import subprocess
import sys
from pathlib import Path

import markdown

RAIZ = Path(__file__).resolve().parents[2]
DOCS = RAIZ / "docs"
SALIDA = Path(__file__).resolve().parent

NAVEGADORES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "google-chrome", "chromium", "chromium-browser", "microsoft-edge",
]

CSS = """
@page { size: A4; margin: 18mm 16mm; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1b2631; }
h1 { font-size: 20pt; color: #1f3a5f; border-bottom: 2px solid #1f3a5f; padding-bottom: 4px; page-break-before: always; }
.portada h1, h1.sin-salto { page-break-before: avoid; border: none; }
h2 { font-size: 14pt; color: #1f3a5f; margin-top: 18px; }
h3 { font-size: 12pt; }
table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 9pt; page-break-inside: avoid; }
th, td { border: 1px solid #b3b6b7; padding: 4px 6px; text-align: left; vertical-align: top; }
th { background: #eaf2f8; }
code { font-family: Consolas, monospace; font-size: 9pt; background: #f4f6f6; padding: 0 2px; }
pre { background: #f4f6f6; padding: 8px; font-size: 8.5pt; white-space: pre-wrap; page-break-inside: avoid; }
img.diagrama { max-width: 100%; max-height: 235mm; display: block; margin: 8px auto; }
.portada { text-align: center; margin-top: 30mm; }
.portada table { width: 85%; margin: 14px auto; font-size: 10pt; }
.salto { page-break-after: always; }
.adr, .bitacora, .diagrama-pagina { page-break-before: always; }
.tablero table { font-size: 7.5pt; page-break-inside: auto; }
.tablero tr { page-break-inside: avoid; }
.diagrama-pagina { page-break-inside: avoid; }
"""


def md(texto: str) -> str:
    return markdown.markdown(texto, extensions=["tables", "fenced_code"])


def leer(ruta: Path) -> str:
    return ruta.read_text(encoding="utf-8")


def bajar_titulos(texto: str, niveles: int = 1) -> str:
    """Un documento incluido baja sus títulos para quedar dentro de la sección del dossier."""
    return re.sub(r"^(#{1,5}) ", lambda m: "#" * (len(m.group(1)) + niveles) + " ", texto, flags=re.M)


def seccion_manual(titulo_desde: str, titulo_hasta: str) -> str:
    texto = leer(DOCS / "manuales" / "manual-tecnico.md")
    i = texto.index(titulo_desde)
    j = texto.index(titulo_hasta, i)
    return texto[i:j].split("\n", 1)[1]


def diagrama(nombre: str, titulo: str) -> str:
    svg = (DOCS / "diagramas" / f"{nombre}.svg").read_bytes()
    datos = base64.b64encode(svg).decode()
    fuente = f"docs/diagramas/{nombre}.mmd"
    return (f"<div class='diagrama-pagina'><h2>{titulo}</h2><img class='diagrama' src='data:image/svg+xml;base64,{datos}'/>"
            f"<p><small>Fuente editable: <code>{fuente}</code></small></p></div>")


def planificacion() -> str:
    """Plan de proyecto (Anexo H) con el Gantt incrustado, más el desglose tarjeta por tarjeta."""
    plan = leer(DOCS / "planificacion" / "plan-de-proyecto.md").split("\n", 1)[1]
    gantt = base64.b64encode((DOCS / "planificacion" / "cronograma-gantt.svg").read_bytes()).decode()
    plan = plan.replace("![Cronograma de Gantt](cronograma-gantt.svg)",
                        f"<img class='diagrama' alt='Cronograma de Gantt' src='data:image/svg+xml;base64,{gantt}'/>")
    anexo = leer(DOCS / "planificacion" / "anexo-desglose-del-trabajo.md").split("\n", 1)[1]
    return (md(bajar_titulos(plan)) + "<div class='adr'><h2>Anexo de la planificación: desglose tarjeta por tarjeta</h2>"
            + md(bajar_titulos(anexo, 2)) + "</div>")


def tablero() -> str:
    """Tabla del tablero de Jira exportado (docs/planificacion/tablero/tablero-jira.csv)."""
    with open(DOCS / "planificacion" / "tablero" / "tablero-jira.csv", encoding="utf-8-sig", newline="") as f:
        filas = list(csv.DictReader(f))
    columnas = ["Clave", "Tipo", "Resumen", "Responsable", "Estado", "Sprints", "Creada", "Resuelta"]
    lineas = ["| " + " | ".join(columnas) + " |", "|" + " :-- |" * len(columnas)]
    for fila in filas:
        celdas = [fila[c].replace("|", "/").replace("SCRUM Sprint ", "S") for c in columnas]
        lineas.append("| " + " | ".join(celdas) + " |")
    return "\n".join(lineas)


def html_dossier(valores: dict) -> str:
    partes = []
    portada = leer(SALIDA / "dossier.md")
    for clave, valor in valores.items():
        portada = portada.replace("{" + clave + "}", valor)
    # Los legajos que no se pasaron quedan visibles para completarlos a mano
    portada = re.sub(r"\{LEGAJO_[A-Z]+\}", "a completar", portada)
    tapa, resto = portada.split("<!-- fin-portada -->", 1)
    partes.append(f"<div class='portada'>{md(tapa)}</div><div class='salto'></div>{md(resto)}")

    partes.append("<h1>2. Arquitectura: diagramas C4 de los niveles 1, 2 y 3</h1>")
    partes.append(md("Notación y alcance de cada diagrama en `docs/diagramas/README.md`. Los C4 se dibujaron como flowchart de Mermaid con los colores de la notación C4."))
    for nombre, titulo in [("c4-1-contexto", "C4-1 Contexto"), ("c4-2-contenedores", "C4-2 Contenedores"),
                           ("c4-3-componentes-canchas", "C4-3 Componentes — Canchas (M4)"),
                           ("c4-3-componentes-acceso", "C4-3 Componentes — Acceso (M2)")]:
        partes.append(diagrama(nombre, titulo))

    partes.append("<h1>3. Registros de decisión arquitectónica: ADR-001 a ADR-020</h1>")
    partes.append(md(bajar_titulos(leer(DOCS / "adr" / "README.md").split("\n", 1)[1])))
    for adr in sorted((DOCS / "adr").glob("ADR-*.md")):
        partes.append(f"<div class='adr'>{md(bajar_titulos(leer(adr)))}</div>")

    partes.append("<h1>4. Modelado: clases, secuencia, estados, actividad, DER y despliegue</h1>")
    partes.append(md("Los diagramas UML describen el código de `main` al 2026-11-19; el de clases muestra Strategy, Observer y Repository como estructura. El DER es el esquema que genera Hibernate (ADR-016). El diagrama de despliegue muestra qué sigue funcionando ante una caída de la conexión principal (ADR-007)."))
    for nombre, titulo in [("uml-clases-dominio", "UML de clases del dominio"),
                           ("uml-secuencia-reserva-cancha-pago", "UML de secuencia — Reserva de cancha con pago"),
                           ("uml-secuencia-reserva-concurrente", "UML de secuencia — Reserva concurrente (RN-02)"),
                           ("uml-secuencia-acceso-offline", "UML de secuencia — Validación de acceso offline (RNF-01)"),
                           ("uml-estados-membresia", "UML de estados — Membresía"),
                           ("uml-estados-reserva", "UML de estados — Reserva de cancha y de clase"),
                           ("uml-actividad-lista-espera", "UML de actividad — Lista de espera"),
                           ("der-fisico", "Diagrama entidad-relación (físico)"), ("despliegue", "Diagrama de despliegue"),
                           ("pipeline-ci-cd", "Arquitectura del pipeline CI/CD")]:
        partes.append(diagrama(nombre, titulo))

    partes.append("<h1>5. Patrones de diseño aplicados y su justificación</h1>")
    partes.append(md(bajar_titulos(seccion_manual("## 4. Patrones de diseño", "## 5. "), -1)))

    partes.append("<h1>6. Estrategia de pruebas y reporte de cobertura</h1>")
    partes.append(md(bajar_titulos(seccion_manual("## 8. Pruebas y cobertura", "## 9. "), -1)))
    partes.append(md("Decisión y umbral: ADR-008 (sección 3). Los reportes completos se publican como artefactos en cada ejecución del pipeline."))

    partes.append("<h1>7. Cumplimiento de los requisitos no funcionales, con su evidencia</h1>")
    partes.append(md(bajar_titulos(leer(DOCS / "rnf" / "README.md").split("\n", 1)[1])))

    partes.append("<h1>8. Planificación: plan, cronograma, trazabilidad, seguimiento y riesgos</h1>")
    partes.append(md("Plan de proyecto con el formato del Anexo H, en `docs/planificacion/`. El tablero exportado está en la sección 11."))
    partes.append(planificacion())

    partes.append("<h1>9. Bitácoras individuales de los seis integrantes</h1>")
    partes.append(md("Una por integrante, en `docs/bitacoras/LOG-<apellido>.md`. Cada entrada enlaza los commits del repositorio."))
    for log in sorted((DOCS / "bitacoras").glob("LOG-*.md")):
        partes.append(f"<div class='bitacora'>{md(bajar_titulos(leer(log)))}</div>")

    partes.append("<h1>10. Índice de los manuales entregados, con su ubicación en el repositorio</h1>")
    partes.append(md("""| Manual | Ubicación en el repositorio | Contenido |
| :-- | :-- | :-- |
| Usuario | `docs/manuales/manual-usuario.md` | Recorridos por rol (socio, externo, recepcionista, gerente) con capturas y credenciales de prueba |
| Instalación y operación | `docs/manuales/manual-instalacion-operacion.md` | Requisitos, variables, `docker compose up --build`, despliegue en Render y Vercel, respaldo, rollback y operación degradada |
| Técnico | `docs/manuales/manual-tecnico.md` | Arquitectura, módulos, persistencia, patrones, concurrencia, modo offline, guía de extensión, pruebas y pipeline |

Además: `README.md` (puesta en marcha), `docs/DATOS_DE_PRUEBA.md` (usuarios y datos de la semilla), `fz-backend/swagger.json` (contrato OpenAPI) y `docs/bruno/` (colecciones por módulo)."""))

    partes.append("<h1>11. Anexo: tablero del proyecto exportado</h1>")
    partes.append(md("El tablero es el proyecto `SCRUM` de Jira (`integrador-p5.atlassian.net`), usado desde el 28/08/2026. Las ramas, commits y Pull Requests llevan el código del ticket (`SCRUM-<N>`), así que cada cambio del repositorio se cruza con su historia. La exportación completa, con épica, requisitos y criterio de aceptación de cada tarjeta, está en `docs/planificacion/tablero/PROGV-2026-TIF-Equipo05-Registro.xlsx` y en `tablero-jira.csv`. Las 122 tarjetas:"))
    partes.append(f"<div class='tablero'>{md(tablero())}</div>")

    return envolver("\n".join(partes), "Dossier FitZone Sports")


def envolver(cuerpo: str, titulo: str) -> str:
    return f"<!doctype html><html lang='es'><head><meta charset='utf-8'><title>{titulo}</title><style>{CSS}</style></head><body>{cuerpo}</body></html>"


def imprimir_pdf(html: Path, pdf: Path) -> None:
    navegador = next((n for n in NAVEGADORES if Path(n).exists() or shutil.which(n)), None)
    if not navegador:
        sys.exit("No se encontró Chrome ni Edge para imprimir el PDF; abrir el HTML y usar Imprimir > Guardar como PDF.")
    subprocess.run([navegador, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf}", html.as_uri()], check=True, capture_output=True)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--hash", default="a completar: git rev-parse v1.0-entrega", help="hash completo del commit etiquetado")
    p.add_argument("--tag", default="v1.0-entrega")
    p.add_argument("--equipo", default="05")
    p.add_argument("--legajos", type=Path, help="archivo APELLIDO=legajo, uno por línea")
    args = p.parse_args()

    valores = {"HASH": args.hash, "TAG": args.tag, "EQUIPO": args.equipo}
    if args.legajos:
        for linea in args.legajos.read_text(encoding="utf-8").splitlines():
            if "=" in linea:
                apellido, legajo = linea.split("=", 1)
                valores["LEGAJO_" + apellido.strip().upper()] = legajo.strip()

    # El dossier completo y la planificación como archivo aparte, con los nombres del punto 3.3
    plan = ("<h1 class='sin-salto'>Planificación del proyecto — FitZone Sports — Equipo " + args.equipo + "</h1>"
            + planificacion() + "<h1>Anexo: tablero del proyecto exportado</h1>" + f"<div class='tablero'>{md(tablero())}</div>")
    documentos = {
        f"PROGV-2026-TIF-Equipo{args.equipo}-Dossier": html_dossier(valores),
        f"PROGV-2026-TIF-Equipo{args.equipo}-Planificacion": envolver(plan, "Planificación FitZone Sports"),
    }
    for nombre, contenido in documentos.items():
        html = SALIDA / f"{nombre}.html"
        html.write_text(contenido, encoding="utf-8")
        pdf = SALIDA / f"{nombre}.pdf"
        imprimir_pdf(html, pdf)
        html.unlink()
        print(f"Listo: {pdf}")


if __name__ == "__main__":
    main()
