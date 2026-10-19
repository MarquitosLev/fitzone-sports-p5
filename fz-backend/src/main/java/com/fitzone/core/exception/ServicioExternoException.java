package com.fitzone.core.exception;

import org.springframework.http.HttpStatus;

/** 502: un servicio externo falló o no respondió. Ej: Supabase Auth caído o service-role key inválida. */
public class ServicioExternoException extends NegocioException {

    public ServicioExternoException(String mensaje) {
        super(HttpStatus.BAD_GATEWAY, CodigoError.SERVICIO_EXTERNO, mensaje);
    }
}
