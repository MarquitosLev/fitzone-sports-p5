package com.fitzone.modulo.canchas.strategy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Component
@Order(2)
public class RecargoHorarioPicoEstrategia implements EstrategiaPrecio {

    private final BigDecimal porcentajeRecargo;

    public RecargoHorarioPicoEstrategia(
            @Value("${fitzone.canchas.recargo-pico-porcentaje:0.20}") BigDecimal porcentajeRecargo) {
        this.porcentajeRecargo = porcentajeRecargo;
    }

    @Override
    public void aplicar(ContextoPrecio contexto) {
        LocalDateTime picoInicio = contexto.getInicio().toLocalDate().atTime(19, 0);
        LocalDateTime picoFin = contexto.getInicio().toLocalDate().atTime(21, 0);

        LocalDateTime inicioSolape = contexto.getInicio().isAfter(picoInicio) ? contexto.getInicio() : picoInicio;
        LocalDateTime finSolape = contexto.getFin().isBefore(picoFin) ? contexto.getFin() : picoFin;

        if (inicioSolape.isBefore(finSolape)) {
            long minutosPico = Duration.between(inicioSolape, finSolape).toMinutes();
            BigDecimal horasPico = BigDecimal.valueOf(minutosPico)
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

            BigDecimal recargo = contexto.getCancha().getPrecioBaseHora()
                    .multiply(horasPico)
                    .multiply(porcentajeRecargo)
                    .setScale(2, RoundingMode.HALF_UP);

            contexto.setRecargo(recargo);
        } else {
            contexto.setRecargo(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }
    }
}
