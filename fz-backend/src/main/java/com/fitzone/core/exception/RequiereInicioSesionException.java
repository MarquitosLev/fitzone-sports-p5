package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/** 409: el invitado cargó el DNI o el email de una cuenta registrada; el front lo distingue del 409 de turno ocupado. */
public class RequiereInicioSesionException extends NegocioException {

    public RequiereInicioSesionException(String mensaje) {
        super(HttpStatus.CONFLICT, CodigoError.REQUIERE_INICIO_SESION, mensaje);
    }
}
