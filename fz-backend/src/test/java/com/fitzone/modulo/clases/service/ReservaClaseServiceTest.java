package com.fitzone.modulo.clases.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ClaseCompletaException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.MembresiaInactivaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.clases.event.CupoLiberadoEvent;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.ListaEspera;
import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.clases.repository.ListaEsperaRepository;
import com.fitzone.modulo.clases.repository.ReservaClaseRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservaClaseServiceTest {

    @Mock
    private ReservaClaseRepository reservaClaseRepository;

    @Mock
    private ClaseGrupalRepository claseGrupalRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private ListaEsperaRepository listaEsperaRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ReservaClaseService reservaClaseService;

    private Usuario socio;
    private Usuario externo;
    private ClaseGrupal clase;

    @BeforeEach
    void setUp() {
        socio = Usuario.builder()
                .idUsuario(1L)
                .dni("12345678")
                .nombre("Juan")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        externo = Usuario.builder()
                .idUsuario(2L)
                .dni("87654321")
                .nombre("Pedro")
                .tipoUsuario(TipoUsuario.EXTERNO)
                .build();

        clase = ClaseGrupal.builder()
                .idClase(10L)
                .nombreActividad("Spinning")
                .fechaHoraInicio(LocalDateTime.now().plusHours(24))
                .cupoMaximo(20)
                .cupoDisponible(20)
                .build();
    }

    @Test
    @DisplayName("reservar con condiciones válidas crea la reserva CONFIRMADA y actualiza cupo disponible")
    void reservar_exitoso() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);
        when(reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(10L, 1L, EstadoReservaClase.CONFIRMADA))
                .thenReturn(false);
        when(reservaClaseRepository.countByClase_IdClaseAndEstado(10L, EstadoReservaClase.CONFIRMADA)).thenReturn(5L);
        when(reservaClaseRepository.save(any(ReservaClase.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaClase resultado = reservaClaseService.reservar(10L, 1L);

        assertThat(resultado.getEstado()).isEqualTo(EstadoReservaClase.CONFIRMADA);
        assertThat(resultado.getUsuario()).isEqualTo(socio);
        assertThat(resultado.getClase()).isEqualTo(clase);
        assertThat(clase.getCupoDisponible()).isEqualTo(14);
        verify(claseGrupalRepository).save(clase);
    }

    @Test
    @DisplayName("reservar cuando el usuario no es socio lanza ReglaNegocioException (422)")
    void reservar_usuarioNoEsSocio_lanza422() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(externo));

        assertThatThrownBy(() -> reservaClaseService.reservar(10L, 2L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("Solo los socios pueden reservar");
    }

    @Test
    @DisplayName("reservar cuando el socio no tiene membresía activa lanza MembresiaInactivaException (422)")
    void reservar_membresiaInactiva_lanza422() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(false);

        assertThatThrownBy(() -> reservaClaseService.reservar(10L, 1L))
                .isInstanceOf(MembresiaInactivaException.class)
                .hasMessageContaining("no posee una membresía activa y vigente");
    }

    @Test
    @DisplayName("reservar una clase que ya comenzó lanza ReglaNegocioException (422)")
    void reservar_claseComenzada_lanza422() {
        clase.setFechaHoraInicio(LocalDateTime.now().minusMinutes(5));

        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);

        assertThatThrownBy(() -> reservaClaseService.reservar(10L, 1L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("ya ha comenzado");
    }

    @Test
    @DisplayName("reservar con más de 48 hs de anticipación lanza ReglaNegocioException (422)")
    void reservar_masDe48Horas_lanza422() {
        clase.setFechaHoraInicio(LocalDateTime.now().plusHours(50));

        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);

        assertThatThrownBy(() -> reservaClaseService.reservar(10L, 1L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("hasta 48 horas de anticipación");
    }

    @Test
    @DisplayName("reservar cuando el socio ya tiene reserva confirmada en la misma clase lanza ConflictoException (409)")
    void reservar_duplicada_lanza409() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);
        when(reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(10L, 1L, EstadoReservaClase.CONFIRMADA))
                .thenReturn(true);

        assertThatThrownBy(() -> reservaClaseService.reservar(10L, 1L))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya posee una reserva confirmada");
    }

    @Test
    @DisplayName("reservar sin cupo disponible lanza ClaseCompletaException (409)")
    void reservar_sinCupo_lanzaClaseCompleta() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);
        when(reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(10L, 1L, EstadoReservaClase.CONFIRMADA))
                .thenReturn(false);
        when(reservaClaseRepository.countByClase_IdClaseAndEstado(10L, EstadoReservaClase.CONFIRMADA)).thenReturn(20L); // cupo maximo = 20

        assertThatThrownBy(() -> reservaClaseService.reservar(10L, 1L))
                .isInstanceOf(ClaseCompletaException.class)
                .hasMessageContaining("No hay cupo disponible");
    }

    @Test
    @DisplayName("cancelar reserva con más de 2 hs de anticipación pasa a CANCELADA y publica evento")
    void cancelar_exitoso() {
        ReservaClase reserva = ReservaClase.builder()
                .idReservaClase(100L)
                .clase(clase)
                .usuario(socio)
                .estado(EstadoReservaClase.CONFIRMADA)
                .build();

        when(reservaClaseRepository.findById(100L)).thenReturn(Optional.of(reserva));
        when(reservaClaseRepository.save(any(ReservaClase.class))).thenAnswer(inv -> inv.getArgument(0));

        ReservaClase cancelada = reservaClaseService.cancelar(100L);

        assertThat(cancelada.getEstado()).isEqualTo(EstadoReservaClase.CANCELADA);
        verify(eventPublisher).publishEvent(any(CupoLiberadoEvent.class));
    }

    @Test
    @DisplayName("cancelar reserva con menos de 2 hs de anticipación lanza ReglaNegocioException (422)")
    void cancelar_menosDe2Horas_lanza422() {
        clase.setFechaHoraInicio(LocalDateTime.now().plusHours(1)); // Menos de 2 horas
        ReservaClase reserva = ReservaClase.builder()
                .idReservaClase(100L)
                .clase(clase)
                .usuario(socio)
                .estado(EstadoReservaClase.CONFIRMADA)
                .build();

        when(reservaClaseRepository.findById(100L)).thenReturn(Optional.of(reserva));

        assertThatThrownBy(() -> reservaClaseService.cancelar(100L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("hasta 2 horas antes del inicio");
    }

    @Test
    @DisplayName("procesarCupoLiberado con personas en lista de espera promociona al primero (FIFO)")
    void procesarCupoLiberado_conListaEspera_promocionaPrimero() {
        Usuario esperando1 = Usuario.builder().idUsuario(3L).nombre("Lucas").build();
        Usuario esperando2 = Usuario.builder().idUsuario(4L).nombre("Matias").build();

        ListaEspera espera1 = ListaEspera.builder().idEspera(1L).clase(clase).usuario(esperando1).ordenPosicion(1).build();
        ListaEspera espera2 = ListaEspera.builder().idEspera(2L).clase(clase).usuario(esperando2).ordenPosicion(2).build();

        List<ListaEspera> lista = new ArrayList<>(List.of(espera1, espera2));

        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(10L)).thenReturn(lista);

        reservaClaseService.procesarCupoLiberado(10L);

        ArgumentCaptor<ReservaClase> reservaCaptor = ArgumentCaptor.forClass(ReservaClase.class);
        verify(reservaClaseRepository).save(reservaCaptor.capture());

        assertThat(reservaCaptor.getValue().getUsuario()).isEqualTo(esperando1);
        assertThat(reservaCaptor.getValue().getEstado()).isEqualTo(EstadoReservaClase.CONFIRMADA);
        verify(listaEsperaRepository).delete(espera1);
        verify(listaEsperaRepository).save(espera2);
        assertThat(espera2.getOrdenPosicion()).isEqualTo(1);
    }

    @Test
    @DisplayName("procesarCupoLiberado sin lista de espera recalcula cupo disponible")
    void procesarCupoLiberado_sinListaEspera_actualizaCupoDisponible() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(10L)).thenReturn(List.of());
        when(reservaClaseRepository.countByClase_IdClaseAndEstado(10L, EstadoReservaClase.CONFIRMADA)).thenReturn(10L);

        reservaClaseService.procesarCupoLiberado(10L);

        assertThat(clase.getCupoDisponible()).isEqualTo(10);
        verify(claseGrupalRepository).save(clase);
    }
}
