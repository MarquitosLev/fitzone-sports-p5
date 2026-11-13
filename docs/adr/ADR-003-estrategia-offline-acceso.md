# ADR-003 — Control de acceso en línea, sin modo offline

- **Estado:** Aceptado
- **Fecha:** 2026-11-10
- **Autor:** Leiva, Marcos Joel
- **Sprint:** 7

## Contexto
RNF-01 y RF-04 piden que el código QR del socio se genere y se valide sin conexión a internet, y que los ingresos se sincronicen después. Lo que había implementado al decidir era esto: `QrTokenService` genera en el backend un token firmado con HMAC-SHA256 (`QR_SECRET`) que vale por una ventana de 60 segundos y lleva un nonce. El frontend web lo muestra en "Mi Pase QR" y lo renueva. La recepción lo valida con `POST /v1/accesos/ingreso`, que además aplica RN-01 con bloqueo pesimista sobre la membresía del socio y sobre la sede (aforo). Todo el circuito depende de llegar al backend. Quedaban nueve días para el congelamiento de código, no había cliente móvil y el equipo tenía pendientes los manuales, los diagramas y la integración.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| App móvil nativa (React Native) con QR firmado guardado en el dispositivo | Cumple RNF-01 al pie de la letra; es lo que planteaba el C4 inicial | Un tercer cliente completo para construir, probar y empaquetar (APK) | No entra en el plazo sin resignar el cierre del resto |
| PWA sobre el frontend actual (service worker + caché de "Mi Pase QR") | Reutiliza el front; el pase se ve sin conexión | Para validar offline, el terminal de sede tendría que verificar la firma sin el backend (clave pública o secreto compartido en el terminal), y eso no existe | Resuelve solo la mitad del requisito (mostrar, no validar) |
| Empaquetar el front con Capacitor | Da un APK real con poco código nuevo | Mismo problema de validación en el terminal; requiere Android SDK y firma | Mismo motivo que la PWA, con más costo de build |
| Terminal de sede con caché de socios y cola de ingresos para sincronizar después | Valida sin conexión y respeta RN-01 al reconectar | Es un componente nuevo (terminal + sincronización + resolución de conflictos de RN-01) | Es la solución correcta, pero la más cara |
| **Mantener el control de acceso en línea** | Ya está implementado y probado; un QR rotativo de 60 s con HMAC impide reusar capturas de pantalla | Sin conexión, la sede no puede validar ingresos | — |

## Decisión
Vamos a mantener el control de acceso en línea: el QR lo genera y lo valida el backend, y no se implementa modo offline en esta entrega. Pesó el plazo: preferimos entregar documentados y funcionando los requisitos que ya estaban integrados antes que sumar un cliente nuevo a medio terminar.

## Consecuencias
- **Positivas:** un solo lugar de verdad para RN-01. No hay sincronización ni conflictos que resolver. El QR rotativo con nonce y firma no se puede falsificar sin `QR_SECRET`.
- **Negativas:** RNF-01 queda **sin cumplir** y la Unidad VI (cliente móvil) queda sin entregable. Si se cae la conexión principal, la sede no puede registrar ingresos con QR.
- **Deuda asumida:** el camino para cumplirlo sería: (1) firmar el pase con una clave asimétrica para que el terminal lo verifique sin el backend; (2) un terminal de sede que guarde los ingresos en una cola local y los sincronice al reconectar, revalidando RN-01 en el servidor; (3) un cliente móvil o PWA que guarde el pase. Mientras tanto, el diagrama de despliegue muestra que este camino no existe.

## Requisitos relacionados
RNF-01, RF-04, RN-01
