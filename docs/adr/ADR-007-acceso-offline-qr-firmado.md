# ADR-007 — Control de acceso sin conexión: QR firmado en el dispositivo y terminal con cola de ingresos

- **Estado:** Aceptado (reemplaza a ADR-003)
- **Fecha:** 2026-11-19
- **Autor:** Leiva, Marcos Joel
- **Sprint:** 8

## Contexto
ADR-003 decidió mantener el control de acceso en línea y dejó RNF-01 sin cumplir: si se caía la conexión principal, la sede no podía validar ingresos. También dejó anotado el camino para cumplirlo: un pase firmado que el terminal pueda verificar sin el backend, una cola local de ingresos que se sincronice al reconectar revalidando RN-01, y un cliente que guarde el pase. Con la integración y la documentación ya cerradas, quedó margen para implementarlo antes del congelamiento (PR #102 y #103). La restricción seguía siendo no sumar un tercer cliente: lo que se hiciera tenía que vivir en el frontend web y en el backend actuales.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Seguir en línea (ADR-003) | No agrega código ni conflictos de sincronización | RNF-01 sigue sin cumplir | Ya había margen para cumplirlo |
| Secreto HMAC compartido en el terminal | El terminal verifica el QR actual sin cambios en el formato | El secreto en un navegador permite falsificar el QR de cualquier socio | Riesgo de seguridad inaceptable |
| App móvil nativa con el pase | Cumple RNF-01 y la Unidad VI | Un tercer cliente completo para construir y empaquetar | No entraba en el plazo |
| **QR firmado por el dispositivo (ECDSA P-256) + terminal con lista local y cola** | Ningún secreto sale del servidor ni del celular; reutiliza los dos clientes web | Más piezas: claves, lista, cola, sincronización y revalidación | — |

## Decisión
Vamos a firmar el QR en el dispositivo del socio y a darle al terminal de sede lo necesario para validar sin conexión:

1. **Pase del socio** (`paseOffline.ts`): el navegador genera un par de claves ECDSA P-256. La privada se crea no exportable y queda en IndexedDB; la pública se registra con `PUT /v1/usuarios/me/clave-qr` (`QrFirmadoService`). El QR de cada minuto es `F2.<idUsuario>.<ventana>.<nonce>.<firma>` y se firma sin servidor.
2. **Terminal de sede** (`terminalLocal.ts`): cada 5 minutos baja `GET /v1/accesos/terminal/habilitados` (socios con membresía vigente y su clave pública, accesos abiertos y aforo) y la guarda en localStorage. La lista vale 24 horas.
3. **Detección de caída** (`conectividad.ts`): un circuit breaker pasa a modo offline solo ante una falla de transporte. Un rechazo de negocio (409, 422) no activa el modo offline, para que no se pueda saltear una regla cortando la red.
4. **Cola de ingresos** (`colaIngresos.ts`, patrón Outbox): sin conexión, el terminal verifica la firma con WebCrypto contra la clave pública de la lista, aplica RN-01 y aforo sobre los datos locales, y encola el ingreso. Al reconectar manda lotes de hasta 50 a `POST /v1/accesos/sincronizacion`.
5. **Revalidación en el servidor** (`TerminalSedeService`): cada evento se confirma en su propia transacción, verificando la firma contra el minuto del escaneo y aplicando RN-01 con el bloqueo pesimista de siempre. Es idempotente por `tokenQr` (un reenvío responde `DUPLICADO`). Los rechazos quedan visibles en la cola para que el recepcionista los resuelva: ningún conflicto se resuelve solo.

## Consecuencias
- **Positivas:** RNF-01 se cumple con los clientes existentes. Si se cae la conexión principal, la sede sigue validando ingresos con la lista local. El servidor sigue siendo la única fuente de verdad para RN-01: lo aprobado offline es provisorio hasta que se confirma. La clave privada no sale del celular y el terminal no guarda secretos.
- **Negativas:** un socio puede quedar adentro offline aunque el servidor después rechace el evento (por ejemplo, si tenía otro ingreso abierto en otra sede). Eso se ve en la cola y lo resuelve la recepción. La lista local tiene hasta 5 minutos de atraso, y una membresía dada de baja en ese lapso todavía figura como habilitada.
- **Deuda asumida:** no hay service worker. El socio tiene que haber abierto "Mi Pase QR" con conexión al menos una vez en ese dispositivo para registrar la clave, y la pestaña tiene que estar cargada para mostrar el QR sin señal. Tampoco hay cliente móvil empaquetado (APK): la Unidad VI se cubre con la aplicación web en el celular.

## Requisitos relacionados
RNF-01, RF-04, RF-05, RN-01
