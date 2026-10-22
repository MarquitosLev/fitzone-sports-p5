package com.fitzone.modulo.clases.observer;

import com.fitzone.modulo.usuarios.models.Usuario;

/**
 * Interfaz que define el contrato del observador para la notificación a usuarios
 * cuando se libera un cupo en una clase grupal.
 */
public interface Notificador {

    void notificar(Usuario usuario, String mensaje);
}
