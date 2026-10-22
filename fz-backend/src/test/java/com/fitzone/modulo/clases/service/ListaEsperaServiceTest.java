package com.fitzone.modulo.clases.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.MembresiaInactivaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.ListaEspera;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListaEsperaServiceTest {

    @Mock
    private ListaEsperaRepository listaEsperaRepository;

    @Mock
    private ClaseGrupalRepository claseGrupalRepository;

    @Mock
    private ReservaClaseRepository reservaClaseRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    @InjectMocks
    private ListaEsperaService listaEsperaService;

    private Usuario socio;
    private Usuario externo;
    private ClaseGrupal clase;

    @BeforeEach
    void setUp() {
        socio = Usuario.builder()
                .idUsuario(1L)
                .dni("12345678")
                .nombre("Martin")
                .apellido("Palermo")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        externo = Usuario.builder()
                .idUsuario(2L)
                .dni("87654321")
                .nombre("Juan")
                .apellido("Perez")
                .tipoUsuario(TipoUsuario.EXTERNO)
                .build();

        clase = ClaseGrupal.builder()
                .idClase(10L)
                .nombreActividad("Crossfit")
                .fechaHoraInicio(LocalDateTime.now().plusHours(24))
                .cupoMaximo(15)
                .cupoDisponible(0)
                .build();
    }

    @Test
    @DisplayName("anotarse cuando la clase no existe lanza RecursoNoEncontradoException (404)")
    void anotarse_claseInexistente_lanza404() {
        when(claseGrupalRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> listaEsperaService.anotarse(99L, 1L))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("Clase grupal");
    }

    @Test
    @DisplayName("anotarse cuando el usuario no existe lanza RecursoNoEncontradoException (404)")
    void anotarse_usuarioInexistente_lanza404() {
        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> listaEsperaService.anotarse(10L, 99L))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("Usuario");
    }

    @Test
    @DisplayName("anotarse cuando el usuario no es socio lanza ReglaNegocioException (422)")
    void anotarse_usuarioNoEsSocio_lanza422() {
        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(externo));

        assertThatThrownBy(() -> listaEsperaService.anotarse(10L, 2L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("Solo los socios pueden anotarse");
    }

    @Test
    @DisplayName("anotarse cuando el socio tiene membresía inactiva lanza MembresiaInactivaException (422)")
    void anotarse_membresiaInactiva_lanza422() {
        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(false);

        assertThatThrownBy(() -> listaEsperaService.anotarse(10L, 1L))
                .isInstanceOf(MembresiaInactivaException.class);
    }

    @Test
    @DisplayName("anotarse cuando la clase ya comenzó lanza ReglaNegocioException (422)")
    void anotarse_claseYaComenzo_lanza422() {
        clase.setFechaHoraInicio(LocalDateTime.now().minusMinutes(10));
        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);

        assertThatThrownBy(() -> listaEsperaService.anotarse(10L, 1L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("ya comenzó o finalizó");
    }

    @Test
    @DisplayName("anotarse cuando la clase aún tiene cupos libres lanza ReglaNegocioException (422)")
    void anotarse_claseConCuposLibres_lanza422() {
        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);
        when(reservaClaseRepository.countByClase_IdClaseAndEstado(10L, EstadoReservaClase.CONFIRMADA)).thenReturn(10L); // cupoMaximo es 15

        assertThatThrownBy(() -> listaEsperaService.anotarse(10L, 1L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("aún posee cupos disponibles");
    }

    @Test
    @DisplayName("anotarse cuando el socio ya tiene reserva confirmada en la clase lanza ConflictoException (409)")
    void anotarse_socioConReservaConfirmada_lanza409() {
        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);
        when(reservaClaseRepository.countByClase_IdClaseAndEstado(10L, EstadoReservaClase.CONFIRMADA)).thenReturn(15L);
        when(reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(10L, 1L, EstadoReservaClase.CONFIRMADA))
                .thenReturn(true);

        assertThatThrownBy(() -> listaEsperaService.anotarse(10L, 1L))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya posee una reserva confirmada");
    }

    @Test
    @DisplayName("anotarse cuando el socio ya está en la lista de espera lanza ConflictoException (409)")
    void anotarse_socioYaEnListaEspera_lanza409() {
        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);
        when(reservaClaseRepository.countByClase_IdClaseAndEstado(10L, EstadoReservaClase.CONFIRMADA)).thenReturn(15L);
        when(reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(10L, 1L, EstadoReservaClase.CONFIRMADA))
                .thenReturn(false);
        when(listaEsperaRepository.existsByClase_IdClaseAndUsuario_IdUsuario(10L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> listaEsperaService.anotarse(10L, 1L))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya se encuentra en la lista de espera");
    }

    @Test
    @DisplayName("anotarse exitosamente en lista vacía asigna orden_posicion = 1")
    void anotarse_exitosa_primeraPosicion() {
        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);
        when(reservaClaseRepository.countByClase_IdClaseAndEstado(10L, EstadoReservaClase.CONFIRMADA)).thenReturn(15L);
        when(reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(10L, 1L, EstadoReservaClase.CONFIRMADA))
                .thenReturn(false);
        when(listaEsperaRepository.existsByClase_IdClaseAndUsuario_IdUsuario(10L, 1L)).thenReturn(false);
        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(10L)).thenReturn(List.of());
        when(listaEsperaRepository.save(any(ListaEspera.class))).thenAnswer(inv -> inv.getArgument(0));

        ListaEspera creada = listaEsperaService.anotarse(10L, 1L);

        assertThat(creada.getOrdenPosicion()).isEqualTo(1);
        assertThat(creada.getUsuario()).isEqualTo(socio);
        assertThat(creada.getClase()).isEqualTo(clase);
        verify(listaEsperaRepository).save(any(ListaEspera.class));
    }

    @Test
    @DisplayName("anotarse exitosamente cuando ya hay personas en cola asigna la siguiente posición (FIFO)")
    void anotarse_exitosa_siguientePosicion() {
        ListaEspera previa = ListaEspera.builder().idEspera(5L).clase(clase).ordenPosicion(2).build();

        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class))).thenReturn(true);
        when(reservaClaseRepository.countByClase_IdClaseAndEstado(10L, EstadoReservaClase.CONFIRMADA)).thenReturn(15L);
        when(reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(10L, 1L, EstadoReservaClase.CONFIRMADA))
                .thenReturn(false);
        when(listaEsperaRepository.existsByClase_IdClaseAndUsuario_IdUsuario(10L, 1L)).thenReturn(false);
        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(10L)).thenReturn(List.of(previa));
        when(listaEsperaRepository.save(any(ListaEspera.class))).thenAnswer(inv -> inv.getArgument(0));

        ListaEspera creada = listaEsperaService.anotarse(10L, 1L);

        assertThat(creada.getOrdenPosicion()).isEqualTo(3);
        verify(listaEsperaRepository).save(any(ListaEspera.class));
    }

    @Test
    @DisplayName("salir cuando el id no existe lanza RecursoNoEncontradoException (404)")
    void salir_inexistente_lanza404() {
        when(listaEsperaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> listaEsperaService.salir(99L))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("Inscripción en lista de espera");
    }

    @Test
    @DisplayName("salir de lista de espera elimina registro y reacomoda posiciones restantes compactamente")
    void salir_exitoso_reacomodaPosiciones() {
        ListaEspera primero = ListaEspera.builder().idEspera(1L).clase(clase).ordenPosicion(1).build();
        ListaEspera segundo = ListaEspera.builder().idEspera(2L).clase(clase).ordenPosicion(2).build();
        ListaEspera tercero = ListaEspera.builder().idEspera(3L).clase(clase).ordenPosicion(3).build();

        when(listaEsperaRepository.findById(1L)).thenReturn(Optional.of(primero));
        // Al consultar restantes, quedan segundo y tercero
        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(10L)).thenReturn(new ArrayList<>(List.of(segundo, tercero)));

        listaEsperaService.salir(1L);

        verify(listaEsperaRepository).delete(primero);
        verify(listaEsperaRepository).save(segundo);
        verify(listaEsperaRepository).save(tercero);
        assertThat(segundo.getOrdenPosicion()).isEqualTo(1);
        assertThat(tercero.getOrdenPosicion()).isEqualTo(2);
    }

    @Test
    @DisplayName("listarPorClase cuando la clase no existe lanza RecursoNoEncontradoException (404)")
    void listarPorClase_inexistente_lanza404() {
        when(claseGrupalRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> listaEsperaService.listarPorClase(99L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("listarPorClase retorna la lista ordenada por orden_posicion ascendente")
    void listarPorClase_retornaOrdenado() {
        ListaEspera e1 = ListaEspera.builder().idEspera(1L).ordenPosicion(1).build();
        ListaEspera e2 = ListaEspera.builder().idEspera(2L).ordenPosicion(2).build();

        when(claseGrupalRepository.existsById(10L)).thenReturn(true);
        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(10L)).thenReturn(List.of(e1, e2));

        List<ListaEspera> resultado = listaEsperaService.listarPorClase(10L);

        assertThat(resultado).hasSize(2);
        assertThat(resultado.get(0).getOrdenPosicion()).isEqualTo(1);
        assertThat(resultado.get(1).getOrdenPosicion()).isEqualTo(2);
    }

    @Test
    @DisplayName("removerSocioSiEstaEnEspera elimina la inscripción si el socio estaba en la cola")
    void removerSocioSiEstaEnEspera_presente_loElimina() {
        ListaEspera entrada = ListaEspera.builder().idEspera(50L).clase(clase).ordenPosicion(1).build();
        when(listaEsperaRepository.findByClase_IdClaseAndUsuario_IdUsuario(10L, 1L)).thenReturn(Optional.of(entrada));
        when(listaEsperaRepository.findById(50L)).thenReturn(Optional.of(entrada));
        when(listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(10L)).thenReturn(List.of());

        listaEsperaService.removerSocioSiEstaEnEspera(10L, 1L);

        verify(listaEsperaRepository).delete(entrada);
    }

    @Test
    @DisplayName("removerSocioSiEstaEnEspera no hace nada si el socio no estaba en la cola")
    void removerSocioSiEstaEnEspera_noPresente_noHaceNada() {
        when(listaEsperaRepository.findByClase_IdClaseAndUsuario_IdUsuario(10L, 1L)).thenReturn(Optional.empty());

        listaEsperaService.removerSocioSiEstaEnEspera(10L, 1L);

        verify(listaEsperaRepository, never()).delete(any(ListaEspera.class));
    }
}
