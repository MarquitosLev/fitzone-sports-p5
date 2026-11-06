package com.fitzone.modulo.pagos.pasarela;

import lombok.Builder;

/**
 * Resultado devuelto por la pasarela de pagos al procesar un cobro.
 */
@Builder
public record RespuestaPasarela(
        boolean aprobado,
        String tokenTransaccion,
        String mensaje
) {}
