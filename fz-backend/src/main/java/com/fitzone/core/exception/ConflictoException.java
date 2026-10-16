package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/** 409: la operación choca con el estado actual. Ej: email ya registrado, cancha ya reservada en ese horario (RN-02). */
public class ConflictoException extends NegocioException {

    public ConflictoException(String mensaje) {
        super(HttpStatus.CONFLICT, CodigoError.CONFLICTO, mensaje);
    }
}
