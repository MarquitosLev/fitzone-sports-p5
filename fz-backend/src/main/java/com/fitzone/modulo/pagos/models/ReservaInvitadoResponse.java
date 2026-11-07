package com.fitzone.modulo.pagos.models;

import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.models.ReservaCancha;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** {@code cotizacion} es null si la tarifa cambió desde que se reservó y ya no explica el precio congelado. */
public record ReservaInvitadoResponse(
        UUID codigoReserva,
        Long idReservaCancha,
        Long idCancha,
        String cancha,
        String tipoCancha,
        Long idSede,
        String sede,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        BigDecimal precioFinal,
        CotizacionDTO cotizacion,
        boolean pagada) {

    public static ReservaInvitadoResponse desde(ReservaCancha reserva, CotizacionDTO cotizacion, boolean pagada) {
        Cancha cancha = reserva.getCancha();
        boolean explicaElPrecio = cotizacion != null
                && cotizacion.getPrecioFinal().compareTo(reserva.getPrecioFinal()) == 0;
        return new ReservaInvitadoResponse(
                reserva.getCodigoReserva(),
                reserva.getIdReservaCancha(),
                cancha.getIdCancha(),
                cancha.getNombre(),
                cancha.getTipo(),
                cancha.getSede().getIdSede(),
                cancha.getSede().getNombre(),
                reserva.getFechaHoraInicio(),
                reserva.getFechaHoraFin(),
                reserva.getPrecioFinal(),
                explicaElPrecio ? cotizacion : null,
                pagada);
    }
}
