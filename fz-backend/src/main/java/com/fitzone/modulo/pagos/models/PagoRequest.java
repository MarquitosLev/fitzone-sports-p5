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
 * Quien paga sale del token (SCRUM-99): un idUsuario en el JSON se ignora.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoRequest {

    /** Obligatorio para MEMBRESIA. En RESERVA_CANCHA se usa la sede de la cancha. */
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
