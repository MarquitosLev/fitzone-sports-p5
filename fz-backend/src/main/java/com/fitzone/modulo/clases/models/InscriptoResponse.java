package com.fitzone.modulo.clases.models;

import com.fitzone.core.domain.enums.EstadoReservaClase;

/**
 * Datos que la recepción necesita de cada inscripto, sin exponer el resto del perfil del socio.
 */
public record InscriptoResponse(
        Long idReservaClase,
        Long idUsuario,
        String nombre,
        String apellido,
        EstadoReservaClase estado) {

    public static InscriptoResponse desde(ReservaClase reserva) {
        return new InscriptoResponse(
                reserva.getIdReservaClase(),
                reserva.getUsuario().getIdUsuario(),
                reserva.getUsuario().getNombre(),
                reserva.getUsuario().getApellido(),
                reserva.getEstado());
    }
}
