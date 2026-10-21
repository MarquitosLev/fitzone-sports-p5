package com.fitzone.modulo.canchas.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.models.EstadoFranja;
import com.fitzone.modulo.canchas.models.FranjaDisponibilidad;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.canchas.repository.CanchaRepository;
import com.fitzone.modulo.canchas.repository.ReservaCanchaRepository;
import com.fitzone.modulo.canchas.strategy.CalculadorPrecioCancha;
import com.fitzone.modulo.canchas.strategy.DescuentoSocioEstrategia;
import com.fitzone.modulo.canchas.strategy.PrecioBaseEstrategia;
import com.fitzone.modulo.canchas.strategy.RecargoHorarioPicoEstrategia;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CanchaServiceReservaTest {

    @Mock
    private CanchaRepository canchaRepository;

    @Mock
    private ReservaCanchaRepository reservaCanchaRepository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    private CanchaService canchaService;
    private Cancha cancha;
    private Usuario socio;
    private Usuario externo;

    @BeforeEach
    void setUp() {
        CalculadorPrecioCancha calculador = new CalculadorPrecioCancha(List.of(
                new PrecioBaseEstrategia(),
                new RecargoHorarioPicoEstrategia(new BigDecimal("0.20")),
                new DescuentoSocioEstrategia()
        ));

        canchaService = new CanchaService(
                canchaRepository,
                reservaCanchaRepository,
                sedeRepository,
                usuarioRepository,
                membresiaRepository,
                calculador
        );

        cancha = Cancha.builder()
                .idCancha(1L)
                .nombre("Cancha Pádel 1")
                .precioBaseHora(new BigDecimal("10000.00"))
                .enMantenimiento(false)
                .build();

        socio = Usuario.builder()
                .idUsuario(10L)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        externo = Usuario.builder()
                .idUsuario(20L)
                .tipoUsuario(TipoUsuario.EXTERNO)
                .build();
    }

    @Test
    @DisplayName("Reservar: socio reserva turno exitosamente con congelamiento de precio")
    void testReservarSocioExitoso() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(socio)
                .build();

        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(socio));
        when(canchaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.existsSolapamiento(1L, inicio, fin)).thenReturn(false);
        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                10L, List.of(EstadoMembresia.ACTIVO), LocalDate.now())).thenReturn(true);
        when(reservaCanchaRepository.save(any(ReservaCancha.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservaCancha resultado = canchaService.reservar(1L, reserva);

        assertThat(resultado).isNotNull();
        // $10.000 con -15% socio = $8.500
        assertThat(resultado.getPrecioFinal()).isEqualByComparingTo("8500.00");
        assertThat(resultado.getCancha()).isEqualTo(cancha);
        assertThat(resultado.getUsuario()).isEqualTo(socio);
        verify(reservaCanchaRepository).save(any(ReservaCancha.class));
    }

    @Test
    @DisplayName("Reservar: cliente externo reserva turno exitosamente")
    void testReservarExternoExitoso() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(externo)
                .build();

        when(usuarioRepository.findById(20L)).thenReturn(Optional.of(externo));
        when(canchaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.existsSolapamiento(1L, inicio, fin)).thenReturn(false);
        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.save(any(ReservaCancha.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservaCancha resultado = canchaService.reservar(1L, reserva);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getPrecioFinal()).isEqualByComparingTo("10000.00");
        verify(reservaCanchaRepository).save(any(ReservaCancha.class));
    }

    @Test
    @DisplayName("Reservar: falla con 422 si la cancha está en mantenimiento")
    void testReservarCanchaEnMantenimiento() {
        cancha.setEnMantenimiento(true);
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(socio)
                .build();

        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(socio));
        when(canchaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(cancha));

        assertThatThrownBy(() -> canchaService.reservar(1L, reserva))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("mantenimiento");
    }

    @Test
    @DisplayName("Reservar: falla con 409 si existe solapamiento temporal (RN-02)")
    void testReservarSolapamiento() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(socio)
                .build();

        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(socio));
        when(canchaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.existsSolapamiento(1L, inicio, fin)).thenReturn(true);

        assertThatThrownBy(() -> canchaService.reservar(1L, reserva))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya se encuentra reservada");
    }

    @Test
    @DisplayName("Reservar: falla con 422 si las horas no son enteras")
    void testReservarHorasNoEnteras() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 30);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(socio)
                .build();

        assertThatThrownBy(() -> canchaService.reservar(1L, reserva))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("horas enteras");
    }

    @Test
    @DisplayName("Reservar: falla con 422 si la reserva está en el pasado")
    void testReservarEnElPasado() {
        LocalDateTime inicio = LocalDate.now().minusDays(1).atTime(10, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(socio)
                .build();

        assertThatThrownBy(() -> canchaService.reservar(1L, reserva))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("fecha y hora futura");
    }

    @Test
    @DisplayName("Reservar: falla con 422 si la reserva está fuera del horario de atención")
    void testReservarFueraDeHorario() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(6, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(socio)
                .build();

        assertThatThrownBy(() -> canchaService.reservar(1L, reserva))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("horario de atención");
    }

    @Test
    @DisplayName("Reservar: falla con 422 si el usuario tiene rol RECEPCIONISTA")
    void testReservarRolNoPermitido() {
        Usuario recepcionista = Usuario.builder()
                .idUsuario(30L)
                .tipoUsuario(TipoUsuario.RECEPCIONISTA)
                .build();

        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(recepcionista)
                .build();

        when(usuarioRepository.findById(30L)).thenReturn(Optional.of(recepcionista));

        assertThatThrownBy(() -> canchaService.reservar(1L, reserva))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("Solo usuarios SOCIO y EXTERNO");
    }

    @Test
    @DisplayName("Disponibilidad: genera franjas con estado LIBRE y OCUPADO")
    void testObtenerDisponibilidadConOcupados() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        LocalDateTime inicioOcupado = fecha.atTime(10, 0);
        LocalDateTime finOcupado = fecha.atTime(11, 0);

        ReservaCancha reservaExistente = ReservaCancha.builder()
                .fechaHoraInicio(inicioOcupado)
                .fechaHoraFin(finOcupado)
                .build();

        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.findByCancha_IdCanchaAndFechaHoraInicioBetween(
                1L, fecha.atTime(8, 0), fecha.atTime(23, 0)))
                .thenReturn(List.of(reservaExistente));

        List<FranjaDisponibilidad> franjas = canchaService.obtenerDisponibilidad(1L, fecha);

        // De 08:00 a 23:00 son 15 franjas horarias
        assertThat(franjas).hasSize(15);

        FranjaDisponibilidad franja10 = franjas.stream()
                .filter(f -> f.getHoraInicio().getHour() == 10)
                .findFirst().orElseThrow();
        assertThat(franja10.getEstado()).isEqualTo(EstadoFranja.OCUPADO);

        FranjaDisponibilidad franja11 = franjas.stream()
                .filter(f -> f.getHoraInicio().getHour() == 11)
                .findFirst().orElseThrow();
        assertThat(franja11.getEstado()).isEqualTo(EstadoFranja.LIBRE);
    }

    @Test
    @DisplayName("Disponibilidad: cancha en mantenimiento muestra franjas no ocupadas como MANTENIMIENTO")
    void testObtenerDisponibilidadEnMantenimiento() {
        cancha.setEnMantenimiento(true);
        LocalDate fecha = LocalDate.now().plusDays(1);

        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.findByCancha_IdCanchaAndFechaHoraInicioBetween(
                1L, fecha.atTime(8, 0), fecha.atTime(23, 0)))
                .thenReturn(Collections.emptyList());

        List<FranjaDisponibilidad> franjas = canchaService.obtenerDisponibilidad(1L, fecha);

        assertThat(franjas).hasSize(15);
        assertThat(franjas).allMatch(f -> f.getEstado() == EstadoFranja.MANTENIMIENTO);
    }

    @Test
    @DisplayName("Listar reservas por usuario: retorna lista de reservas")
    void testListarReservasPorUsuario() {
        ReservaCancha r1 = ReservaCancha.builder().idReservaCancha(100L).build();
        when(usuarioRepository.existsById(10L)).thenReturn(true);
        when(reservaCanchaRepository.findByUsuario_IdUsuario(10L)).thenReturn(List.of(r1));

        List<ReservaCancha> resultado = canchaService.listarReservasPorUsuario(10L);

        assertThat(resultado).containsExactly(r1);
    }
}
