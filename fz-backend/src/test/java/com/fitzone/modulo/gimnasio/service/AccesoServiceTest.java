package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.QrTokenResponse;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
class AccesoServiceTest {

    @Mock
    private AccesoRepository accesoRepository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private QrTokenService qrTokenService;

    @InjectMocks
    private AccesoService accesoService;

    private Usuario socio;
    private Usuario externo;
    private Usuario recepcionistaSede1;
    private Sede sedeCentral;
    private Membresia membresiaActiva;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        socio = Usuario.builder()
                .idUsuario(1L)
                .dni("12345678")
                .nombre("Juan")
                .apellido("Perez")
                .email("socio@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        externo = Usuario.builder()
                .idUsuario(2L)
                .dni("87654321")
                .nombre("Carlos")
                .apellido("Gomez")
                .email("externo@fitzone.com")
                .tipoUsuario(TipoUsuario.EXTERNO)
                .build();

        recepcionistaSede1 = Usuario.builder()
                .idUsuario(3L)
                .dni("32444555")
                .nombre("Lucia")
                .apellido("Perez")
                .email("recepcionista@fitzone.com")
                .tipoUsuario(TipoUsuario.RECEPCIONISTA)
                .idSede(1L)
                .build();

        sedeCentral = Sede.builder()
                .idSede(1L)
                .nombre("Sede Central")
                .aforoMaximo(50)
                .build();

        membresiaActiva = Membresia.builder()
                .idMembresia(1L)
                .usuario(socio)
                .estado(EstadoMembresia.ACTIVO)
                .fechaInicio(LocalDate.now().minusDays(5))
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("generarQr retorna token y segundos restantes para socio con membresía activa")
    void generarQr_socioConMembresia_retornaToken() {
        QrTokenResponse tokenMock = QrTokenResponse.builder()
                .tokenQr("token-valido")
                .segundosRestantes(55L)
                .build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoAndFechaInicioLessThanEqualAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(EstadoMembresia.ACTIVO), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(true);
        when(qrTokenService.generarToken(1L)).thenReturn(tokenMock);

        QrTokenResponse response = accesoService.generarQr(1L);

        assertThat(response.getTokenQr()).isEqualTo("token-valido");
        assertThat(response.getSegundosRestantes()).isEqualTo(55L);
    }

    @Test
    @DisplayName("generarMiQr resuelve el socio desde la sesión autenticada (SCRUM-96)")
    void generarMiQr_socioAutenticado_retornaToken() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("socio@fitzone.com", null, List.of())
        );

        QrTokenResponse tokenMock = QrTokenResponse.builder()
                .tokenQr("token-me-valido")
                .segundosRestantes(60L)
                .build();

        when(usuarioRepository.findByEmail("socio@fitzone.com")).thenReturn(Optional.of(socio));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoAndFechaInicioLessThanEqualAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(EstadoMembresia.ACTIVO), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(true);
        when(qrTokenService.generarToken(1L)).thenReturn(tokenMock);

        QrTokenResponse response = accesoService.generarMiQr(null);

        assertThat(response.getTokenQr()).isEqualTo("token-me-valido");
        assertThat(response.getSegundosRestantes()).isEqualTo(60L);
    }

    @Test
    @DisplayName("generarQr para usuario EXTERNO lanza ReglaNegocioException (422)")
    void generarQr_usuarioExterno_lanza422() {
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(externo));

        assertThatThrownBy(() -> accesoService.generarQr(2L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("Solo los socios pueden generar un código QR");
    }

    @Test
    @DisplayName("generarQr para socio sin membresía activa lanza MEMBRESIA_INACTIVA")
    void generarQr_socioSinMembresia_lanzaMembresiaInactiva() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoAndFechaInicioLessThanEqualAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(EstadoMembresia.ACTIVO), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(false);

        assertThatThrownBy(() -> accesoService.generarQr(1L))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.MEMBRESIA_INACTIVA));
    }

    @Test
    @DisplayName("registrarIngreso con condiciones válidas registra y guarda el acceso")
    void registrarIngreso_valido_guardaAcceso() {
        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(accesoRepository.findByTokenQr("token-ok")).thenReturn(Optional.empty());
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findMembresiaActivaParaIngreso(eq(1L), eq(EstadoMembresia.ACTIVO), any(LocalDate.class)))
                .thenReturn(Optional.of(membresiaActiva));
        when(accesoRepository.findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(1L)).thenReturn(Optional.empty());
        when(sedeRepository.findByIdWithLock(1L)).thenReturn(Optional.of(sedeCentral));
        when(accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(1L)).thenReturn(10L);
        when(accesoRepository.save(any(Acceso.class))).thenAnswer(inv -> inv.getArgument(0));

        Acceso acceso = accesoService.registrarIngreso("token-ok", 1L);

        assertThat(acceso.getUsuario()).isEqualTo(socio);
        assertThat(acceso.getSede()).isEqualTo(sedeCentral);
        assertThat(acceso.getTokenQr()).isEqualTo("token-ok");
        assertThat(acceso.getFechaHoraIngreso()).isNotNull();
        assertThat(acceso.getFechaHoraEgreso()).isNull();
        verify(accesoRepository).save(any(Acceso.class));
    }

    @Test
    @DisplayName("registrarIngreso sin idSede en el body toma la sede asignada del recepcionista autenticado (SCRUM-96)")
    void registrarIngreso_sinIdSede_tomaSedeDeRecepcionista() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("recepcionista@fitzone.com", null, List.of())
        );
        when(usuarioRepository.findByEmail("recepcionista@fitzone.com")).thenReturn(Optional.of(recepcionistaSede1));
        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(accesoRepository.findByTokenQr("token-ok")).thenReturn(Optional.empty());
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findMembresiaActivaParaIngreso(eq(1L), eq(EstadoMembresia.ACTIVO), any(LocalDate.class)))
                .thenReturn(Optional.of(membresiaActiva));
        when(accesoRepository.findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(1L)).thenReturn(Optional.empty());
        when(sedeRepository.findByIdWithLock(1L)).thenReturn(Optional.of(sedeCentral));
        when(accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(1L)).thenReturn(5L);
        when(accesoRepository.save(any(Acceso.class))).thenAnswer(inv -> inv.getArgument(0));

        Acceso acceso = accesoService.registrarIngreso("token-ok", null);

        assertThat(acceso.getSede().getIdSede()).isEqualTo(1L);
        verify(accesoRepository).save(any(Acceso.class));
    }

    @Test
    @DisplayName("registrarIngreso rechaza con 403 cuando un recepcionista intenta operar en otra sede (SCRUM-96)")
    void registrarIngreso_otraSedeDeRecepcionista_lanza403() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("recepcionista@fitzone.com", null, List.of())
        );
        when(usuarioRepository.findByEmail("recepcionista@fitzone.com")).thenReturn(Optional.of(recepcionistaSede1));

        assertThatThrownBy(() -> accesoService.registrarIngreso("token-ok", 2L))
                .isInstanceOf(AccesoDenegadoException.class)
                .hasMessageContaining("sede asignada");
    }

    @Test
    @DisplayName("registrarIngreso idempotente devuelve el acceso abierto existente ante reintento con mismo QR")
    void registrarIngreso_reintentoMismoTokenAbierto_esIdempotente() {
        Acceso accesoPrevio = Acceso.builder()
                .idAcceso(100L)
                .usuario(socio)
                .sede(sedeCentral)
                .tokenQr("token-ok")
                .fechaHoraIngreso(LocalDateTime.now().minusMinutes(2))
                .fechaHoraEgreso(null)
                .build();

        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(accesoRepository.findByTokenQr("token-ok")).thenReturn(Optional.of(accesoPrevio));

        Acceso resultado = accesoService.registrarIngreso("token-ok", 1L);

        assertThat(resultado.getIdAcceso()).isEqualTo(100L);
        verify(accesoRepository, never()).save(any());
    }

    @Test
    @DisplayName("registrarIngreso rechaza token QR reutilizado cuando el acceso anterior ya egresó")
    void registrarIngreso_reintentoTokenCerrado_lanzaQrVencido() {
        Acceso accesoCerrado = Acceso.builder()
                .idAcceso(100L)
                .usuario(socio)
                .sede(sedeCentral)
                .tokenQr("token-ok")
                .fechaHoraIngreso(LocalDateTime.now().minusMinutes(30))
                .fechaHoraEgreso(LocalDateTime.now().minusMinutes(5))
                .build();

        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(accesoRepository.findByTokenQr("token-ok")).thenReturn(Optional.of(accesoCerrado));

        assertThatThrownBy(() -> accesoService.registrarIngreso("token-ok", 1L))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.QR_VENCIDO));

        verify(accesoRepository, never()).save(any());
    }

    @Test
    @DisplayName("registrarIngreso cuando socio no tiene membresía activa lanza MEMBRESIA_INACTIVA")
    void registrarIngreso_membresiaInactiva_lanzaMembresiaInactiva() {
        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(accesoRepository.findByTokenQr("token-ok")).thenReturn(Optional.empty());
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findMembresiaActivaParaIngreso(eq(1L), eq(EstadoMembresia.ACTIVO), any(LocalDate.class)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> accesoService.registrarIngreso("token-ok", 1L))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.MEMBRESIA_INACTIVA));

        verify(accesoRepository, never()).save(any());
    }

    @Test
    @DisplayName("registrarIngreso cuando usuario ya está ingresado lanza YA_INGRESADO (409)")
    void registrarIngreso_yaIngresado_lanzaYaIngresado() {
        Acceso accesoAbierto = Acceso.builder().idAcceso(5L).usuario(socio).build();

        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(accesoRepository.findByTokenQr("token-ok")).thenReturn(Optional.empty());
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findMembresiaActivaParaIngreso(eq(1L), eq(EstadoMembresia.ACTIVO), any(LocalDate.class)))
                .thenReturn(Optional.of(membresiaActiva));
        when(accesoRepository.findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(1L)).thenReturn(Optional.of(accesoAbierto));

        assertThatThrownBy(() -> accesoService.registrarIngreso("token-ok", 1L))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.YA_INGRESADO));

        verify(accesoRepository, never()).save(any());
    }

    @Test
    @DisplayName("registrarIngreso cuando la sede llegó a su aforo máximo lanza AFORO_COMPLETO (409)")
    void registrarIngreso_aforoCompleto_lanzaAforoCompleto() {
        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(accesoRepository.findByTokenQr("token-ok")).thenReturn(Optional.empty());
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.findMembresiaActivaParaIngreso(eq(1L), eq(EstadoMembresia.ACTIVO), any(LocalDate.class)))
                .thenReturn(Optional.of(membresiaActiva));
        when(accesoRepository.findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(1L)).thenReturn(Optional.empty());
        when(sedeRepository.findByIdWithLock(1L)).thenReturn(Optional.of(sedeCentral));
        when(accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(1L)).thenReturn(50L);

        assertThatThrownBy(() -> accesoService.registrarIngreso("token-ok", 1L))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.AFORO_COMPLETO));

        verify(accesoRepository, never()).save(any());
    }

    @Test
    @DisplayName("registrarEgreso registra fechaHoraEgreso exitosamente")
    void registrarEgreso_exito() {
        Acceso accesoAbierto = Acceso.builder()
                .idAcceso(10L)
                .fechaHoraIngreso(LocalDateTime.now().minusHours(1))
                .fechaHoraEgreso(null)
                .build();

        when(accesoRepository.findByIdWithLock(10L)).thenReturn(Optional.of(accesoAbierto));
        when(accesoRepository.save(any(Acceso.class))).thenAnswer(inv -> inv.getArgument(0));

        Acceso egresado = accesoService.registrarEgreso(10L);

        assertThat(egresado.getFechaHoraEgreso()).isNotNull();
    }

    @Test
    @DisplayName("registrarEgreso sobre un acceso que ya egresó lanza ReglaNegocioException (422)")
    void registrarEgreso_yaEgresado_lanza422() {
        Acceso accesoCerrado = Acceso.builder()
                .idAcceso(10L)
                .fechaHoraIngreso(LocalDateTime.now().minusHours(2))
                .fechaHoraEgreso(LocalDateTime.now().minusHours(1))
                .build();

        when(accesoRepository.findByIdWithLock(10L)).thenReturn(Optional.of(accesoCerrado));

        assertThatThrownBy(() -> accesoService.registrarEgreso(10L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("ya tiene registrada su fecha y hora de egreso");
    }
}
