package com.fitzone.core.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Traduce cualquier excepción que salga de un controlador al formato común {@link RespuestaError}.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String MENSAJE_VALIDACION = "La solicitud tiene campos inválidos";

    // 404, 409 y 422: excepciones de negocio lanzadas desde los servicios
    @ExceptionHandler(NegocioException.class)
    public ResponseEntity<RespuestaError> manejarNegocio(NegocioException ex) {
        return responder(ex.getStatus(), ex.getCodigo(), ex.getMessage(), List.of());
    }

    // 400: @Valid sobre un @RequestBody
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RespuestaError> manejarValidacionBody(MethodArgumentNotValidException ex) {
        List<DetalleError> detalles = ex.getBindingResult().getAllErrors().stream()
                .map(error -> detalle(error, error.getObjectName()))
                .toList();
        return validacion(detalles);
    }

    // 400: restricciones sobre @RequestParam / @PathVariable (ej: @Positive Long idSede)
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<RespuestaError> manejarValidacionParametros(HandlerMethodValidationException ex) {
        List<DetalleError> detalles = ex.getParameterValidationResults().stream()
                .flatMap(resultado -> resultado.getResolvableErrors().stream()
                        .map(error -> detalle(error, resultado.getMethodParameter().getParameterName())))
                .toList();
        return validacion(detalles);
    }

    // 400: validación por AOP cuando una clase usa @Validated (controlador o servicio)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<RespuestaError> manejarValidacionMetodo(ConstraintViolationException ex) {
        List<DetalleError> detalles = ex.getConstraintViolations().stream()
                .map(violacion -> {
                    String ruta = violacion.getPropertyPath().toString();
                    return new DetalleError(ruta.substring(ruta.lastIndexOf('.') + 1), violacion.getMessage());
                })
                .toList();
        return validacion(detalles);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<RespuestaError> manejarParametroFaltante(MissingServletRequestParameterException ex) {
        return responder(HttpStatus.BAD_REQUEST, CodigoError.SOLICITUD_INVALIDA, "Falta un parámetro obligatorio",
                List.of(new DetalleError(ex.getParameterName(), "es obligatorio")));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<RespuestaError> manejarTipoParametro(MethodArgumentTypeMismatchException ex) {
        return responder(HttpStatus.BAD_REQUEST, CodigoError.SOLICITUD_INVALIDA, "Un parámetro tiene un formato inválido",
                List.of(new DetalleError(ex.getName(), "valor inválido: " + ex.getValue())));
    }

    // 400: JSON mal formado o con un tipo incorrecto (ej: "cupo": "abc" o un enum inexistente)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<RespuestaError> manejarBodyIlegible(HttpMessageNotReadableException ex) {
        List<DetalleError> detalles = List.of();
        if (ex.getCause() instanceof JsonMappingException mapeo) {
            String campo = mapeo.getPath().stream()
                    .map(JsonMappingException.Reference::getFieldName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining("."));
            if (!campo.isEmpty()) {
                detalles = List.of(new DetalleError(campo, "tipo de dato inválido"));
            }
        }
        return responder(HttpStatus.BAD_REQUEST, CodigoError.SOLICITUD_INVALIDA,
                "No se pudo leer el cuerpo de la solicitud (JSON mal formado o tipo de dato incorrecto)", detalles);
    }

    // 409: último resguardo cuando una restricción de la BD corta la operación (UNIQUE, EXCLUDE de RN-02, FK en uso)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<RespuestaError> manejarIntegridad(DataIntegrityViolationException ex) {
        log.warn("Violación de integridad de datos: {}", ex.getMostSpecificCause().getMessage());
        return responder(HttpStatus.CONFLICT, CodigoError.CONFLICTO,
                "La operación entra en conflicto con datos existentes", List.of());
    }

    // 403: sin este handler, un @PreAuthorize rechazado caería en el catch-all y respondería 500
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<RespuestaError> manejarAccesoDenegado(AccessDeniedException ex) {
        return responder(HttpStatus.FORBIDDEN, CodigoError.ACCESO_DENEGADO,
                "No tenés permisos para realizar esta operación", List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<RespuestaError> manejarInesperado(Exception ex) {
        // Excepciones estándar de Spring MVC (ruta inexistente, método no soportado, etc.) ya traen su status
        if (ex instanceof ErrorResponse errorResponse) {
            HttpStatusCode status = errorResponse.getStatusCode();
            return ResponseEntity.status(status)
                    .headers(errorResponse.getHeaders())
                    .body(new RespuestaError(codigoPara(status), mensajePara(status), List.of(), Instant.now()));
        }
        log.error("Error no controlado", ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR, CodigoError.ERROR_INTERNO,
                "Ocurrió un error inesperado", List.of());
    }

    private static ResponseEntity<RespuestaError> validacion(List<DetalleError> detalles) {
        List<DetalleError> ordenados = detalles.stream()
                .sorted(Comparator.comparing(DetalleError::campo))
                .toList();
        return responder(HttpStatus.BAD_REQUEST, CodigoError.VALIDACION, MENSAJE_VALIDACION, ordenados);
    }

    private static DetalleError detalle(MessageSourceResolvable error, String campoPorDefecto) {
        String campo = error instanceof FieldError fieldError ? fieldError.getField() : campoPorDefecto;
        return new DetalleError(campo, error.getDefaultMessage());
    }

    private static ResponseEntity<RespuestaError> responder(HttpStatusCode status, CodigoError codigo,
                                                           String mensaje, List<DetalleError> detalles) {
        return ResponseEntity.status(status).body(new RespuestaError(codigo, mensaje, detalles, Instant.now()));
    }

    private static CodigoError codigoPara(HttpStatusCode status) {
        if (status.value() == HttpStatus.NOT_FOUND.value()) {
            return CodigoError.RECURSO_NO_ENCONTRADO;
        }
        return status.is5xxServerError() ? CodigoError.ERROR_INTERNO : CodigoError.SOLICITUD_INVALIDA;
    }

    private static String mensajePara(HttpStatusCode status) {
        return switch (status.value()) {
            case 404 -> "La ruta solicitada no existe";
            case 405 -> "Método HTTP no soportado para esta ruta";
            case 406 -> "Formato de respuesta no soportado";
            case 415 -> "Tipo de contenido no soportado";
            default -> status.is5xxServerError() ? "Ocurrió un error inesperado" : "La solicitud no es válida";
        };
    }
}
