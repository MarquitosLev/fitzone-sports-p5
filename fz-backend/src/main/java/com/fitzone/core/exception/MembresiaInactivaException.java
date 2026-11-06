package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/**
 * 422: el socio no posee membresía ACTIVA y vigente.
 */
public class MembresiaInactivaException extends NegocioException {

    public MembresiaInactivaException(String mensaje) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.MEMBRESIA_INACTIVA, mensaje);
    }
}
