package com.fitzone.core.exception;

/**
 * Valor del campo "codigo" de {@link RespuestaError}. El front decide qué hacer con este código;
 * el status HTTP viaja aparte en la respuesta.
 */
public enum CodigoError {
    /** 400: Bean Validation falló. "detalles" trae un elemento por campo. */
    VALIDACION,
    /** 400/405/415: JSON mal formado, tipo de dato incorrecto, falta un parámetro o método no soportado. */
    SOLICITUD_INVALIDA,
    /** 403: el usuario no tiene permiso para la operación. */
    ACCESO_DENEGADO,
    /** 404: el recurso o la ruta no existen. */
    RECURSO_NO_ENCONTRADO,
    /** 409: la operación choca con el estado actual (duplicado, solapamiento, registro en uso). */
    CONFLICTO,
    /** 422: los datos son válidos pero una regla de negocio impide la operación. */
    REGLA_NEGOCIO,
    /** 500: error no controlado. */
    ERROR_INTERNO
}
