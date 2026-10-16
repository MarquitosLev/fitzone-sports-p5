package com.fitzone.core.exception;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(description = "Formato común de error de toda la API")
public record RespuestaError(
        CodigoError codigo,
        String mensaje,
        @Schema(description = "Detalle por campo; lista vacía si el error no es de un campo puntual")
        List<DetalleError> detalles,
        Instant timestamp) {
}
