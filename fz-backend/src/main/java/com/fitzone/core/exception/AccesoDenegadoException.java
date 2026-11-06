package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/** 403: el usuario que opera no tiene permiso para la acción. Ej: una recepcionista intenta dar de alta un gerente. */
public class AccesoDenegadoException extends NegocioException {

    public AccesoDenegadoException(String mensaje) {
        super(HttpStatus.FORBIDDEN, CodigoError.ACCESO_DENEGADO, mensaje);
    }
}
