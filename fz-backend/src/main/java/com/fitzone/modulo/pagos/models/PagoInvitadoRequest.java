package com.fitzone.modulo.pagos.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PagoInvitadoRequest {

    /** Solo para pruebas con la pasarela simulada. */
    private Boolean forzarRechazo = false;
}
