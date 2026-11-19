# Entregables

Dossier PDF que se sube al campus (punto 3.2 y Anexo A de los [lineamientos](../Lineamientos_Entrega_TIF_FitZone_Sports.md)).

| Archivo | Qué es |
|---|---|
| [dossier.md](dossier.md) | Portada, índice y resumen ejecutivo. Lo único del dossier que se escribe a mano |
| [generar_dossier.py](generar_dossier.py) | Arma el PDF sumando lo que ya está en el repo: diagramas C4 y UML, ADR, DER, despliegue y pipeline, patrones y pruebas del manual técnico, evidencia de RNF, planificación, bitácoras y tablero |
| `PROGV-2026-TIF-Equipo05-Dossier.pdf` | El PDF generado. No se versiona: lleva el hash del commit etiquetado, que no existe hasta crear el tag |

El dossier no duplica contenido: si cambia un ADR, un diagrama o una bitácora, se vuelve a generar y sale actualizado.

## Cómo generarlo

Después de crear el tag `v1.0-entrega`, desde la raíz del repo:

```bash
pip install markdown
python docs/entregables/generar_dossier.py --hash "$(git rev-parse v1.0-entrega)" --legajos legajos.txt
```

- `legajos.txt` es opcional y va fuera del repo: una línea por integrante con `APELLIDO=legajo` (por ejemplo, `LEIVA=12345`). Los legajos que falten salen como «a completar».
- Hace falta Chrome o Edge para imprimir a PDF.

## Qué se sube a Moodle

1. `PROGV-2026-TIF-Equipo05-Dossier.pdf` (dossier completo).
2. `PROGV-2026-TIF-Equipo05-Planificacion.pdf` (plan y seguimiento; lo genera el mismo script).
3. `PROGV-2026-TIF-Equipo05-Registro.xlsx` (tablero exportado, en `docs/planificacion/tablero/`).
4. La URL del repositorio: https://github.com/MarquitosLev/fitzone-sports-p5
5. El nombre del tag, `v1.0-entrega`, y el hash completo del commit (`git rev-parse v1.0-entrega`).
