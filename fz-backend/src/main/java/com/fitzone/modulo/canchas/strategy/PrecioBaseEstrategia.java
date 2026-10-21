package com.fitzone.modulo.canchas.strategy;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;

@Component
@Order(1)
public class PrecioBaseEstrategia implements EstrategiaPrecio {

    @Override
    public void aplicar(ContextoPrecio contexto) {
        long minutos = Duration.between(contexto.getInicio(), contexto.getFin()).toMinutes();
        BigDecimal horas = BigDecimal.valueOf(minutos)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        BigDecimal precioBaseHora = contexto.getCancha().getPrecioBaseHora();
        BigDecimal precioBase = precioBaseHora.multiply(horas).setScale(2, RoundingMode.HALF_UP);

        contexto.setPrecioBase(precioBase);
    }
}
