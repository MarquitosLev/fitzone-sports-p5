package com.fitzone.modulo.clases.observer;

import com.fitzone.modulo.clases.event.CupoLiberadoEvent;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.ListaEspera;
import com.fitzone.modulo.clases.repository.ListaEsperaRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CupoLiberadoListenerTest {

    @Mock
    private ListaEsperaRepository listaEsperaRepository;

    @Mock
    private Notificador notificador;

    @InjectMocks
    private CupoLiberadoListener cupoLiberadoListener;

    @Test
    @DisplayName("onCupoLiberado con socios en lista de espera notifica al primero de la cola (Observer FIFO)")
    void onCupoLiberado_conSociosEnEspera_notificaAlPrimero() {
        Usuario primero = Usuario.builder()
                .idUsuario(10L)
                .nombre("Lionel")
                .apellido("Messi")
                .dni("10101010")
                .build();

        ClaseGrupal clase = ClaseGrupal.builder()
                .idClase(5L)
                .nombreActividad("Funcional")
                .build();

        ListaEspera espera1 = ListaEspera.builder()
                .idEspera(1L)
                .clase(clase)
                .usuario(primero)
                .ordenPosicion(1)
                .build();

        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(5L)).thenReturn(List.of(espera1));

        cupoLiberadoListener.onCupoLiberado(new CupoLiberadoEvent(5L));

        verify(notificador).notificar(eq(primero), contains("Funcional"));
    }

    @Test
    @DisplayName("onCupoLiberado cuando la cola de espera está vacía no invoca al notificador")
    void onCupoLiberado_colaVacia_noNotifica() {
        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(5L)).thenReturn(List.of());

        cupoLiberadoListener.onCupoLiberado(new CupoLiberadoEvent(5L));

        verify(notificador, never()).notificar(any(), any());
    }
}
