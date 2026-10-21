package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/** 401: falta autenticación válida o el token/root-key provisto es incorrecto. */
public class AccesoNoAutorizadoException extends NegocioException {

    public AccesoNoAutorizadoException(String mensaje) {
        super(HttpStatus.UNAUTHORIZED, CodigoError.ACCESO_DENEGADO, mensaje);
    }
}
