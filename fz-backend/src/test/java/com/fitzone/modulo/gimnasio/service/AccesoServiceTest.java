package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.QrTokenResponse;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
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
    private Sede sedeCentral;

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

        sedeCentral = Sede.builder()
                .idSede(1L)
                .nombre("Sede Central")
                .aforoMaximo(50)
                .build();
    }

    @Test
    @DisplayName("generarQr retorna token y segundos restantes para socio con membresía activa")
    void generarQr_socioConMembresia_retornaToken() {
        QrTokenResponse tokenMock = QrTokenResponse.builder()
                .tokenQr("token-valido")
                .segundosRestantes(55L)
                .build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class)))
                .thenReturn(true);
        when(qrTokenService.generarToken(1L)).thenReturn(tokenMock);

        QrTokenResponse response = accesoService.generarQr(1L);

        assertThat(response.getTokenQr()).isEqualTo("token-valido");
        assertThat(response.getSegundosRestantes()).isEqualTo(55L);
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
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class)))
                .thenReturn(false);

        assertThatThrownBy(() -> accesoService.generarQr(1L))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.MEMBRESIA_INACTIVA));
    }

    @Test
    @DisplayName("registrarIngreso con condiciones válidas registra y guarda el acceso")
    void registrarIngreso_valido_guardaAcceso() {
        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sedeCentral));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class)))
                .thenReturn(true);
        when(accesoRepository.findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(1L)).thenReturn(Optional.empty());
        when(accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(1L)).thenReturn(10L);
        when(accesoRepository.save(any(Acceso.class))).thenAnswer(inv -> inv.getArgument(0));

        Acceso acceso = accesoService.registrarIngreso("token-ok", 1L);

        assertThat(acceso.getUsuario()).isEqualTo(socio);
        assertThat(acceso.getSede()).isEqualTo(sedeCentral);
        assertThat(acceso.getFechaHoraIngreso()).isNotNull();
        assertThat(acceso.getFechaHoraEgreso()).isNull();
    }

    @Test
    @DisplayName("registrarIngreso cuando socio no tiene membresía activa lanza MEMBRESIA_INACTIVA")
    void registrarIngreso_membresiaInactiva_lanzaMembresiaInactiva() {
        when(qrTokenService.validarYObtenerUsuario("token-ok")).thenReturn(1L);
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sedeCentral));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class)))
                .thenReturn(false);

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
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sedeCentral));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class)))
                .thenReturn(true);
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
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(sedeCentral));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(socio));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                eq(1L), eq(List.of(EstadoMembresia.ACTIVO)), any(LocalDate.class)))
                .thenReturn(true);
        when(accesoRepository.findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(1L)).thenReturn(Optional.empty());
        when(accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(1L)).thenReturn(50L); // Capacidad max = 50

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

        when(accesoRepository.findById(10L)).thenReturn(Optional.of(accesoAbierto));
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

        when(accesoRepository.findById(10L)).thenReturn(Optional.of(accesoCerrado));

        assertThatThrownBy(() -> accesoService.registrarEgreso(10L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("ya tiene registrada su fecha y hora de egreso");
    }
}
