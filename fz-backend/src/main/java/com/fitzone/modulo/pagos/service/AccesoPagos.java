package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.usuarios.models.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Regla de lectura de pagos y comprobantes (SCRUM-99): el dueño del pago siempre;
 * el personal (recepcionista o gerente) solo si el pago es de una sede sobre la que opera.
 * Vive aparte para que la usen PagoService y ComprobanteService sin depender uno del otro.
 */
@Component
@RequiredArgsConstructor
public class AccesoPagos {

    private final UsuarioActual usuarioActual;

    public void validarLectura(Transaccion transaccion) {
        Usuario solicitante = usuarioActual.obtener();
        if (esDuenio(solicitante, transaccion)) {
            return;
        }
        boolean esPersonal = solicitante.getTipoUsuario() == TipoUsuario.RECEPCIONISTA
                || solicitante.getTipoUsuario() == TipoUsuario.GERENTE;
        if (!esPersonal) {
            throw new AccesoDenegadoException("No tiene permisos para ver los pagos de otro usuario");
        }
        usuarioActual.validarSede(solicitante, transaccion.getSede().getIdSede());
    }

    private boolean esDuenio(Usuario solicitante, Transaccion transaccion) {
        return transaccion.getUsuario() != null
                && solicitante.getIdUsuario().equals(transaccion.getUsuario().getIdUsuario());
    }
}
