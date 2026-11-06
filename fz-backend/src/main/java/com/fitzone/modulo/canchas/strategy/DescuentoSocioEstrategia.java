package com.fitzone.modulo.canchas.strategy;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
@Order(3)
public class DescuentoSocioEstrategia implements EstrategiaPrecio {

    private static final BigDecimal PORCENTAJE_DESCUENTO = new BigDecimal("0.15");

    @Override
    public void aplicar(ContextoPrecio contexto) {
        if (contexto.isEsSocioActivo()) {
            BigDecimal descuento = contexto.getPrecioBase()
                    .multiply(PORCENTAJE_DESCUENTO)
                    .setScale(2, RoundingMode.HALF_UP);
            contexto.setDescuento(descuento);
        } else {
            contexto.setDescuento(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }
    }
}
