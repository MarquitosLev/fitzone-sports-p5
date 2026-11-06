package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/** 404: el recurso pedido no existe. Ej: {@code repo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Sede", id))}. */
public class RecursoNoEncontradoException extends NegocioException {

    public RecursoNoEncontradoException(String mensaje) {
        super(HttpStatus.NOT_FOUND, CodigoError.RECURSO_NO_ENCONTRADO, mensaje);
    }

    public RecursoNoEncontradoException(String recurso, Object id) {
        this(recurso + " con id " + id + " no existe");
    }
}
