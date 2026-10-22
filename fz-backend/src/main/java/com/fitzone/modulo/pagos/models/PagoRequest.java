package com.fitzone.modulo.pagos.models;

import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO para la solicitud de procesamiento de un pago en la pasarela.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoRequest {

    @NotNull(message = "El idUsuario es obligatorio")
    @Positive(message = "El idUsuario debe ser positivo")
    private Long idUsuario;

    @NotNull(message = "El idSede es obligatorio")
    @Positive(message = "El idSede debe ser positivo")
    private Long idSede;

    @NotNull(message = "El concepto es obligatorio (MEMBRESIA o RESERVA_CANCHA)")
    private TipoOrigenTransaccion concepto;

    private Long idMembresia;

    private Long idReservaCancha;

    /**
     * Flag opcional para pruebas que permite forzar un rechazo determinístico en la pasarela simulada.
     */
    @Builder.Default
    private Boolean forzarRechazo = false;
}
