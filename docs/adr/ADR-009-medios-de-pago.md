# ADR-009 — Delegar el cobro en una pasarela externa, sin guardar datos de tarjeta

- **Estado:** Aceptado
- **Fecha:** 2026-09-06
- **Registrado:** 2026-11-10
- **Autor:** Equipo Grupo 5 (acta de la reunión del 2026-09-06; registrado originalmente como "ADR-003" en el documento del Drive)
- **Sprint:** 2

## Contexto
El sistema cobra el alquiler de canchas a socios y clientes externos, y la renovación de membresías. RNF-02 prohíbe guardar números de tarjeta o credenciales de pago en la base de la plataforma, y RF-13 pide integrarse con una pasarela simulada al estilo de Mercado Pago o MODO. RF-14 pide un comprobante PDF por cada pago. Al decidir no había cuenta de desarrollador de Mercado Pago ni tiempo para homologar una integración real.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Capturar la tarjeta en el backend y procesarla | Control total del flujo | Viola RNF-02; obliga a cumplir PCI-DSS | Prohibida por el requisito |
| Checkout Pro / redirección total al sitio de la pasarela | La integración web más simple | Experiencia fragmentada en el móvil; es más difícil saber si el turno quedó pagado cuando el usuario abandona | Como solución única, dificultaba el control de turnos |
| Integración real con el SDK de Mercado Pago | Lo más cercano a producción | Credenciales, homologación y webhooks públicos | Fuera del alcance y del plazo |
| Cobro "interno" sin pasarela (marcar como pagado) | Nada para integrar | No cumple RF-13 | No emula una pasarela |
| **Interfaz `PasarelaPago` con una implementación `PasarelaMock`** | El dominio no ve datos de tarjeta; la implementación real se cambia sin tocar los servicios | El mock no reproduce latencias ni webhooks reales | — |

## Decisión
Vamos a delegar el cobro en una pasarela externa detrás de la interfaz `PasarelaPago`. En esta entrega la implementa `PasarelaMock`, que aprueba o rechaza y devuelve un identificador de operación. El backend guarda solo la `Transaccion` (monto, concepto, estado, identificador de la pasarela, usuario, sede y la membresía o reserva pagada) y genera el `Comprobante` en PDF con OpenPDF. Nunca recibe ni persiste número de tarjeta, CVV ni vencimiento. Lo decidió RNF-02: lo que no se guarda no se puede filtrar.

## Consecuencias
- **Positivas:** se cumple RNF-02 por construcción. Cambiar a Mercado Pago es agregar una implementación de `PasarelaPago`. Un pago rechazado deja su transacción como evidencia y se puede reintentar sobre la misma reserva (ADR-012).
- **Negativas:** el mock responde en el acto, así que el flujo asincrónico real (webhooks, pagos pendientes) no está probado. Si la pasarela real se cae, se frena el cobro de reservas y renovaciones.
- **Deuda asumida:** con una pasarela real hay que agregar el endpoint de webhook con verificación de firma, idempotencia por identificador de operación y una expiración de las reservas impagas que hoy bloquean el horario.

## Requisitos relacionados
RNF-02, RF-13, RF-14
