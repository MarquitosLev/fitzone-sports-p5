package com.fitzone.core.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base de las excepciones que lanzan los servicios. {@link GlobalExceptionHandler} las traduce
 * a {@link RespuestaError} con el status y el código que define cada subclase.
 */
@Getter
public abstract class NegocioException extends RuntimeException {

    private final HttpStatus status;
    private final CodigoError codigo;

    protected NegocioException(HttpStatus status, CodigoError codigo, String mensaje) {
        super(mensaje);
        this.status = status;
        this.codigo = codigo;
    }
}
