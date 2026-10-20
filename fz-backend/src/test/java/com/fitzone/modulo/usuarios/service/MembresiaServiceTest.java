package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.PlanRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
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
class MembresiaServiceTest {

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private PlanRepository planRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private MembresiaService membresiaService;

    private Usuario socio;
    private Usuario externo;
    private Plan planMensual;
    private Membresia membresiaActiva;

    @BeforeEach
    void setUp() {
        socio = Usuario.builder()
                .idUsuario(1L)
                .dni("12345678")
                .nombre("Juan")
                .apellido("Perez")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        externo = Usuario.builder()
                .idUsuario(2L)
                .dni("87654321")
                .nombre("Carlos")
                .apellido("Gomez")
                .tipoUsuario(TipoUsuario.EXTERNO)
                .build();

        planMensual = Plan.builder()
                .idPlan(1)
                .nombre("Plan Mensual")
                .precioBase(new BigDecimal("15000.00"))
                .duracionMeses(1)
                .build();

        membresiaActiva = Membresia.builder()
                .idMembresia(10L)
                .usuario(socio)
                .plan(planMensual)
                .fechaInicio(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .estado(EstadoMembresia.ACTIVO)
                .build();
    }

    @Test
    @DisplayName("listarPlanes retorna la lista completa de planes")
    void listarPlanes_retornaLista() {
        when(planRepository.findAll()).thenReturn(List.of(planMensual));

        List<Plan> resultado = membresiaService.listarPlanes();

        assertThat(resultado).hasSize(1);
        assertThat(resultado.getFirst().getNombre()).isEqualTo("Plan Mensual");
    }

    @Test
    @DisplayName("crear membresía con datos válidos asigna fechas y guarda con estado ACTIVO")
    void crear_datosValidos_guardaActivo() {
        Membresia nueva = Membresia.builder().build();
        nueva.setIdUsuario(1L);
        nueva.setIdPlan(1);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoIn(1L, List.of(EstadoMembresia.ACTIVO, EstadoMembresia.SUSPENDIDO)))
                .thenReturn(false);
        when(planRepository.findById(1)).thenReturn(Optional.of(planMensual));
        when(membresiaRepository.save(any(Membresia.class))).thenAnswer(inv -> inv.getArgument(0));

        Membresia resultado = membresiaService.crear(nueva);

        assertThat(resultado.getEstado()).isEqualTo(EstadoMembresia.ACTIVO);
        assertThat(resultado.getUsuario()).isEqualTo(socio);
        assertThat(resultado.getPlan()).isEqualTo(planMensual);
        assertThat(resultado.getFechaInicio()).isEqualTo(LocalDate.now());
        assertThat(resultado.getFechaVencimiento()).isEqualTo(LocalDate.now().plusMonths(1));
    }

    @Test
    @DisplayName("crear membresía para usuario con rol EXTERNO lanza ReglaNegocioException (422)")
    void crear_usuarioNoSocio_lanza422() {
        Membresia nueva = Membresia.builder().build();
        nueva.setIdUsuario(2L);
        nueva.setIdPlan(1);

        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(externo));

        assertThatThrownBy(() -> membresiaService.crear(nueva))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("Solo los usuarios con rol SOCIO");

        verify(membresiaRepository, never()).save(any());
    }

    @Test
    @DisplayName("crear membresía para socio que ya tiene membresía activa lanza ConflictoException (409)")
    void crear_socioConMembresiaVigente_lanza409() {
        Membresia nueva = Membresia.builder().build();
        nueva.setIdUsuario(1L);
        nueva.setIdPlan(1);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoIn(1L, List.of(EstadoMembresia.ACTIVO, EstadoMembresia.SUSPENDIDO)))
                .thenReturn(true);

        assertThatThrownBy(() -> membresiaService.crear(nueva))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya cuenta con una membresía activa o suspendida");

        verify(membresiaRepository, never()).save(any());
    }

    @Test
    @DisplayName("obtenerVigentePorUsuario retorna membresía vigente si existe")
    void obtenerVigentePorUsuario_existe_retornaMembresia() {
        when(usuarioRepository.existsById(1L)).thenReturn(true);
        when(membresiaRepository.findFirstByUsuario_IdUsuarioAndEstadoInOrderByFechaVencimientoDesc(1L, List.of(EstadoMembresia.ACTIVO, EstadoMembresia.SUSPENDIDO)))
                .thenReturn(Optional.of(membresiaActiva));

        Membresia resultado = membresiaService.obtenerVigentePorUsuario(1L);

        assertThat(resultado).isEqualTo(membresiaActiva);
    }

    @Test
    @DisplayName("obtenerVigentePorUsuario lanza 404 si el usuario no tiene membresía activa")
    void obtenerVigentePorUsuario_noTiene_lanza404() {
        when(usuarioRepository.existsById(1L)).thenReturn(true);
        when(membresiaRepository.findFirstByUsuario_IdUsuarioAndEstadoInOrderByFechaVencimientoDesc(1L, List.of(EstadoMembresia.ACTIVO, EstadoMembresia.SUSPENDIDO)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> membresiaService.obtenerVigentePorUsuario(1L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("renovar membresía ACTIVA extiende su fecha de vencimiento")
    void renovar_membresiaActiva_extiendeVencimiento() {
        LocalDate vencimientoAnterior = membresiaActiva.getFechaVencimiento();

        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresiaActiva));
        when(membresiaRepository.save(any(Membresia.class))).thenAnswer(inv -> inv.getArgument(0));

        Membresia renovada = membresiaService.renovar(10L);

        assertThat(renovada.getFechaVencimiento()).isEqualTo(vencimientoAnterior.plusMonths(1));
        assertThat(renovada.getEstado()).isEqualTo(EstadoMembresia.ACTIVO);
    }

    @Test
    @DisplayName("renovar membresía VENCIDA la activa iniciando desde hoy")
    void renovar_membresiaVencida_reiniciaDesdeHoy() {
        membresiaActiva.setEstado(EstadoMembresia.VENCIDO);
        membresiaActiva.setFechaVencimiento(LocalDate.now().minusDays(5));

        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresiaActiva));
        when(membresiaRepository.save(any(Membresia.class))).thenAnswer(inv -> inv.getArgument(0));

        Membresia renovada = membresiaService.renovar(10L);

        assertThat(renovada.getEstado()).isEqualTo(EstadoMembresia.ACTIVO);
        assertThat(renovada.getFechaInicio()).isEqualTo(LocalDate.now());
        assertThat(renovada.getFechaVencimiento()).isEqualTo(LocalDate.now().plusMonths(1));
    }

    @Test
    @DisplayName("renovar membresía CANCELADA lanza ReglaNegocioException (422)")
    void renovar_membresiaCancelada_lanza422() {
        membresiaActiva.setEstado(EstadoMembresia.CANCELADO);

        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresiaActiva));

        assertThatThrownBy(() -> membresiaService.renovar(10L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("cancelada no puede ser renovada");
    }

    @Test
    @DisplayName("cambiarEstado a SUSPENDIDO suspende membresía activa")
    void cambiarEstado_activoASuspendido_exito() {
        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresiaActiva));
        when(membresiaRepository.save(any(Membresia.class))).thenAnswer(inv -> inv.getArgument(0));

        Membresia resultado = membresiaService.cambiarEstado(10L, EstadoMembresia.SUSPENDIDO);

        assertThat(resultado.getEstado()).isEqualTo(EstadoMembresia.SUSPENDIDO);
    }

    @Test
    @DisplayName("cambiarEstado a CANCELADO setea fecha de cancelación")
    void cambiarEstado_activoACancelado_seteaFechaCancelacion() {
        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresiaActiva));
        when(membresiaRepository.save(any(Membresia.class))).thenAnswer(inv -> inv.getArgument(0));

        Membresia resultado = membresiaService.cambiarEstado(10L, EstadoMembresia.CANCELADO);

        assertThat(resultado.getEstado()).isEqualTo(EstadoMembresia.CANCELADO);
        assertThat(resultado.getFechaCancelacion()).isEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("cambiarEstado con transición no permitida lanza ReglaNegocioException (422)")
    void cambiarEstado_transicionInvalida_lanza422() {
        membresiaActiva.setEstado(EstadoMembresia.CANCELADO);

        when(membresiaRepository.findById(10L)).thenReturn(Optional.of(membresiaActiva));

        assertThatThrownBy(() -> membresiaService.cambiarEstado(10L, EstadoMembresia.ACTIVO))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("No se permite cambiar el estado");
    }

    @Test
    @DisplayName("expirarMembresiasVencidas actualiza a VENCIDO membresías expiradas")
    void expirarMembresiasVencidas_marcaComoVencido() {
        when(membresiaRepository.findByEstadoAndFechaVencimientoBefore(eq(EstadoMembresia.ACTIVO), any(LocalDate.class)))
                .thenReturn(List.of(membresiaActiva));

        membresiaService.expirarMembresiasVencidas();

        assertThat(membresiaActiva.getEstado()).isEqualTo(EstadoMembresia.VENCIDO);
        verify(membresiaRepository).saveAll(List.of(membresiaActiva));
    }
}
