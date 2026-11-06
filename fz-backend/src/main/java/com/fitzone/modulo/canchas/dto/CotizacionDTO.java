package com.fitzone.modulo.canchas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Desglose y cotización de precio de un turno de cancha")
public class CotizacionDTO {

    @Schema(description = "Precio estándar base según horas y tarifa de la cancha", example = "10000.00")
    private BigDecimal precioBase;

    @Schema(description = "Monto de descuento aplicado (15% para socios con membresía activa)", example = "1500.00")
    private BigDecimal descuento;

    @Schema(description = "Monto de recargo aplicado por horario pico (19:00 a 21:00)", example = "2000.00")
    private BigDecimal recargo;

    @Schema(description = "Precio total final calculado y congelado para el turno", example = "10500.00")
    private BigDecimal precioFinal;
}
