package com.fitzone.modulo.canchas.strategy;

import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CalculadorPrecioCancha {

    private final List<EstrategiaPrecio> estrategias;

    public CotizacionDTO calcular(ContextoPrecio contexto) {
        for (EstrategiaPrecio estrategia : estrategias) {
            estrategia.aplicar(contexto);
        }

        BigDecimal precioBase = contexto.getPrecioBase().setScale(2, RoundingMode.HALF_UP);
        BigDecimal descuento = contexto.getDescuento().setScale(2, RoundingMode.HALF_UP);
        BigDecimal recargo = contexto.getRecargo().setScale(2, RoundingMode.HALF_UP);

        BigDecimal precioFinal = precioBase
                .subtract(descuento)
                .add(recargo)
                .setScale(2, RoundingMode.HALF_UP);

        return CotizacionDTO.builder()
                .precioBase(precioBase)
                .descuento(descuento)
                .recargo(recargo)
                .precioFinal(precioFinal)
                .build();
    }
}
