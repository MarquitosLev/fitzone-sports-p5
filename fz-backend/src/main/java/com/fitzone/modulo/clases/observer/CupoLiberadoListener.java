package com.fitzone.modulo.clases.observer;

import com.fitzone.modulo.clases.event.CupoLiberadoEvent;
import com.fitzone.modulo.clases.models.ListaEspera;
import com.fitzone.modulo.clases.repository.ListaEsperaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Listener del evento CupoLiberadoEvent que implementa el patrón Observer.
 * Al liberarse un cupo en una clase grupal, busca al primer socio en orden de espera (FIFO)
 * y le envía una notificación a través de la interfaz Notificador.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CupoLiberadoListener {

    private final ListaEsperaRepository listaEsperaRepository;
    private final Notificador notificador;

    @EventListener
    public void onCupoLiberado(CupoLiberadoEvent event) {
        log.info("[OBSERVER] Evento CupoLiberadoEvent recibido para la clase ID: {}", event.idClase());
        List<ListaEspera> cola = listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(event.idClase());
        if (!cola.isEmpty()) {
            ListaEspera primero = cola.get(0);
            String nombreActividad = (primero.getClase() != null && primero.getClase().getNombreActividad() != null)
                    ? primero.getClase().getNombreActividad()
                    : "Clase #" + event.idClase();
            String mensaje = String.format("¡Se liberó un cupo en la clase '%s'! Podés ingresar al sistema a reservar tu lugar.", nombreActividad);
            notificador.notificar(primero.getUsuario(), mensaje);
        } else {
            log.info("[OBSERVER] No hay socios en lista de espera para la clase ID: {}", event.idClase());
        }
    }
}
