package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/** 422: los datos son válidos pero una regla de negocio lo impide. Ej: socio con cuota vencida reserva una clase (RN-03). */
public class ReglaNegocioException extends NegocioException {

    public ReglaNegocioException(String mensaje) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.REGLA_NEGOCIO, mensaje);
    }
}
