package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
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
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import com.fitzone.modulo.usuarios.service.AltaSocioRegistro.AltaRegistrada;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AltaSocioServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PlanRepository planRepository;
    @Mock private SedeRepository sedeRepository;
    @Mock private PasarelaPago pasarelaPago;
    @Mock private SupabaseAuthClient supabaseAuthClient;
    @Mock private AltaSocioRegistro registro;

    private AltaSocioService service;
    private AltaSocioRequest request;
    private AltaRegistrada alta;
    private final UUID authId = UUID.randomUUID();
    private final Plan plan = Plan.builder().idPlan(1).nombre("Plan Mensual")
            .precioBase(new BigDecimal("15000")).duracionMeses(1).build();

    @BeforeEach
    void setUp() {
        service = new AltaSocioService(usuarioRepository, planRepository, sedeRepository, pasarelaPago,
                supabaseAuthClient, registro);
        request = AltaSocioRequest.builder().nombre("Ana").apellido("Pérez").dni("30111222")
                .email("Ana@Mail.com").telefono("1155550000").password("secreta1").idPlan(1).idSede(1L).build();
        Usuario socio = Usuario.builder().idUsuario(50L).nombre("Ana").apellido("Pérez").tipoUsuario(TipoUsuario.SOCIO).build();
        alta = new AltaRegistrada(socio, 9L, LocalDate.now().plusMonths(1), 3L, "0001-00000003");
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
        verifyNoInteractions(registro, supabaseAuthClient);
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
    @DisplayName("DNI de una cuenta: REQUIERE_INICIO_SESION antes de cobrar")
    void dniDeCuenta_noCobra() {
        when(usuarioRepository.findByDni("30111222"))
                .thenReturn(Optional.of(Usuario.builder().tipoUsuario(TipoUsuario.SOCIO).build()));

        assertThatThrownBy(() -> service.darDeAlta(request)).isInstanceOf(RequiereInicioSesionException.class);
        verifyNoInteractions(pasarelaPago, registro);
    }

    @Test
    @DisplayName("DNI de un usuario dado de baja: 409 antes de cobrar, para no cobrar y fallar después")
    void dniDadoDeBaja_noCobra() {
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByDniIncluidosBajas("30111222")).thenReturn(true);

        assertThatThrownBy(() -> service.darDeAlta(request))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("dado de baja");
        verifyNoInteractions(pasarelaPago, registro);
    }

    @Test
    @DisplayName("El DNI de un invitado previo (EXTERNO) no bloquea el alta")
    void dniDeInvitado_noBloquea() {
        when(usuarioRepository.findByDni("30111222"))
                .thenReturn(Optional.of(Usuario.builder().tipoUsuario(TipoUsuario.EXTERNO).build()));
        pagoAprobadoYRegistrado();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenThrow(new ServicioExternoException("caído"));

        service.darDeAlta(request);

        verify(registro).registrarSocio(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Email de una cuenta: REQUIERE_INICIO_SESION antes de cobrar")
    void emailDeCuenta_noCobra() {
        when(usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot("ana@mail.com", TipoUsuario.EXTERNO)).thenReturn(true);

        assertThatThrownBy(() -> service.darDeAlta(request)).isInstanceOf(RequiereInicioSesionException.class);
        verifyNoInteractions(pasarelaPago, registro);
    }

    @Test
    @DisplayName("Si Supabase falla después del pago: cuenta pendiente, sin token y con el comprobante para reintentar")
    void supabaseFalla_pagoNoSePierde() {
        pagoAprobadoYRegistrado();
        when(supabaseAuthClient.crearUsuarioConfirmado(any(), any(), anyMap())).thenThrow(new ServicioExternoException("caído"));

        AltaSocioResponse r = service.darDeAlta(request);

        assertThat(r.cuentaPendiente()).isTrue();
        assertThat(r.token()).isNull();
        assertThat(r.numeroFactura()).isEqualTo("0001-00000003");
        verify(registro, never()).vincularCuenta(any(), any());
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
    @DisplayName("Reintentar con el comprobante correcto crea la cuenta e inicia sesión")
    void reintentar_creaLaCuenta() {
        ReintentoCuentaRequest reintento = new ReintentoCuentaRequest("30111222", "Ana@Mail.com", "secreta1", "0001-00000003");
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
    @DisplayName("Reintentar con datos que no coinciden con el comprobante: 403 y no se llama a Supabase")
    void reintentar_datosNoCoinciden() {
        ReintentoCuentaRequest reintento = new ReintentoCuentaRequest("30111222", "ana@mail.com", "secreta1", "0001-00000003");
        when(registro.validarReintento(reintento, "ana@mail.com")).thenThrow(new AccesoDenegadoException("no coinciden"));

        assertThatThrownBy(() -> service.reintentarCuenta(reintento)).isInstanceOf(AccesoDenegadoException.class);
        verifyNoInteractions(supabaseAuthClient);
    }
}
