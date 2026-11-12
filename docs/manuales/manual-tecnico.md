# Manual técnico — FitZone Sports

- **Versión:** 1.0 · **Fecha:** 2026-11-10 · **Autor:** Leiva, Marcos Joel (Grupo 5)
- **Público:** desarrolladores que mantienen o extienden el sistema.

Describe el código de la rama `develop` al 2026-11-10. Lo que no está implementado se marca como tal.

## 1. Visión arquitectónica

FitZone Sports es un **monolito modular** (ADR-001): una API Spring Boot organizada en cinco módulos funcionales, una SPA en React y una base PostgreSQL compartida. La autenticación se delega en Supabase Auth (ADR-010) y la autorización la decide el backend.

Diagramas C4, con fuente editable en [docs/diagramas](../diagramas/README.md):

| Nivel | Diagrama |
|---|---|
| Contexto | [c4-1-contexto](../diagramas/c4-1-contexto.svg) |
| Contenedores | [c4-2-contenedores](../diagramas/c4-2-contenedores.svg) |
| Componentes, canchas | [c4-3-componentes-canchas](../diagramas/c4-3-componentes-canchas.svg) |
| Componentes, acceso | [c4-3-componentes-acceso](../diagramas/c4-3-componentes-acceso.svg) |
| DER físico | [der-fisico](../diagramas/der-fisico.svg) |
| Despliegue | [despliegue](../diagramas/despliegue.svg) |
| Pipeline | [pipeline-ci-cd](../diagramas/pipeline-ci-cd.svg) |

Decisiones de arquitectura: ver el índice de [docs/adr](../adr/README.md). Las nueve que pide la cátedra son ADR-001 a ADR-009; ADR-010 a ADR-017 registran decisiones del equipo, tres de ellas reemplazadas.

## 2. Módulos funcionales

Todo el backend está en `fz-backend/src/main/java/com/fitzone/`.

| Módulo (cátedra) | Paquete | Responsabilidad | Tablas |
|---|---|---|---|
| M1 Usuarios y Membresías | `modulo/usuarios` | Usuarios y roles, login (proxy a Supabase), planes, membresías, QR del socio, vencimiento diario | `fz_usr_usuarios`, `fz_pag_planes`, `fz_pag_membresias` |
| M2 Gimnasio y Acceso | `modulo/gimnasio` | Sedes, aforo, ingreso y egreso con QR (RN-01, RF-05) | `fz_sedes`, `fz_gym_accesos` |
| M3 Clases | `modulo/clases` | Clases grupales, cupos, reservas, lista de espera (Observer) | `fz_cls_clases_grupales`, `fz_cls_reservas`, `fz_cls_lista_espera` |
| M4 Canchas | `modulo/canchas` | Canchas por tipo, disponibilidad, cotización (Strategy), reservas (RN-02), mantenimiento | `fz_cch_canchas`, `fz_cch_reservas` |
| M5 Pagos | `modulo/pagos` | Pagos con pasarela simulada, comprobantes PDF, checkout de invitados sin cuenta | `fz_pag_transacciones`, `fz_pag_comprobantes` |

Ubicaciones que sorprenden: `Plan` y `Membresia` están en `usuarios`, y `Sede` en `gimnasio`.

`core/` contiene lo transversal: `config` (seguridad, CORS, prefijo `/v1`, semilla), `security` (`JwtAuthConverter`, `UsuarioActual`, `SupabaseAuthClient`), `exception` (jerarquía de `NegocioException` y `GlobalExceptionHandler`), `domain` (`BaseEntity` y enums compartidos).

Cada módulo sigue la misma estructura: `controller` → `service` → `repository` → `models`. Los controladores no tienen lógica ni atrapan excepciones; las reglas y las transacciones están en los servicios.

Frontend (`fz-frontend/src/`): `pages/` → `components/<dominio>/` y `components/ui/` → `hooks/` → `services/` → `services/httpClient.ts`. Estado global con Context (`AuthContext`, `SedeContext`, `ToastContext`). Rutas protegidas con `RoleMiddleware` y UI condicional con `FeatureGate`.

## 3. Modelo de datos y persistencia

Ver el [DER físico](../diagramas/der-fisico.svg). Convenciones (ADR-016):

- El esquema lo genera Hibernate desde las entidades: `ddl-auto=update` en `local` y `dev`, `validate` en `prod`. No hay migraciones versionadas.
- Tablas con prefijo de módulo: `fz_usr_`, `fz_gym_`, `fz_cls_`, `fz_cch_`, `fz_pag_`.
- Claves `Long` con `GenerationType.IDENTITY` (`Plan` usa `Integer`).
- Enums como texto (`@Enumerated(EnumType.STRING)`), no tipos nativos de PostgreSQL.
- Todas las entidades extienden `BaseEntity`: auditoría (`created_at`, `updated_at`, `created_by`, `updated_by`) y borrado lógico (`is_deleted`, `deleted_at`). El filtro `@SQLRestriction` solo está en `Usuario`.
- Relaciones `LAZY` con `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})`.
- Restricciones que Hibernate no genera (CHECK de origen de transacción, una reserva por acceso, FK con nombre): script `docs/sql/SCRUM-93-restricciones.sql`.
- `fz_pag_transacciones` referencia opcionalmente a la membresía o a la reserva de cancha que paga (ADR-012).

**Pendiente:** índices declarados con `@Index` para la consulta de disponibilidad (RNF-03) y la restricción `EXCLUDE USING gist` de RN-02.

## 4. Patrones de diseño

### 4.1 Strategy — precio dinámico de canchas (RF-11)

Paquete `modulo/canchas/strategy`.

| Clase | Rol |
|---|---|
| `EstrategiaPrecio` | Interfaz: `void aplicar(ContextoPrecio contexto)` |
| `ContextoPrecio` | Datos de la cotización (cancha, usuario, inicio, fin, `esSocioActivo`) y acumuladores `precioBase`, `descuento`, `recargo` |
| `PrecioBaseEstrategia` (`@Order(1)`) | `precio_base_hora × horas` |
| `RecargoHorarioPicoEstrategia` (`@Order(2)`) | Recargo por las horas que caen entre las 19 y las 21; porcentaje en `fitzone.canchas.recargo-pico-porcentaje` (0.20) |
| `DescuentoSocioEstrategia` (`@Order(3)`) | 15 % del precio base si el usuario tiene membresía activa |
| `CalculadorPrecioCancha` | Contexto del patrón: recibe `List<EstrategiaPrecio>` inyectada por Spring en orden de `@Order` y calcula `final = base − descuento + recargo` |

El socio moroso no tiene membresía activa, así que paga la tarifa de cliente externo: puede alquilar (RN-03 de la cátedra), pero sin descuento.

### 4.2 Observer — lista de espera de clases

Paquetes `modulo/clases/event` y `modulo/clases/observer`.

1. Al cancelar una reserva, `ReservaClaseService` publica `CupoLiberadoEvent` con `ApplicationEventPublisher`.
2. `CupoLiberadoListener` (`@EventListener`) busca la lista de espera de la clase ordenada por posición y avisa al primero.
3. El aviso pasa por la interfaz `Notificador`. La única implementación, `LogNotificador`, lo escribe en el log: **no hay envío real** (mail o push).

El socio avisado tiene que entrar y reservar; al concretar la reserva, sale de la lista y se reacomodan las posiciones. No hay asignación automática del cupo.

### 4.3 Repository

Cada entidad tiene una interfaz `JpaRepository` en `modulo/*/repository`. Las consultas derivadas y `@Query` concentran el acceso a datos; los servicios no escriben SQL. Los métodos `findByIdForUpdate` y `findMembresiaActivaParaIngreso` agregan `@Lock(PESSIMISTIC_WRITE)` (sección 5).

### 4.4 Patrones creacionales y estructurales

| Patrón | Dónde |
|---|---|
| Builder | Lombok `@Builder` en `ContextoPrecio`, `CotizacionDTO` y modelos de respuesta |
| Singleton | Todos los `@Service`, `@Component` y `@Repository`: Spring crea una instancia por contenedor |
| Adapter (puerto y adaptador) | `PasarelaPago` es el puerto del módulo de pagos; `PasarelaMock` lo implementa. Integrar Mercado Pago es agregar otra implementación (ADR-009). `SupabaseAuthClient` adapta la API REST de Supabase Auth |
| Facade | Los servicios de cada módulo exponen operaciones de negocio completas y ocultan repositorios, bloqueos y eventos al controlador |
| Template de errores | `GlobalExceptionHandler` traduce la jerarquía `NegocioException` a `RespuestaError` con código HTTP y `CodigoError` |

## 5. Control de concurrencia en las reservas

Mecanismo común (ADR-004): **verificar y bloquear en la misma transacción** con `SELECT … FOR UPDATE`.

| Regla | Qué se bloquea | Dónde |
|---|---|---|
| RN-02, sin solapamiento de canchas | La fila de la cancha (`CanchaRepository.findByIdForUpdate`), después `existsSolapamiento` | `CanchaService.guardarReserva` |
| RN-01, un ingreso abierto por socio | La membresía activa (`findMembresiaActivaParaIngreso`) | `AccesoService` |
| RF-05, aforo de la sede | La sede (`SedeRepository.findByIdWithLock`) | `AccesoService` |
| Cupos de clases | La clase, antes de contar reservas | `ReservaClaseService` |
| Alta y renovación de membresías | El usuario (`findByIdForUpdate`) | `MembresiaService` |

Dos pedidos simultáneos por el mismo turno se serializan en la fila de la cancha: el segundo espera, ve la reserva del primero y recibe `409 Conflicto`.

Limitaciones: la garantía vive en la aplicación. Un `INSERT` que no pase por el servicio puede solapar reservas, porque falta la restricción `EXCLUDE USING gist` en `fz_cch_reservas`. Los tests mockean el bloqueo; no hay un test de concurrencia contra una base real (deuda en ADR-007).

## 6. Arquitectura offline del control de acceso

**No implementada** (ADR-003). Hoy el flujo es en línea:

1. El socio abre *Mi Pase* y la web pide `GET /v1/usuarios/me/qr`.
2. `QrTokenService` arma `idUsuario:ventana60s:nonce` y lo firma con HMAC-SHA256 (`QR_SECRET`). El QR se renueva cada 60 segundos.
3. La recepción envía el token a `POST /v1/accesos/ingreso`. El backend verifica firma y ventana, rechaza un QR ya usado, valida membresía, RN-01 y aforo, y registra el acceso.

El diseño propuesto para RNF-01 (en rojo en [c4-3-componentes-acceso](../diagramas/c4-3-componentes-acceso.svg)): pase firmado con clave asimétrica guardado en el dispositivo, validación en la terminal de sede con la clave pública, cola local de ingresos y sincronización diferida que revalida RN-01 y aforo. Requiere la app móvil, que quedó fuera del alcance.

## 7. Guía de extensión

### 7.1 Caso resuelto: agregar canchas de tenis

El tipo de cancha es un texto libre (`Cancha.tipo`, columna `tipo`), no un enum, así que agregar tenis **no requiere cambiar código**:

1. Como gerente, `POST /v1/canchas` con `"tipo": "Tenis"`, la sede y `precioBaseHora`.
2. La grilla de disponibilidad y el filtro por tipo (`GET /v1/canchas?idSede=1&tipo=Tenis`) la incluyen de inmediato.
3. El precio usa las mismas estrategias. Si tenis necesitara una regla propia (por ejemplo, recargo por iluminación), se agrega una estrategia (7.2) que mire `contexto.getCancha().getTipo()`.

Lo que sí cambiaría: si tenis tuviera turnos de 90 minutos, habría que tocar la validación de horas enteras de `CanchaService` (hoy los turnos empiezan y terminan en hora en punto, entre las 8 y las 23).

### 7.2 Caso resuelto: agregar una estrategia de precio

Ejemplo: 10 % de descuento los martes.

```java
@Component
@Order(4) // corre después del descuento de socio
public class DescuentoMartesEstrategia implements EstrategiaPrecio {
    private static final BigDecimal PORCENTAJE = new BigDecimal("0.10");

    @Override
    public void aplicar(ContextoPrecio contexto) {
        if (contexto.getInicio().getDayOfWeek() == DayOfWeek.TUESDAY) {
            BigDecimal extra = contexto.getPrecioBase().multiply(PORCENTAJE);
            contexto.setDescuento(contexto.getDescuento().add(extra));
        }
    }
}
```

1. Crear la clase en `modulo/canchas/strategy`, anotada con `@Component` y `@Order`.
2. No hay que tocar `CalculadorPrecioCancha`: Spring la inyecta en la lista.
3. Sumar descuentos y recargos a lo que ya tiene el contexto, no reemplazarlos: `DescuentoSocioEstrategia` usa `setDescuento`, así que una estrategia posterior debe acumular.
4. Agregar un test unitario como los de `src/test/java/com/fitzone/modulo/canchas/strategy`.

## 8. Pruebas y cobertura

Estrategia en ADR-007: tests unitarios (servicios con Mockito; componentes, hooks y servicios del frontend con Vitest y Testing Library), tests de slice de controladores (`@WebMvcTest` + `GlobalExceptionHandler`) y recorridos manuales con Bruno (`docs/bruno/`).

```bash
cd fz-backend && ./mvnw verify          # tests + reporte JaCoCo
cd fz-frontend && npm run coverage      # vitest + reporte V8
```

- Backend: reporte en `fz-backend/target/site/jacoco/index.html`. No necesita base de datos; la configuración de test está en `src/test/resources/application.properties`.
- Frontend: reporte en `fz-frontend/coverage/index.html`.
- Un test puntual: `./mvnw test -Dtest=AccesoServiceTest` o `npx vitest run src/pages/CanchasPage.test.tsx`.

Cómo leer el reporte: la columna de líneas indica qué código se ejecutó; la de ramas, qué caminos de cada `if` se recorrieron. Una clase de servicio con líneas altas y ramas bajas tiene casos de error sin probar.

Medición del 2026-11-10: backend 263 tests, 66,0 % de líneas y 48,7 % de ramas; frontend 400 tests, 71,3 % de líneas y 66,2 % de ramas. El umbral acordado es 60 % de líneas; se publica pero todavía no hace fallar el build.

## 9. Pipeline de integración y entrega

[.github/workflows/ci.yml](../../.github/workflows/ci.yml), diagrama en [pipeline-ci-cd](../diagramas/pipeline-ci-cd.svg):

1. Disparo: cada PR hacia `develop` y cada push a `develop`.
2. Backend: JDK 21 y `./mvnw -B verify` (compila, corre tests, genera JaCoCo).
3. Frontend: Node, `npm ci`, `npm run coverage` y `npm run build` (incluye el chequeo de tipos de `tsc`).
4. Publica los reportes de cobertura como artefactos del workflow.
5. Entrega: Render y Vercel despliegan solos al recibir el push en la rama configurada (ADR-008).

## 10. Convenciones

- **Ramas:** una por ticket, desde `develop`, con el código del ticket sin sufijos (`SCRUM-54`). Nunca se trabaja sobre `develop` ni `main`. Cada rama termina en un PR hacia `develop` revisado por un compañero.
- **Commits:** `<tipo>(<scope>): [SCRUM-<N>] <descripción>`, en español. Ejemplo: `feat(auth): [SCRUM-26] implementar supabase auth y roles M1`.
- **Backend:**
  - Los controladores declaran solo el recurso en plural (`@RequestMapping("/canchas")`); `WebConfig` agrega `/v1` y el context path, `/api`.
  - Inyección con `@RequiredArgsConstructor`; `@Tag` en el controlador y `@Operation` en cada endpoint.
  - Errores: lanzar desde el servicio una subclase de `NegocioException` (`RecursoNoEncontradoException` 404, `ConflictoException` 409, `ReglaNegocioException` 422). El formato de los datos se valida con Bean Validation.
  - El usuario y la sede del operador salen de `UsuarioActual`, nunca del request (ADR-015). Los permisos por rol se declaran con `@PreAuthorize`.
  - Tests con `@DisplayName` en español.
- **Frontend:**
  - Todo HTTP pasa por `httpClient.ts`. Cada función de servicio cubre el modo real y el modo mock (`USE_MOCK`).
  - `components/ui` es presentacional, sin llamadas a la API.
  - Colores de la paleta `fitzone-*` de Tailwind.
  - TypeScript estricto: `import type`, sin enums de TS ni parameter properties.
- **Secretos:** solo en variables de entorno o `.env` ignorado por git. Nunca en el código ni en variables `VITE_*`.
