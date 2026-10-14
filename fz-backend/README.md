# fz-backend — API REST de FitZone Sports

Java 21 · Spring Boot 3.4 · Spring Data JPA · PostgreSQL 16.
Para levantar la base local y el resto del proyecto, ver el [README principal](../README.md).

```bash
./mvnw spring-boot:run    # perfil local por defecto (Postgres en Docker)
./mvnw test
```

| Qué | URL local |
| :-- | :-- |
| Base de la API | `http://localhost:8080/api/v1` |
| Swagger UI (contratos para el front) | `http://localhost:8080/api/swagger-ui` |
| OpenAPI en JSON (para generar clientes) | `http://localhost:8080/api/v3/api-docs` |
| Healthcheck | `http://localhost:8080/api/ping` |

---

## 1. Convención de controladores

### Prefijo `/api/v1`
- `/api` lo agrega `server.servlet.context-path`.
- `/v1` se agrega solo a **todos** los controladores de `com.fitzone` (`WebConfig`). La única excepción es `/ping`.
- Cada controlador declara únicamente su recurso, en plural:

```java
@RestController
@RequestMapping("/canchas")       // queda publicado en /api/v1/canchas
public class CanchaController { ... }
```

> No escribas `/v1` ni `/api` en el `@RequestMapping`: quedaría `/api/v1/v1/...`.

### Capas
| Capa | Hace | No hace |
| :-- | :-- | :-- |
| `controller` | Recibe el request, valida el DTO con `@Valid`, llama a **un** método del servicio y devuelve un DTO. | Lógica de negocio, acceso a repositorios, `try/catch` de errores. |
| `service` | Reglas de negocio, `@Transactional`, mapeo entidad ⇄ DTO, lanza las excepciones de negocio. | Conocer HTTP (`ResponseEntity`, status). |
| `repository` | Acceso a datos (`JpaRepository`). | — |

### DTO: los controladores reciben y devuelven DTO, nunca la entidad
- Van en `modulo/<modulo>/dto/` como `record`: `XxxRequest` (entrada) y `XxxResponse` (salida).
- La entidad no sale del servicio. Así evitamos exponer columnas internas (`is_deleted`, auditoría), los errores de serialización de las relaciones `LAZY` y los ciclos de JSON.
- Mapeo manual con un método estático en el `Response`.

```text
modulo/canchas
├── controller/CanchaController.java
├── dto/CanchaRequest.java
├── dto/CanchaResponse.java
├── models/Cancha.java
├── repository/CanchaRepository.java
└── service/CanchaService.java
```

```java
public record CanchaRequest(
        @NotBlank String nombre,
        @NotNull @Positive Long idSede) { }

public record CanchaResponse(Long id, String nombre, Long idSede) {
    public static CanchaResponse desde(Cancha cancha) {
        return new CanchaResponse(cancha.getIdCancha(), cancha.getNombre(), cancha.getSede().getIdSede());
    }
}

// Controller: delega y devuelve DTO
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public CanchaResponse crear(@Valid @RequestBody CanchaRequest request) {
    return canchaService.crear(request);
}

// Service: reglas de negocio y excepciones
@Transactional
public CanchaResponse crear(CanchaRequest request) {
    Sede sede = sedeRepository.findById(request.idSede())
            .orElseThrow(() -> new RecursoNoEncontradoException("Sede", request.idSede()));
    if (canchaRepository.existsByNombreAndSede(request.nombre(), sede)) {
        throw new ConflictoException("Ya existe una cancha con ese nombre en la sede");
    }
    // ... crear y guardar la entidad
    return CanchaResponse.desde(guardada);
}
```

### Usuario y sede (hasta que se integre el JWT)
La validación del JWT y los roles son de otro sprint. Mientras tanto, los endpoints de `/v1/**` están abiertos (`SecurityConfig`) y **el usuario y la sede viajan por parámetro o en el body** (`?idUsuario=...&idSede=...` o dentro del `XxxRequest`). Validalos igual que cualquier otro dato (`@NotNull @Positive`).

---

## 2. Validación (Bean Validation)

- Anotá los campos del `Request` con `@NotBlank`, `@NotNull`, `@Email`, `@Positive`, `@Size`, `@Min`/`@Max`, etc.
- En el controlador: `@Valid @RequestBody XxxRequest request`.
- Los `@RequestParam` y `@PathVariable` también se validan si les ponés la anotación (`@RequestParam @Positive Long idSede`). No hace falta `@Validated` en el controlador.
- Los mensajes salen en español (`spring.web.locale=es`). Si querés uno propio: `@NotBlank(message = "El nombre es obligatorio")`.
- La validación de formato va en el DTO. Las reglas que dependen de la base (cupos, solapamientos, cuota al día) van en el servicio y lanzan excepciones de negocio.

---

## 3. Formato de error

**Todos** los errores responden con el mismo JSON (`RespuestaError`). Lo arma `GlobalExceptionHandler` (`core/exception`), así que los controladores nunca atrapan excepciones ni arman respuestas de error.

```json
{
  "codigo": "VALIDACION",
  "mensaje": "La solicitud tiene campos inválidos",
  "detalles": [
    { "campo": "email", "mensaje": "debe ser una dirección de correo electrónico con formato correcto" },
    { "campo": "nombre", "mensaje": "no debe estar vacío" }
  ],
  "timestamp": "2026-10-14T05:02:28.015Z"
}
```

- `codigo`: valor fijo (enum `CodigoError`) para que el front decida qué hacer. El status HTTP viaja aparte.
- `mensaje`: texto en español, apto para mostrar al usuario.
- `detalles`: un elemento por campo con error. **Siempre es un array** (vacío si el error no es de un campo puntual).
- `timestamp`: ISO-8601 en UTC.

| Status | `codigo` | Cuándo |
| :-- | :-- | :-- |
| 400 | `VALIDACION` | Falló Bean Validation (body o parámetros). `detalles` trae los campos. |
| 400 / 405 / 415 | `SOLICITUD_INVALIDA` | JSON mal formado, tipo de dato incorrecto, falta un parámetro obligatorio, método HTTP no soportado. |
| 403 | `ACCESO_DENEGADO` | Sin permisos (cuando se agreguen los roles). |
| 404 | `RECURSO_NO_ENCONTRADO` | `RecursoNoEncontradoException` o ruta inexistente. |
| 409 | `CONFLICTO` | `ConflictoException`, o una restricción de la BD (UNIQUE, EXCLUDE de RN-02). |
| 422 | `REGLA_NEGOCIO` | `ReglaNegocioException`. |
| 500 | `ERROR_INTERNO` | Error no controlado (queda en el log con el stack trace). |

### Excepciones de negocio: cuál usar

Todas extienden `NegocioException` y se lanzan **desde el servicio**:

| Excepción | Status | Usala cuando… | Ejemplo |
| :-- | :-- | :-- | :-- |
| `RecursoNoEncontradoException` | 404 | El id pedido no existe. | `new RecursoNoEncontradoException("Sede", id)` → "Sede con id 5 no existe" |
| `ConflictoException` | 409 | La operación choca con datos que ya existen. | Email ya registrado; cancha reservada en ese horario (RN-02); doble ingreso al molinete (RN-01). |
| `ReglaNegocioException` | 422 | Los datos son válidos pero una regla de negocio lo impide. | Socio con cuota vencida reserva una clase (RN-03); reserva con más de 48 hs de anticipación. |

Para un error de formato de los datos no lances excepciones a mano: usá Bean Validation en el DTO.

### Endpoints de prueba
`/api/v1/prueba/*` (tag "Prueba de errores" en Swagger) devuelve cada error a propósito para ver el formato. Solo se registran fuera del perfil `prod`.

| Endpoint | Respuesta |
| :-- | :-- |
| `POST /v1/prueba/validacion` con `{"nombre":"","email":"x","cupo":0}` | 400 `VALIDACION` |
| `GET /v1/prueba/parametros?idSede=-1` | 400 `VALIDACION` |
| `GET /v1/prueba/no-encontrado/7` | 404 |
| `GET /v1/prueba/conflicto` | 409 |
| `GET /v1/prueba/regla-negocio` | 422 |

---

## 4. Swagger / OpenAPI

springdoc genera la documentación a partir de los controladores y DTO; no hay que escribir nada aparte. Para mejorar lo que ve el front:
- `@Tag(name = "Canchas")` en el controlador para agrupar.
- `@Operation(summary = "...")` en cada endpoint.
- Las anotaciones de Bean Validation del DTO aparecen solas como campos obligatorios y rangos.

---

## 5. CORS

Configurado en `SecurityConfig` a partir de la propiedad `fitzone.cors.allowed-origins`. Por defecto permite `http://localhost:[*]` (Vite en cualquier puerto) y `https://*.vercel.app` (producción y previews de Vercel). Para restringirlo en un entorno, definí la variable `CORS_ALLOWED_ORIGINS` con una lista separada por comas, por ejemplo:

```text
CORS_ALLOWED_ORIGINS=https://fitzone.vercel.app,http://localhost:5173
```

No uses `@CrossOrigin` en los controladores: la configuración es global.
