package com.fitzone.modulo.pagos.models;

import com.fitzone.core.domain.enums.EstadoPago;

/** Trae el comprobante porque el invitado no puede consultar GET /pagos/{id}/comprobante (exige sesión). */
public record PagoInvitadoResponse(boolean aprobado, Transaccion transaccion, Long idComprobante, String numeroFactura) {

    public static PagoInvitadoResponse desde(Transaccion transaccion, Comprobante comprobante) {
        return new PagoInvitadoResponse(
                transaccion.getEstadoPago() == EstadoPago.CONFIRMADO,
                transaccion,
                comprobante != null ? comprobante.getIdComprobante() : null,
                comprobante != null ? comprobante.getNumeroFactura() : null);
    }
}
