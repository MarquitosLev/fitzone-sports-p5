package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.exception.RequiereInicioSesionException;
import com.fitzone.core.exception.ServicioExternoException;
import com.fitzone.core.security.SupabaseAuthClient;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.pagos.pasarela.PasarelaPago;
import com.fitzone.modulo.pagos.pasarela.RespuestaPasarela;
import com.fitzone.modulo.usuarios.models.AltaSocioRequest;
import com.fitzone.modulo.usuarios.models.AltaSocioResponse;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.ReintentoCuentaRequest;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.PlanRepository;
import com.fitzone.modulo.usuarios.service.AltaSocioRegistro.AltaRegistrada;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AltaSocioServiceTest {

    @Mock private PlanRepository planRepository;
    @Mock private SedeRepository sedeRepository;
    @Mock private PasarelaPago pasarelaPago;
    @Mock private SupabaseAuthClient supabaseAuthClient;
    @Mock private AltaSocioRegistro registro;

    private AltaSocioService service;
    private AltaSocioRequest request;
    private AltaRegistrada alta;
    private final UUID authId = UUID.randomUUID();
    private final UUID codigoReintento = UUID.randomUUID();
    private final Plan plan = Plan.builder().idPlan(1).nombre("Plan Mensual")
            .precioBase(new BigDecimal("15000")).duracionMeses(1).build();

    @BeforeEach
    void setUp() {
        service = new AltaSocioService(planRepository, sedeRepository, pasarelaPago, supabaseAuthClient, registro);
        request = AltaSocioRequest.builder().nombre("Ana").apellido("Pérez").dni("30111222")
                .email("Ana@Mail.com").telefono("1155550000").password("secreta1").idPlan(1).idSede(1L).build();
        Usuario socio = Usuario.builder().idUsuario(50L).nombre("Ana").apellido("Pérez").tipoUsuario(TipoUsuario.SOCIO).build();
        alta = new AltaRegistrada(socio, 9L, LocalDate.now().plusMonths(1), 3L, "0001-00000003", codigoReintento);
        lenient().when(planRepository.findById(1)).thenReturn(Optional.of(plan));
        lenient().when(sedeRepository.findById(1L)).thenReturn(Optional.of(Sede.builder().idSede(1L).build()));
    }

    private void pagoAprobadoYRegistrado() {
        when(pasarelaPago.cobrar(any(), anyString(), eq(false))).thenReturn(new RespuestaPasarela(true, "tok", "Aprobado"));
        when(registro.registrarSocio(eq(request), eq("30111222"), eq("ana@mail.com"), eq(plan), any(), any())).thenReturn(alta);
    }

    private void vinculacionExitosa() {
        when(registro.vincularCuenta(eq(50L), eq(authId))).thenAnswer(inv -> {
            Usuario u = Usuario.builder().idUsuario(50L).tipoUsuario(TipoUsuario.SOCIO).build();
            u.setAuthId(authId);
            return u;
        });
    }

    @Test
    @DisplayName("Pago rechazado: 422 y no se registra nada ni se llama a Supabase")
    void pagoRechazado_noCreaNada() {
        when(pasarelaPago.cobrar(any(), anyString(), anyBoolean())).thenReturn(new RespuestaPasarela(false, null, "Fondos insuficientes"));

        assertThatThrownBy(() -> service.darDeAlta(request))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("No se creó la cuenta");
        verify(registro, never()).registrarSocio(any(), any(), any(), any(), any(), any());
        verifyNoInteractions(supabaseAuthClient);
    }

    @Test
    @DisplayName("Pago aprobado: registra el alta, crea la cuenta en Supabase e inicia sesión")
    void pagoAprobado_creaTodoYDevuelveToken() {
        pagoAprobadoYRegistrado();
        vinculacionExitosa();
        when(supabaseAuthClient.crearUsuarioConfirmado(eq("ana@mail.com"), eq("secreta1"), anyMap())).thenReturn(authId);
        when(supabaseAuthClient.iniciarSesion("ana@mail.com", "secreta1"))
                .thenReturn(new SupabaseAuthClient.SesionSupabase("jwt", authId));

        AltaSocioResponse r = service.darDeAlta(request);

        assertThat(r.token()).isEqualTo("jwt");
        assertThat(r.cuentaPendiente()).isFalse();
        assertThat(r.usuario().getAuthId()).isEqualTo(authId);
        assertThat(r.numeroFactura()).isEqualTo("0001-00000003");
        assertThat(r.idMembresia()).isEqualTo(9L);
        assertThat(r.codigoReintento()).as("el código solo viaja si la cuenta quedó pendiente").isNull();
    }

    @Test
    @DisplayName("Cuenta creada pero sin poder iniciar sesión: devuelve la cuenta sin token")
    void cuentaCreadaSinToken() {
        pagoAprobadoYRegistrado();
        vinculacionExitosa();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenReturn(authId);
        when(supabaseAuthClient.iniciarSesion(any(), any())).thenThrow(new ServicioExternoException("caído"));

        AltaSocioResponse r = service.darDeAlta(request);

        assertThat(r.token()).isNull();
        assertThat(r.cuentaPendiente()).isFalse();
    }

    @Test
    @DisplayName("Una validación que falla (DNI o email de una cuenta, DNI dado de baja) corta antes de cobrar")
    void validacionFalla_noCobra() {
        doThrow(new RequiereInicioSesionException("Ya existe una cuenta con ese DNI")).when(registro)
                .validarDisponibles("30111222", "ana@mail.com");

        assertThatThrownBy(() -> service.darDeAlta(request)).isInstanceOf(RequiereInicioSesionException.class);
        verifyNoInteractions(pasarelaPago, supabaseAuthClient);
        verify(registro, never()).registrarSocio(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Si Supabase falla después del pago: cuenta pendiente, sin token y con el código para reintentar")
    void supabaseFalla_pagoNoSePierde() {
        pagoAprobadoYRegistrado();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenThrow(new ServicioExternoException("caído"));

        AltaSocioResponse r = service.darDeAlta(request);

        assertThat(r.cuentaPendiente()).isTrue();
        assertThat(r.token()).isNull();
        assertThat(r.numeroFactura()).isEqualTo("0001-00000003");
        assertThat(r.codigoReintento()).isEqualTo(codigoReintento);
        verify(registro, never()).vincularCuenta(any(), any());
    }

    @Test
    @DisplayName("Un error de base de datos al vincular también deja la cuenta pendiente y no un 500")
    void errorDeBaseAlVincular_quedaPendiente() {
        pagoAprobadoYRegistrado();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenReturn(authId);
        when(registro.vincularCuenta(eq(50L), eq(authId))).thenThrow(new DataIntegrityViolationException("duplicado"));

        AltaSocioResponse r = service.darDeAlta(request);

        assertThat(r.cuentaPendiente()).isTrue();
        assertThat(r.numeroFactura()).isEqualTo("0001-00000003");
        assertThat(r.codigoReintento()).isEqualTo(codigoReintento);
        assertThat(r.mensaje()).contains("error inesperado");
        verify(supabaseAuthClient).eliminarUsuario(authId);
    }

    @Test
    @DisplayName("Si no se puede vincular la cuenta en la BD, se elimina la cuenta creada en Supabase")
    void falloAlVincular_compensa() {
        pagoAprobadoYRegistrado();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenReturn(authId);
        when(registro.vincularCuenta(eq(50L), eq(authId))).thenThrow(new RecursoNoEncontradoException("Usuario", 50L));

        AltaSocioResponse r = service.darDeAlta(request);

        verify(supabaseAuthClient).eliminarUsuario(authId);
        assertThat(r.cuentaPendiente()).isTrue();
    }

    @Test
    @DisplayName("Si falla eliminar la cuenta creada, igual se devuelve la cuenta pendiente")
    void falloAlCompensar_sigueLaRespuesta() {
        pagoAprobadoYRegistrado();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenReturn(authId);
        when(registro.vincularCuenta(eq(50L), eq(authId))).thenThrow(new RecursoNoEncontradoException("Usuario", 50L));
        doThrow(new ServicioExternoException("caído")).when(supabaseAuthClient).eliminarUsuario(authId);

        assertThat(service.darDeAlta(request).cuentaPendiente()).isTrue();
    }

    @Test
    @DisplayName("Un error al registrar tras el cobro por una carrera de DNI se informa como 409")
    void carreraAlRegistrar_conflicto() {
        when(pasarelaPago.cobrar(any(), anyString(), eq(false))).thenReturn(new RespuestaPasarela(true, "tok", "Aprobado"));
        when(registro.registrarSocio(any(), any(), any(), any(), any(), any()))
                .thenThrow(new DataIntegrityViolationException("uk_dni"));

        assertThatThrownBy(() -> service.darDeAlta(request)).isInstanceOf(ConflictoException.class);
        verifyNoInteractions(supabaseAuthClient);
    }

    @Test
    @DisplayName("Si el email ya existe en Supabase con la misma contraseña, se reutiliza esa cuenta y no se elimina")
    void emailExistente_seReutilizaLaCuenta() {
        pagoAprobadoYRegistrado();
        vinculacionExitosa();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenThrow(new ConflictoException("email_exists"));
        when(supabaseAuthClient.iniciarSesion("ana@mail.com", "secreta1"))
                .thenReturn(new SupabaseAuthClient.SesionSupabase("jwt", authId));

        AltaSocioResponse r = service.darDeAlta(request);

        assertThat(r.cuentaPendiente()).isFalse();
        assertThat(r.token()).isEqualTo("jwt");
        verify(supabaseAuthClient, never()).eliminarUsuario(any());
    }

    @Test
    @DisplayName("Si el email ya existe en Supabase con otra contraseña: queda pendiente y explica cómo seguir")
    void emailExistente_otraPassword() {
        pagoAprobadoYRegistrado();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenThrow(new ConflictoException("email_exists"));
        when(supabaseAuthClient.iniciarSesion(any(), any())).thenThrow(new AccesoNoAutorizadoException("inválidas"));

        AltaSocioResponse r = service.darDeAlta(request);

        assertThat(r.cuentaPendiente()).isTrue();
        assertThat(r.mensaje()).contains("otra contraseña").contains("Olvidaste tu contraseña");
        verify(registro, never()).vincularCuenta(any(), any());
        verify(supabaseAuthClient, never()).eliminarUsuario(any());
    }

    @Test
    @DisplayName("Si vincular falla con una cuenta que ya existía, no se elimina esa cuenta")
    void cuentaExistenteNoSeElimina() {
        pagoAprobadoYRegistrado();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenThrow(new ConflictoException("email_exists"));
        when(supabaseAuthClient.iniciarSesion(any(), any())).thenReturn(new SupabaseAuthClient.SesionSupabase("jwt", authId));
        when(registro.vincularCuenta(eq(50L), eq(authId))).thenThrow(new ConflictoException("de otro usuario"));

        assertThat(service.darDeAlta(request).cuentaPendiente()).isTrue();
        verify(supabaseAuthClient, never()).eliminarUsuario(any());
    }

    @Test
    @DisplayName("Dos altas simultáneas con el mismo DNI: la segunda es 409 y no cobra de nuevo")
    void altaSimultanea_noCobraDosVeces() {
        AtomicReference<Throwable> segunda = new AtomicReference<>();
        when(pasarelaPago.cobrar(any(), anyString(), anyBoolean())).thenAnswer(inv -> {
            try {
                service.darDeAlta(request);
            } catch (Throwable t) {
                segunda.set(t);
            }
            return new RespuestaPasarela(false, null, "rechazado");
        });

        assertThatThrownBy(() -> service.darDeAlta(request)).isInstanceOf(ReglaNegocioException.class);

        assertThat(segunda.get()).isInstanceOf(ConflictoException.class).hasMessageContaining("alta en curso");
        verify(pasarelaPago).cobrar(any(), anyString(), anyBoolean());
    }

    @Test
    @DisplayName("Terminada un alta (con error o sin él), el DNI queda libre para otra")
    void altaTerminada_liberaElDni() {
        when(pasarelaPago.cobrar(any(), anyString(), anyBoolean())).thenReturn(new RespuestaPasarela(false, null, "rechazado"));

        assertThatThrownBy(() -> service.darDeAlta(request)).isInstanceOf(ReglaNegocioException.class);
        assertThatThrownBy(() -> service.darDeAlta(request)).isInstanceOf(ReglaNegocioException.class);
    }

    @Test
    @DisplayName("Reintentar con el código correcto crea la cuenta e inicia sesión")
    void reintentar_creaLaCuenta() {
        ReintentoCuentaRequest reintento = new ReintentoCuentaRequest("30111222", "Ana@Mail.com", "secreta1", codigoReintento);
        when(registro.validarReintento(reintento, "ana@mail.com")).thenReturn(alta);
        vinculacionExitosa();
        when(supabaseAuthClient.crearUsuarioConfirmado(eq("ana@mail.com"), eq("secreta1"), anyMap())).thenReturn(authId);
        when(supabaseAuthClient.iniciarSesion("ana@mail.com", "secreta1"))
                .thenReturn(new SupabaseAuthClient.SesionSupabase("jwt", authId));

        AltaSocioResponse r = service.reintentarCuenta(reintento);

        assertThat(r.token()).isEqualTo("jwt");
        assertThat(r.cuentaPendiente()).isFalse();
    }

    @Test
    @DisplayName("Reintentar cuando la cuenta ya está en Supabase la vincula iniciando sesión")
    void reintentar_conCuentaYaEnSupabase() {
        ReintentoCuentaRequest reintento = new ReintentoCuentaRequest("30111222", "ana@mail.com", "secreta1", codigoReintento);
        when(registro.validarReintento(reintento, "ana@mail.com")).thenReturn(alta);
        vinculacionExitosa();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenThrow(new ConflictoException("email_exists"));
        when(supabaseAuthClient.iniciarSesion("ana@mail.com", "secreta1"))
                .thenReturn(new SupabaseAuthClient.SesionSupabase("jwt", authId));

        AltaSocioResponse r = service.reintentarCuenta(reintento);

        assertThat(r.token()).isEqualTo("jwt");
        verify(supabaseAuthClient, never()).eliminarUsuario(any());
    }

    @Test
    @DisplayName("Reintentar con datos que no coinciden con el alta: 403 y no se llama a Supabase")
    void reintentar_datosNoCoinciden() {
        ReintentoCuentaRequest reintento = new ReintentoCuentaRequest("30111222", "ana@mail.com", "secreta1", codigoReintento);
        when(registro.validarReintento(reintento, "ana@mail.com")).thenThrow(new AccesoDenegadoException("no coinciden"));

        assertThatThrownBy(() -> service.reintentarCuenta(reintento)).isInstanceOf(AccesoDenegadoException.class);
        verifyNoInteractions(supabaseAuthClient);
    }
}
