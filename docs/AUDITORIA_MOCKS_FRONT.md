# Auditoría de mocks y hardcodeos del frontend

Fecha: 2026-11-06. Base revisada: rama `SCRUM-104` (incluye #60 a #64), más los cambios de `SCRUM-92` (#65) y `SCRUM-102` (#67) leídos sobre sus ramas. `develop` está en `7b541fb` y todavía no tiene ningún PR del sprint.

Severidad:
- **A**: lo ve o lo usa un usuario real con `VITE_USE_MOCK=false`.
- **B**: solo existe en modo mock, pero hace mantener dos versiones de la lógica.
- **C**: código muerto o de demostración.

## 1. Lo que ve un usuario real (severidad A)

| # | Dónde | Qué pasa |
| :-- | :-- | :-- |
| A1 | `components/auth/LoginForm.tsx:22-31, 93-114` y `pages/LoginPage.tsx:78` | El login muestra "Acceso rápido de prueba por rol" con emails y `password123` en el código. `LoginPage` lo fuerza con `showQuickRoles={true}`, también con la API real. Las credenciales quedan en el bundle público de Vercel. |
| A2 | `pages/PagosPage.tsx:629` y `components/pagos/ResumenPago.tsx:19-36, 147-180` | El checkout real muestra "Simulación de Pasarela (Modo Pruebas)" con los botones Aprobado y Rechazo. El cliente elige si su pago se rechaza y eso viaja como `forzarRechazo` al backend (`PagoService.procesarPago:119`). |
| A3 | `App.tsx:200-208` | `/playground` es una ruta pública sin login: un catálogo de componentes con datos falsos, accesible en producción. |
| A4 | `pages/roles/*RolPage.tsx` y `LoginPage.tsx:23,32`, `RegistroPage.tsx:21,30` | Después de iniciar sesión el usuario cae en una pantalla placeholder que solo dice "Soy SOCIO" (o el rol que tenga). No es un inicio real. |
| A5 | `services/rolesService.ts:30-140` y `pages/RolesPage.tsx` | La matriz de permisos está escrita en el front y los "roles personalizados" se guardan en `localStorage`. Un gerente que crea un rol solo lo crea en su navegador: el backend no se entera y `JwtAuthConverter` no lo reconoce. Además el front decide los menús con esta matriz, que tiene que mantenerse a mano igual a los `@PreAuthorize`. En `develop` ya está desalineada: el recepcionista tiene `CANCHAS_ADMIN`, el externo no tiene pagos y existe `PAGOS_COBRAR_MOSTRADOR`, que no tiene endpoint. #65 corrige una parte. |
| A6 | `pages/AccesoPage.tsx:64-125, 200-205, 228-267, 603-635` | `SOCIOS_EJEMPLO` (5 socios inventados) es el estado inicial también con la API real. Al personal se le muestra "Simular Socio / Caso de Negocio". Si `GET /v1/usuarios?tipo=SOCIO` falla, el error se ignora en silencio y quedan seleccionables los socios falsos. |
| A7 | `components/canchas/GrillaDisponibilidad.tsx:115-120` | Cada franja muestra un precio calculado en el front: base o 8000 fijo, +20% en hora pico y −15% para socios. Esa regla ya la aplica el backend (`DescuentoSocioEstrategia` y `RecargoHorarioPicoEstrategia`), así que si cambia allá, la grilla muestra precios distintos a la cotización. |
| A8 | `components/canchas/DesglosePrecio.tsx:43, 64, 118, 149` y `ReservaCanchaView.tsx:350` | El 15% de descuento está fijo en textos y en un cálculo de respaldo. |
| A9 | `ReservaCanchaView.tsx:69` | La hora de cierre (22 hs) está fija para sugerir el día siguiente. `ReservaCanchaView.tsx:439` lista los deportes a mano (`PADEL`, `FUTBOL_5`, `TENIS`, `BASQUET`) en vez de tomarlos del enum o de las canchas. |
| A10 | `components/usuarios/UsuarioForm.tsx:57, 77, 89, 173` | Si no hay sede activa, usa la sede `1` por defecto: un usuario nuevo puede quedar asignado a una sede que el operador no eligió. |
| A11 | `components/pagos/BotonDescargaPdf.tsx:74-80` | Si no llega la URL del PDF, inventa un "PDF válido" con monto 0 y lo descarga como si fuera el comprobante. Hoy la rama real no pasa por ahí (usa el blob con token), pero el respaldo sigue activo. |
| A12 | `components/clases/ClaseCard.tsx:23-24` (y los textos de #67) | La ventana de reserva de 48 hs está duplicada en el front. Es aceptable como ayuda visual, pero conviene que salga de una única constante con un comentario que remita a la regla del backend. |

## 2. Modo mock (severidad B)

`USE_MOCK` (`config.ts`) aparece en 16 archivos. `.env.example` lo trae en `true`, así que un dev nuevo arranca en modo mock sin saberlo.

| Archivo | Datos falsos y lógica duplicada |
| :-- | :-- |
| `services/authService.ts:35-98, 222` | 4 usuarios falsos con login simulado. |
| `services/usuariosService.ts:20-113` | 8 usuarios. |
| `services/membresiasService.ts:8-375` | Planes, socios y membresías, con el cálculo de vencimiento hecho en el front. |
| `services/canchasService.ts:18-55, 264-345, 589, 642` | Canchas, reservas, cotización y conflicto 409 simulados. |
| `services/pagosService.ts:222-345` | Transacciones y comprobantes, más el generador de PDF. |
| `services/accesoService.ts:30-83, 209` | Sedes (incluye una "Recoleta" que no existe en la base), socios y un validador de QR en memoria. |
| `services/clasesService.ts:34-49` (y #67) | Sedes, socio "Valentina García" y `MENSAJES_CLASES`. |
| `App.tsx:46-51, 92-96, 141` | `SEDES_MOCK`. |
| `pages/PagosPage.tsx:54-200, 121, 205-210, 339` | `ITEMS_COBRO_DEMO` (precios inventados como 38000 o 6800), `ID_SOCIO_DEMO = 1` y los tipos `ItemCobroDemo` / `selectedDemoItem`, que también se usan en modo real. |
| `pages/ClasesPage.tsx:41-44, 80, 314-330` | `SOCIO_MOCK_ID = 2` y un banner "Modo Mock". |
| `pages/AccesoPage.tsx:631-635, 784-799` | Etiquetas por id fijo y banner `VITE_USE_MOCK=true`. |
| `components/acceso/ValidadorIngreso.tsx:21, 149-170` | "Casos de Prueba con 1 Clic". |
| `components/canchas/ReservaCanchaView.tsx:98-112, 657-670` | Toggle socio/externo y "Simular conflicto 409". |
| `components/canchas/MisReservasView.tsx:63` | Estados calculados distinto en mock y en real. |

Impacto en tests: de 53 archivos de test, 13 prueban servicios o páginas contra la rama mock. Solo `canchasService.api.test.ts` y `pagosService.api.test.ts` (y el de clases de #67) prueban la rama real con `vi.mock('../../config')`. Si se borra el modo mock, esos 13 tienen que pasar a mockear `httpClient`.

## 3. Código muerto o de demostración (severidad C)

| Archivo | Líneas | Nota |
| :-- | --: | :-- |
| `pages/PlaygroundPage.tsx` | 3430 | Solo lo monta `/playground`. |
| `context/AppContext.tsx` | 1011 | Store legado con roles `SOCIO_ACTIVO` y `GERENTE_CENTRAL`, datos falsos y confetti. Solo lo usa el Playground. |
| `components/auth/RoleMiddlewareDemo.tsx` (#65) | 150 | Nuevo en SCRUM-92 y solo para el Playground. |
| `components/ui/QRCodePass.tsx:41-90` | | Genera un QR `_demoMock` si no recibe token. Fuera del Playground no lo usa nadie. |
| `pages/roles/*` | | Ver A4. |
| Comentarios con historia | | Comentarios como "BUG-09 resuelto" en la UI (`AccesoPage.tsx:794`), "RNF-02" y "SCRUM-xx" repartidos en componentes. |

## 4. Fuera del front, relacionado

- `PagoRequest.forzarRechazo` (backend): es un interruptor de prueba expuesto en la API pública. Lo correcto es que la pasarela simulada decida el rechazo por una regla propia (por ejemplo, un monto o un token de tarjeta de prueba) o que el campo solo se acepte con un perfil `dev`.
- Hacen falta los endpoints que el front hoy suple con datos propios: tipos de cancha y horario de la sede (A9), y la matriz de permisos (A5, si se quiere que la defina el backend).

## 5. Qué se hizo en SCRUM-117

Rama `SCRUM-117`, apilada sobre `SCRUM-104` con `SCRUM-92` y `SCRUM-102` mergeadas. Las pantallas ya no ramifican por `USE_MOCK`; el mock queda solo dentro de los servicios, para los tests, y `.env.example` arranca en `false`.

- A1: se borró el acceso rápido del login. Las credenciales ya no están en el bundle.
- A2: se borró el selector de la pasarela y el front no envía `forzarRechazo`.
- A3: se borraron `/playground`, `PlaygroundPage`, `AppContext`, `RoleMiddlewareDemo` y `QRCodePass`, y se desinstaló `canvas-confetti`.
- A4: se borraron las pantallas "Soy ROL". El inicio por rol es socio → `/mi-qr`, externo → `/canchas`, recepcionista y gerente → `/acceso`. El menú ya no tiene el ítem "Inicio" duplicado.
- A5: se sacaron los roles personalizados en `localStorage`. `/admin/roles` muestra la matriz fija, de solo lectura.
- A6: en Acceso no quedan socios de ejemplo, "Simular socio", banner mock ni el indicador falso de "Molinetes sincronizados". El pase QR es siempre el del socio logueado (`/usuarios/me/qr`).
- A7 y A8: la grilla muestra el precio de lista y el desglose solo muestra el recargo y el descuento que trae la cotización. El porcentaje de descuento se calcula a partir de la respuesta del backend.
- A9: se sacó la regla de las 22 hs. Los deportes del filtro salen de las canchas cargadas.
- A10: el alta de usuario ya no asume la sede 1.
- A11: se sacó el PDF inventado. Sin origen, el botón queda deshabilitado.
- Clases: se sacaron el banner y el socio de demo. Validador: se sacaron los "casos de prueba con 1 clic". En los títulos visibles ya no aparecen códigos de ticket (RN-01, RF-05, SCRUM-xx).

## 6. Huecos para cargar como historias

1. **Pago rechazado.** Desde la interfaz ya no se puede provocar un rechazo, así que el reintento solo aparece si el backend rechaza por su cuenta. Falta definir la regla de la pasarela simulada en el backend (por ejemplo, una tarjeta de prueba) y sacar `forzarRechazo` de `PagoRequest`.
2. **Historial de cobros por sede** para recepción y gerencia: no tiene endpoint, y la pantalla muestra un aviso.
3. **Cancelar una reserva de cancha:** no tiene endpoint, y el botón está oculto en modo real (`CANCELACION_DISPONIBLE`).
4. **Consulta de un socio desde recepción:** antes se hacía con "Simular socio". Si recepción necesita ver el estado o el pase de un socio, falta una búsqueda real.
5. **Cobro en mostrador** (`PAGOS_COBRAR_MOSTRADOR`): la prestación existe en la matriz, pero no tiene pantalla ni endpoint.
6. **Matriz de permisos duplicada** en el front y en los `@PreAuthorize`. Se puede evaluar un `GET /v1/usuarios/me/permisos`.
7. **Horario de apertura y cierre de la sede:** no lo expone el backend, y la grilla depende de las franjas que devuelve.
8. **Login:** ignora `?returnTo=`, que manda `RoleMiddleware`.
9. **Inicio del gerente:** cae en `/acceso` porque no hay un tablero propio.
10. **SCRUM-109:** siguen fallando 4 tests con la fecha fija 2026-10-25 (grilla y reserva). Con una fecha futura pasan.
