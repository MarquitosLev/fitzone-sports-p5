package com.fitzone.modulo.clases.observer;

import com.fitzone.modulo.usuarios.models.Usuario;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Implementación del notificador que registra las alertas en los logs del sistema.
 */
@Slf4j
@Component
public class LogNotificador implements Notificador {

    @Override
    public void notificar(Usuario usuario, String mensaje) {
        log.info("[NOTIFICACION-OBSERVER] Socio ID: {} ({} {} - DNI: {}): {}",
                usuario.getIdUsuario(), usuario.getNombre(), usuario.getApellido(), usuario.getDni(), mensaje);
    }
}
