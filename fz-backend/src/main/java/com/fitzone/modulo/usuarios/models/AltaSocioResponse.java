package com.fitzone.modulo.usuarios.models;

import java.time.LocalDate;

/**
 * - cuentaPendiente=false con token: cuenta creada y sesión iniciada.
 * - cuentaPendiente=false sin token: cuenta creada, hay que iniciar sesión a mano.
 * - cuentaPendiente=true: el pago y la membresía quedaron registrados pero no se pudo crear la cuenta;
 *   se reintenta con el numeroFactura.
 */
public record AltaSocioResponse(
        String token,
        Usuario usuario,
        boolean cuentaPendiente,
        String mensaje,
        Long idMembresia,
        LocalDate fechaVencimiento,
        Long idComprobante,
        String numeroFactura) {
}
