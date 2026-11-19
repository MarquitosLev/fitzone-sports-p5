# Evidencia de los requisitos no funcionales

Cada RNF de la especificación de la cátedra con dónde se cumple en el código, cómo se verifica y qué queda pendiente. Relevado sobre `main` (`f474f23`) el 2026-11-19.

| RNF | Tema | Estado | Decisión |
|---|---|---|---|
| [RNF-01](#rnf-01--disponibilidad-acceso-sin-conexión) | Disponibilidad: el acceso funciona sin la conexión principal | Cumple | [ADR-020](../adr/ADR-020-acceso-offline-qr-firmado.md) |
| [RNF-02](#rnf-02--seguridad-sin-datos-de-tarjeta) | Seguridad: no se guardan datos de tarjeta | Cumple | [ADR-009](../adr/ADR-009-medios-de-pago.md) |
| [RNF-03](#rnf-03--rendimiento-disponibilidad-de-canchas) | Rendimiento: disponibilidad de canchas en milisegundos | Parcial | [ADR-004](../adr/ADR-004-concurrencia-reserva-canchas.md), [ADR-016](../adr/ADR-016-esquema-generado-por-jpa.md) |
| [RNF-04](#rnf-04--escalabilidad-nueva-sede-sin-detener-el-sistema) | Escalabilidad: nueva sede sin detener el sistema | Cumple | [ADR-001](../adr/ADR-001-monolito-modular.md), [ADR-015](../adr/ADR-015-aislamiento-por-sede-en-servicios.md) |

---

## RNF-01 — Disponibilidad: acceso sin conexión

> El control de acceso debe funcionar aunque falle la conexión principal a internet.

**Cómo se cumple.** El celular del socio firma el QR de cada minuto con una clave ECDSA P-256 propia, sin servidor. El terminal de sede guarda una lista local de socios habilitados con su clave pública, verifica la firma sin conexión, aplica RN-01 y aforo sobre los datos locales y encola el ingreso. Al reconectar, el servidor revalida cada evento con el mismo bloqueo pesimista del flujo en línea.

| Pieza | Ubicación |
|---|---|
| Firma del QR en el dispositivo | `fz-frontend/src/services/offline/paseOffline.ts` |
| Registro de la clave pública | `PUT /v1/usuarios/me/clave-qr` → `ClaveQrController`, `QrFirmadoService` |
| Lista de habilitados | `GET /v1/accesos/terminal/habilitados` → `TerminalSedeService.habilitados` |
| Detección de caída (circuit breaker) | `fz-frontend/src/services/offline/conectividad.ts` |
| Validación local y cola (Outbox) | `terminalLocal.ts`, `colaIngresos.ts` |
| Sincronización y revalidación | `POST /v1/accesos/sincronizacion` → `TerminalSedeService.sincronizar` |

**Verificación.**
- Pruebas automáticas: `QrFirmadoServiceTest`, `TerminalSedeServiceTest`, `TerminalSedeSeguridadTest` (backend); `paseFirmado.test.ts`, `terminalOffline.test.ts` (frontend).
- Prueba manual: abrir *Mi Pase QR* con conexión, poner el celular en modo avión y mostrar el QR; en el terminal, cortar la red y validarlo. El ingreso aparece en *Ingresos sin confirmar* y se confirma al reconectar.
- Diagramas: [C4-3 Acceso](../diagramas/c4-3-componentes-acceso.svg) y [despliegue](../diagramas/despliegue.svg).

**Pendiente.** No hay service worker: *Mi Pase QR* tiene que haberse abierto con conexión una vez en el dispositivo y estar cargado para mostrarse sin señal. No hay app móvil empaquetada.

---

## RNF-02 — Seguridad: sin datos de tarjeta

> Los datos de tarjeta de crédito no se almacenan localmente; solo se guarda el token de la pasarela.

**Cómo se cumple.** El cobro pasa por la interfaz `PasarelaPago`. Hoy la implementa `PasarelaMock` (Mercado Pago no está integrado), que devuelve un token `tok_mock_*`. La entidad `Transaccion` guarda solo ese token en `token_transaccion_pasarela`.

**Verificación.**
- Esquema: ninguna tabla tiene columnas de número de tarjeta, vencimiento ni CVV (ver [DER](../diagramas/der-fisico.svg)). Las columnas de `fz_pag_transacciones` son id, usuario, sede, monto, concepto, estado, fechas, origen (membresía o reserva), `codigo_reintento` y `token_transaccion_pasarela`.
- API: los request de pago (`fz-backend/swagger.json`) no tienen campos de tarjeta.
- Pruebas: `PagoServiceTest`, `CheckoutInvitadoServiceTest`.
- Secretos: la clave de Supabase y `QR_SECRET` viven en variables de entorno ([.env.example](../../.env.example)), nunca en el código ni en variables `VITE_*`.

---

## RNF-03 — Rendimiento: disponibilidad de canchas

> La consulta de disponibilidad de canchas debe responder en pocos milisegundos (índices en base de datos).

**Cómo se cumple hoy.** La grilla sale de una sola consulta por cancha y día (`ReservaCanchaRepository.findQueOcupanTurno`), filtrada por `id_cancha` y rango de `fecha_hora_inicio`.

**Medición** (2026-11-19, base de Supabase, `EXPLAIN ANALYZE` de la consulta de disponibilidad):

| Medida | Valor |
|---|---|
| Tiempo de ejecución en la base | 0,11 ms |
| Plan | Escaneo secuencial de `fz_cch_reservas` (13 filas) |
| Respuesta completa de `GET /v1/canchas/1/disponibilidad` desde Argentina a Render (Oregón) | ~0,55 s, casi todo latencia de red |

**Pendiente.** Con el volumen actual responde en fracciones de milisegundo, pero no por un índice: la tabla solo tiene la PK y la única de `codigo_reserva`. Con 25 sedes y meses de reservas, el escaneo secuencial crece con la tabla. Falta el índice compuesto que pide el RNF:

```sql
CREATE INDEX IF NOT EXISTS idx_cch_reservas_cancha_inicio
    ON fz_cch_reservas (id_cancha, fecha_hora_inicio);
```

En el código equivale a `@Table(indexes = @Index(name = "idx_cch_reservas_cancha_inicio", columnList = "id_cancha, fecha_hora_inicio"))` en `ReservaCancha`. También queda pendiente la restricción `EXCLUDE USING gist` contra la sobreventa: hoy la garantía es el bloqueo pesimista del servicio (ADR-004).

---

## RNF-04 — Escalabilidad: nueva sede sin detener el sistema

> La arquitectura permite agregar una nueva sede sin detener el sistema (configuración por base de datos).

**Cómo se cumple.** Una sede es una fila de `fz_sedes` (nombre y aforo). El gerente la da de alta con `POST /v1/sedes` (`SedeController`, `@PreAuthorize("hasRole('GERENTE')")`) mientras el sistema está en marcha. Canchas, clases, accesos, transacciones y personal la referencian por `id_sede`, y el aislamiento por sede se aplica en los servicios (ADR-015), no con configuración por sede.

**Verificación.**
- Pruebas: no hay una prueba automática del alta de sede (`SedeService` no tiene test propio). Queda cubierto por la prueba manual.
- Prueba manual: como gerente, crear una sede, agregarle una cancha y verla en la grilla pública sin reiniciar el backend.
- Los tipos de cancha son texto configurable (`Cancha.tipo`): sumar tenis no requiere cambios de código ([manual técnico, 7.1](../manuales/manual-tecnico.md)).
