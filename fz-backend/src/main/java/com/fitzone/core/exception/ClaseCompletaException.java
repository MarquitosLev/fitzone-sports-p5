package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/**
 * 409: la clase no dispone de cupo disponible.
 */
public class ClaseCompletaException extends NegocioException {

    public ClaseCompletaException(String mensaje) {
        super(HttpStatus.CONFLICT, CodigoError.CLASE_COMPLETA, mensaje);
    }
}
