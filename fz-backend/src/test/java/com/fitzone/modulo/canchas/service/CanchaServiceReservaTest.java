package com.fitzone.modulo.canchas.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.UsuarioActual;
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
import com.fitzone.modulo.gimnasio.models.Sede;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
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

    @Mock
    private UsuarioActual usuarioActual;

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
                calculador,
                usuarioActual
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

        when(usuarioActual.obtener()).thenReturn(socio);
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
    @DisplayName("Reservar como invitado: el externo sin cuenta reserva sin descuento")
    void testReservarComoInvitadoExitoso() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(externo)
                .build();

        when(canchaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.existsSolapamiento(1L, inicio, fin)).thenReturn(false);
        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.save(any(ReservaCancha.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservaCancha resultado = canchaService.reservarComoInvitado(1L, externo, reserva);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getPrecioFinal()).isEqualByComparingTo("10000.00");
        assertThat(resultado.getUsuario()).isEqualTo(externo);
        verify(reservaCanchaRepository).save(any(ReservaCancha.class));
    }

    @Test
    @DisplayName("Reservar con sesión: un externo recibe 422 porque reserva como invitado")
    void testReservarConSesionExternoRechazado() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        ReservaCancha reserva = ReservaCancha.builder().fechaHoraInicio(inicio).fechaHoraFin(inicio.plusHours(1)).build();
        when(usuarioActual.obtener()).thenReturn(externo);

        assertThatThrownBy(() -> canchaService.reservar(1L, reserva))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("reservan solo los socios");
    }

    @Test
    @DisplayName("Reservar como invitado: un socio no puede usar ese flujo")
    void testReservarComoInvitadoConSocio() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        ReservaCancha reserva = ReservaCancha.builder().fechaHoraInicio(inicio).fechaHoraFin(inicio.plusHours(1)).build();

        assertThatThrownBy(() -> canchaService.reservarComoInvitado(1L, socio, reserva))
                .isInstanceOf(ReglaNegocioException.class);
        verify(reservaCanchaRepository, never()).save(any(ReservaCancha.class));
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

        when(usuarioActual.obtener()).thenReturn(socio);
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

        when(usuarioActual.obtener()).thenReturn(socio);
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

        when(usuarioActual.obtener()).thenReturn(recepcionista);

        assertThatThrownBy(() -> canchaService.reservar(1L, reserva))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("reservan solo los socios");
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
    @DisplayName("Reservar: un idUsuario ajeno en el body se ignora y la reserva queda a nombre del logueado")
    void testReservarIgnoraUsuarioDelBody() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime fin = inicio.plusHours(1);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(inicio)
                .fechaHoraFin(fin)
                .usuario(externo)
                .build();

        when(usuarioActual.obtener()).thenReturn(socio);
        when(canchaRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.existsSolapamiento(1L, inicio, fin)).thenReturn(false);
        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(reservaCanchaRepository.save(any(ReservaCancha.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReservaCancha resultado = canchaService.reservar(1L, reserva);

        assertThat(resultado.getUsuario()).isEqualTo(socio);
        verify(membresiaRepository)
                .existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(eq(10L), any(), any());
    }

    @Test
    @DisplayName("Alta de cancha: el gerente de otra sede recibe 403 y no se guarda nada")
    void testCrearCanchaEnOtraSede() {
        Cancha nueva = Cancha.builder()
                .sede(Sede.builder().idSede(2L).build())
                .nombre("Cancha Paddle 2")
                .precioBaseHora(new BigDecimal("15000.00"))
                .build();
        doThrow(new AccesoDenegadoException("No tiene permisos para operar sobre una sede distinta a la asignada"))
                .when(usuarioActual).validarSede(2L);

        assertThatThrownBy(() -> canchaService.crear(nueva))
                .isInstanceOf(AccesoDenegadoException.class);
        verify(canchaRepository, never()).save(any(Cancha.class));
    }

    @Test
    @DisplayName("Mantenimiento: valida la sede de la cancha antes de cambiarla")
    void testMantenimientoValidaSede() {
        cancha.setSede(Sede.builder().idSede(1L).build());
        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(canchaRepository.save(any(Cancha.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Cancha resultado = canchaService.cambiarMantenimiento(1L, true);

        assertThat(resultado.isEnMantenimiento()).isTrue();
        verify(usuarioActual).validarSede(1L);
    }

    @Test
    @DisplayName("Mis reservas: devuelve solo las del usuario logueado")
    void testListarMias() {
        ReservaCancha r1 = ReservaCancha.builder().idReservaCancha(100L).build();
        when(usuarioActual.obtener()).thenReturn(socio);
        when(reservaCanchaRepository.findConCanchaYSedeByUsuario(10L)).thenReturn(List.of(r1));

        assertThat(canchaService.listarMias()).containsExactly(r1);
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
