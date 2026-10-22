package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/**
 * 400 Bad Request: La solicitud no es válida debido a inconsistencias o parámetros contradictorios.
 */
public class PeticionInvalidaException extends NegocioException {

    public PeticionInvalidaException(String mensaje) {
        super(HttpStatus.BAD_REQUEST, CodigoError.SOLICITUD_INVALIDA, mensaje);
    }
}
