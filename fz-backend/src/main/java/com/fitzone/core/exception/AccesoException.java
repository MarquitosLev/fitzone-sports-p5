package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción de negocio para operaciones de validación de acceso y control de ingreso.
 */
public class AccesoException extends NegocioException {

    public AccesoException(HttpStatus status, CodigoError codigo, String mensaje) {
        super(status, codigo, mensaje);
    }

    public AccesoException(CodigoError codigo, String mensaje) {
        super(codigo == CodigoError.YA_INGRESADO || codigo == CodigoError.AFORO_COMPLETO
                ? HttpStatus.CONFLICT
                : HttpStatus.UNPROCESSABLE_ENTITY, codigo, mensaje);
    }
}
