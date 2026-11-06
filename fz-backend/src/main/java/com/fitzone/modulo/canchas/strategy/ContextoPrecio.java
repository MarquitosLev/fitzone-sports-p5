package com.fitzone.modulo.canchas.strategy;

import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.usuarios.models.Usuario;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ContextoPrecio {

    private final Cancha cancha;
    private final Usuario usuario;
    private final LocalDateTime inicio;
    private final LocalDateTime fin;
    private final boolean esSocioActivo;

    @Builder.Default
    private BigDecimal precioBase = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal descuento = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal recargo = BigDecimal.ZERO;
}
