package com.fitzone.modulo.clases.service;

import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.ListaEspera;
import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.clases.repository.ListaEsperaRepository;
import com.fitzone.modulo.clases.repository.ReservaClaseRepository;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClaseGrupalServiceTest {

    @Mock
    private ClaseGrupalRepository claseGrupalRepository;

    @Mock
    private ReservaClaseRepository reservaClaseRepository;

    @Mock
    private ListaEsperaRepository listaEsperaRepository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private AccesoRepository accesoRepository;

    @Mock
    private UsuarioActual usuarioActual;

    @InjectMocks
    private ClaseGrupalService claseGrupalService;

    private Sede sede;
    private ClaseGrupal clase;
    private Usuario socio;

    @BeforeEach
    void setUp() {
        sede = Sede.builder().idSede(1L).build();
        clase = ClaseGrupal.builder()
                .idClase(10L)
                .sede(sede)
                .nombreActividad("Spinning")
                .fechaHoraInicio(LocalDateTime.now().plusHours(24))
                .duracionMinutos(60)
                .cupoMaximo(20)
                .cupoDisponible(20)
                .build();
        socio = Usuario.builder().idUsuario(5L).tipoUsuario(TipoUsuario.SOCIO).build();
    }

    @Test
    @DisplayName("crear en una sede ajena lanza AccesoDenegadoException (403) y no guarda la clase")
    void crear_sedeAjena_lanza403() {
        doThrow(new AccesoDenegadoException("Otra sede")).when(usuarioActual).validarSede(1L);

        assertThatThrownBy(() -> claseGrupalService.crear(clase))
                .isInstanceOf(AccesoDenegadoException.class);

        verify(claseGrupalRepository, never()).save(any(ClaseGrupal.class));
    }

    @Test
    @DisplayName("actualizar valida la sede actual de la clase antes de modificarla")
    void actualizar_sedeAjena_lanza403() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        doThrow(new AccesoDenegadoException("Otra sede")).when(usuarioActual).validarSede(1L);

        assertThatThrownBy(() -> claseGrupalService.actualizar(10L, clase))
                .isInstanceOf(AccesoDenegadoException.class);

        verify(claseGrupalRepository, never()).save(any(ClaseGrupal.class));
    }

    @Test
    @DisplayName("actualizar no permite mover la clase a una sede ajena")
    void actualizar_moverASedeAjena_lanza403() {
        ClaseGrupal datos = ClaseGrupal.builder()
                .sede(Sede.builder().idSede(2L).build())
                .nombreActividad("Spinning")
                .duracionMinutos(60)
                .cupoMaximo(20)
                .build();

        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        doNothing().when(usuarioActual).validarSede(1L);
        doThrow(new AccesoDenegadoException("Otra sede")).when(usuarioActual).validarSede(2L);

        assertThatThrownBy(() -> claseGrupalService.actualizar(10L, datos))
                .isInstanceOf(AccesoDenegadoException.class);

        verify(usuarioActual).validarSede(1L);
        verify(claseGrupalRepository, never()).save(any(ClaseGrupal.class));
    }

    @Test
    @DisplayName("eliminar con reservas confirmadas o con asistencia lanza ConflictoException (409) y no borra nada")
    void eliminar_conReservasVigentes_lanza409() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(reservaClaseRepository.countByClase_IdClaseAndEstadoNot(10L, EstadoReservaClase.CANCELADA)).thenReturn(2L);

        assertThatThrownBy(() -> claseGrupalService.eliminar(10L))
                .isInstanceOf(ConflictoException.class);

        verify(listaEsperaRepository, never()).deleteByClase_IdClase(10L);
        verify(claseGrupalRepository, never()).delete(any(ClaseGrupal.class));
    }

    @Test
    @DisplayName("eliminar con accesos vinculados a sus reservas lanza ConflictoException (409)")
    void eliminar_conAccesos_lanza409() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(reservaClaseRepository.countByClase_IdClaseAndEstadoNot(10L, EstadoReservaClase.CANCELADA)).thenReturn(0L);
        when(accesoRepository.existsByReservaClase_Clase_IdClase(10L)).thenReturn(true);

        assertThatThrownBy(() -> claseGrupalService.eliminar(10L))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("accesos registrados");

        verify(claseGrupalRepository, never()).delete(any(ClaseGrupal.class));
    }

    @Test
    @DisplayName("eliminar borra la cola y las reservas canceladas antes de la clase")
    void eliminar_sinReservasConfirmadas_borraDependencias() {
        when(claseGrupalRepository.findByIdWithLock(10L)).thenReturn(Optional.of(clase));
        when(reservaClaseRepository.countByClase_IdClaseAndEstadoNot(10L, EstadoReservaClase.CANCELADA)).thenReturn(0L);
        when(accesoRepository.existsByReservaClase_Clase_IdClase(10L)).thenReturn(false);

        claseGrupalService.eliminar(10L);

        verify(usuarioActual).validarSede(1L);
        InOrder orden = inOrder(listaEsperaRepository, reservaClaseRepository, claseGrupalRepository);
        orden.verify(listaEsperaRepository).deleteByClase_IdClase(10L);
        orden.verify(reservaClaseRepository).deleteByClase_IdClaseAndEstado(10L, EstadoReservaClase.CANCELADA);
        orden.verify(claseGrupalRepository).delete(clase);
    }

    @Test
    @DisplayName("listar completa yaReservada y posicionEspera para el socio logueado")
    void listar_socio_completaEstado() {
        ClaseGrupal completa = ClaseGrupal.builder().idClase(11L).sede(sede).cupoMaximo(1).build();
        ClaseGrupal libre = ClaseGrupal.builder().idClase(12L).sede(sede).cupoMaximo(5).build();
        ReservaClase reserva = ReservaClase.builder().clase(clase).build();
        ListaEspera espera = ListaEspera.builder().clase(completa).ordenPosicion(3).build();

        when(sedeRepository.existsById(1L)).thenReturn(true);
        when(claseGrupalRepository.findBySede_IdSede(1L)).thenReturn(List.of(clase, completa, libre));
        when(usuarioActual.obtener()).thenReturn(socio);
        when(reservaClaseRepository.findByUsuario_IdUsuarioAndEstado(5L, EstadoReservaClase.CONFIRMADA)).thenReturn(List.of(reserva));
        when(listaEsperaRepository.findByUsuario_IdUsuario(5L)).thenReturn(List.of(espera));

        claseGrupalService.listar(1L, null, null);

        assertThat(clase.getYaReservada()).isTrue();
        assertThat(clase.getPosicionEspera()).isNull();
        assertThat(completa.getYaReservada()).isFalse();
        assertThat(completa.getPosicionEspera()).isEqualTo(3);
        assertThat(libre.getYaReservada()).isFalse();
        assertThat(libre.getPosicionEspera()).isNull();
    }

    @Test
    @DisplayName("listar para el personal valida la sede y no consulta estado de socio")
    void listar_personal_noConsultaEstado() {
        Usuario recepcionista = Usuario.builder().idUsuario(2L).tipoUsuario(TipoUsuario.RECEPCIONISTA).idSede(1L).build();

        when(sedeRepository.existsById(1L)).thenReturn(true);
        when(claseGrupalRepository.findBySede_IdSede(1L)).thenReturn(List.of(clase));
        when(usuarioActual.obtener()).thenReturn(recepcionista);

        claseGrupalService.listar(1L, null, null);

        verify(usuarioActual).validarSede(recepcionista, 1L);
        verify(listaEsperaRepository, never()).findByUsuario_IdUsuario(any());
        assertThat(clase.getYaReservada()).isNull();
        assertThat(clase.getPosicionEspera()).isNull();
    }

    @Test
    @DisplayName("listar calcula el cupo disponible con una sola consulta agrupada")
    void listar_calculaCupoConConsultaAgrupada() {
        when(sedeRepository.existsById(1L)).thenReturn(true);
        when(claseGrupalRepository.findBySede_IdSede(1L)).thenReturn(List.of(clase));
        when(usuarioActual.obtener()).thenReturn(Usuario.builder().tipoUsuario(TipoUsuario.GERENTE).build());
        when(reservaClaseRepository.contarPorClases(List.of(10L), EstadoReservaClase.CONFIRMADA))
                .thenReturn(List.<Object[]>of(new Object[]{10L, 3L}));

        claseGrupalService.listar(1L, null, null);

        assertThat(clase.getCupoDisponible()).isEqualTo(17);
        verify(reservaClaseRepository, never()).countByClase_IdClaseAndEstado(any(), any());
    }

    @Test
    @DisplayName("listar no falla si el socio tiene inscripciones duplicadas y usa la mejor posición")
    void listar_esperaDuplicada_usaMejorPosicion() {
        ListaEspera primera = ListaEspera.builder().clase(clase).ordenPosicion(4).build();
        ListaEspera repetida = ListaEspera.builder().clase(clase).ordenPosicion(2).build();

        when(sedeRepository.existsById(1L)).thenReturn(true);
        when(claseGrupalRepository.findBySede_IdSede(1L)).thenReturn(List.of(clase));
        when(usuarioActual.obtener()).thenReturn(socio);
        when(listaEsperaRepository.findByUsuario_IdUsuario(5L)).thenReturn(List.of(primera, repetida));

        claseGrupalService.listar(1L, null, null);

        assertThat(clase.getPosicionEspera()).isEqualTo(2);
    }

    @Test
    @DisplayName("obtenerPorId completa el estado del socio logueado")
    void obtenerPorId_socio_completaEstado() {
        ReservaClase reserva = ReservaClase.builder().clase(clase).build();

        when(claseGrupalRepository.findById(10L)).thenReturn(Optional.of(clase));
        when(usuarioActual.obtener()).thenReturn(socio);
        when(reservaClaseRepository.findByUsuario_IdUsuarioAndEstado(5L, EstadoReservaClase.CONFIRMADA)).thenReturn(List.of(reserva));
        when(listaEsperaRepository.findByUsuario_IdUsuario(5L)).thenReturn(List.of());

        ClaseGrupal resultado = claseGrupalService.obtenerPorId(10L);

        assertThat(resultado.getYaReservada()).isTrue();
    }
}
