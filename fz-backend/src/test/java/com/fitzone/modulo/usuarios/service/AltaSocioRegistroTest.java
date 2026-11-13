package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.RequiereInicioSesionException;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.pasarela.RespuestaPasarela;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.pagos.service.PagoService;
import com.fitzone.modulo.usuarios.models.AltaSocioRequest;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.ReintentoCuentaRequest;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import com.fitzone.modulo.usuarios.service.AltaSocioRegistro.AltaRegistrada;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AltaSocioRegistroTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private MembresiaService membresiaService;
    @Mock private PagoService pagoService;
    @Mock private ComprobanteRepository comprobanteRepository;
    @Mock private TransaccionRepository transaccionRepository;

    @InjectMocks
    private AltaSocioRegistro registro;

    private AltaSocioRequest request;
    private final UUID codigo = UUID.randomUUID();
    private final Plan plan = Plan.builder().idPlan(1).nombre("Plan Mensual")
            .precioBase(new BigDecimal("15000")).duracionMeses(1).build();
    private final Sede sede = Sede.builder().idSede(1L).build();
    private final RespuestaPasarela aprobada = new RespuestaPasarela(true, "tok", "Aprobado");

    @BeforeEach
    void setUp() {
        request = AltaSocioRequest.builder().nombre(" Ana ").apellido("Pérez").dni("30111222")
                .email("Ana@Mail.com").telefono("1155550000").password("secreta1").idPlan(1).idSede(1L).build();
    }

    private void membresiaPagadaConComprobante() {
        when(usuarioRepository.saveAndFlush(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setIdUsuario(50L);
            return u;
        });
        when(membresiaService.crear(any())).thenReturn(Membresia.builder().idMembresia(9L)
                .fechaVencimiento(LocalDate.now().plusMonths(1)).build());
        when(pagoService.registrarCobro(any(), eq(sede), any(), isNull(), eq(TipoOrigenTransaccion.MEMBRESIA),
                eq(plan.getPrecioBase()), eq(aprobada))).thenReturn(Transaccion.builder().idTransaccion(70L).build());
        when(comprobanteRepository.findByTransaccion_IdTransaccion(70L)).thenReturn(Optional.of(
                Comprobante.builder().idComprobante(3L).numeroFactura("0001-00000003").build()));
    }

    @Test
    @DisplayName("Un DNI nuevo crea un SOCIO sin cuenta, con membresía, cobro, comprobante y código de reintento")
    void registrarSocio_nuevo() {
        when(usuarioRepository.findByDniForUpdate("30111222")).thenReturn(Optional.empty());
        membresiaPagadaConComprobante();

        AltaRegistrada alta = registro.registrarSocio(request, "30111222", "ana@mail.com", plan, sede, aprobada);

        assertThat(alta.socio().getTipoUsuario()).isEqualTo(TipoUsuario.SOCIO);
        assertThat(alta.socio().getAuthId()).isNull();
        assertThat(alta.socio().getNombre()).isEqualTo("Ana");
        assertThat(alta.socio().getEmail()).isEqualTo("ana@mail.com");
        assertThat(alta.idMembresia()).isEqualTo(9L);
        assertThat(alta.numeroFactura()).isEqualTo("0001-00000003");
        assertThat(alta.codigoReintento()).isNotNull();
        verify(transaccionRepository).save(any(Transaccion.class));
    }

    @Test
    @DisplayName("Un invitado previo (EXTERNO) con ese DNI se reutiliza y pasa a SOCIO")
    void registrarSocio_reutilizaInvitado() {
        Usuario invitado = Usuario.builder().idUsuario(7L).dni("30111222").tipoUsuario(TipoUsuario.EXTERNO).build();
        when(usuarioRepository.findByDniForUpdate("30111222")).thenReturn(Optional.of(invitado));
        membresiaPagadaConComprobante();

        registro.registrarSocio(request, "30111222", "ana@mail.com", plan, sede, aprobada);

        verify(usuarioRepository).saveAndFlush(invitado);
        assertThat(invitado.getTipoUsuario()).isEqualTo(TipoUsuario.SOCIO);
        assertThat(invitado.getIdUsuario()).isEqualTo(50L);
    }

    @Test
    @DisplayName("Con el DNI bloqueado, si otra alta ya lo convirtió en socio no se registra nada ni se pisa su cuenta")
    void registrarSocio_otroAltaGanoLaCarrera() {
        Usuario yaSocio = Usuario.builder().idUsuario(50L).dni("30111222").tipoUsuario(TipoUsuario.SOCIO)
                .authId(UUID.randomUUID()).build();
        when(usuarioRepository.findByDniForUpdate("30111222")).thenReturn(Optional.of(yaSocio));

        assertThatThrownBy(() -> registro.registrarSocio(request, "30111222", "ana@mail.com", plan, sede, aprobada))
                .isInstanceOf(RequiereInicioSesionException.class);
        verifyNoInteractions(membresiaService, pagoService);
        verify(usuarioRepository, never()).saveAndFlush(any());
        assertThat(yaSocio.getAuthId()).isNotNull();
    }

    @Test
    @DisplayName("Un invitado reutilizado conserva su authId si lo tuviera")
    void registrarSocio_noToca_authIdExistente() {
        UUID authId = UUID.randomUUID();
        Usuario invitado = Usuario.builder().idUsuario(7L).dni("30111222").tipoUsuario(TipoUsuario.EXTERNO).authId(authId).build();
        when(usuarioRepository.findByDniForUpdate("30111222")).thenReturn(Optional.of(invitado));
        membresiaPagadaConComprobante();

        registro.registrarSocio(request, "30111222", "ana@mail.com", plan, sede, aprobada);

        assertThat(invitado.getAuthId()).isEqualTo(authId);
    }

    @Test
    @DisplayName("Un DNI dado de baja se rechaza al registrar")
    void registrarSocio_dadoDeBaja() {
        when(usuarioRepository.findByDniForUpdate("30111222")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByDniIncluidosBajas("30111222")).thenReturn(true);

        assertThatThrownBy(() -> registro.registrarSocio(request, "30111222", "ana@mail.com", plan, sede, aprobada))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("dado de baja");
    }

    @Test
    @DisplayName("Validación previa: el DNI de una cuenta pide iniciar sesión")
    void validarDisponibles_dniDeCuenta() {
        when(usuarioRepository.findByDni("30111222"))
                .thenReturn(Optional.of(Usuario.builder().tipoUsuario(TipoUsuario.SOCIO).build()));

        assertThatThrownBy(() -> registro.validarDisponibles("30111222", "ana@mail.com"))
                .isInstanceOf(RequiereInicioSesionException.class);
    }

    @Test
    @DisplayName("Validación previa: el DNI de un usuario dado de baja es 409")
    void validarDisponibles_dadoDeBaja() {
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByDniIncluidosBajas("30111222")).thenReturn(true);

        assertThatThrownBy(() -> registro.validarDisponibles("30111222", "ana@mail.com"))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("dado de baja");
    }

    @Test
    @DisplayName("Validación previa: el email de una cuenta pide iniciar sesión")
    void validarDisponibles_emailDeCuenta() {
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot("ana@mail.com", TipoUsuario.EXTERNO)).thenReturn(true);

        assertThatThrownBy(() -> registro.validarDisponibles("30111222", "ana@mail.com"))
                .isInstanceOf(RequiereInicioSesionException.class);
    }

    @Test
    @DisplayName("Validación previa: el DNI de un invitado previo (EXTERNO) no bloquea")
    void validarDisponibles_invitadoNoBloquea() {
        when(usuarioRepository.findByDni("30111222"))
                .thenReturn(Optional.of(Usuario.builder().tipoUsuario(TipoUsuario.EXTERNO).build()));

        registro.validarDisponibles("30111222", "ana@mail.com");
    }

    @Test
    @DisplayName("vincularCuenta guarda el authId en el socio")
    void vincularCuenta() {
        UUID authId = UUID.randomUUID();
        Usuario socio = Usuario.builder().idUsuario(50L).tipoUsuario(TipoUsuario.SOCIO).build();
        when(usuarioRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(socio));
        when(usuarioRepository.findByAuthId(authId)).thenReturn(Optional.empty());
        when(usuarioRepository.save(socio)).thenReturn(socio);

        Usuario vinculado = registro.vincularCuenta(50L, authId);

        assertThat(vinculado.getAuthId()).isEqualTo(authId);
    }

    @Test
    @DisplayName("vincularCuenta con el mismo authId ya guardado no cambia nada")
    void vincularCuenta_idempotente() {
        UUID authId = UUID.randomUUID();
        Usuario socio = Usuario.builder().idUsuario(50L).authId(authId).build();
        when(usuarioRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(socio));

        assertThat(registro.vincularCuenta(50L, authId).getAuthId()).isEqualTo(authId);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("vincularCuenta no pisa un authId distinto ya guardado")
    void vincularCuenta_noPisaOtroAuthId() {
        Usuario socio = Usuario.builder().idUsuario(50L).authId(UUID.randomUUID()).build();
        when(usuarioRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(socio));

        assertThatThrownBy(() -> registro.vincularCuenta(50L, UUID.randomUUID())).isInstanceOf(ConflictoException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("vincularCuenta rechaza un authId que ya pertenece a otro usuario")
    void vincularCuenta_authIdDeOtro() {
        UUID authId = UUID.randomUUID();
        Usuario socio = Usuario.builder().idUsuario(50L).build();
        when(usuarioRepository.findByIdForUpdate(50L)).thenReturn(Optional.of(socio));
        when(usuarioRepository.findByAuthId(authId)).thenReturn(Optional.of(Usuario.builder().idUsuario(99L).build()));

        assertThatThrownBy(() -> registro.vincularCuenta(50L, authId)).isInstanceOf(ConflictoException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("vincularCuenta de un usuario inexistente lanza RecursoNoEncontradoException")
    void vincularCuenta_inexistente() {
        when(usuarioRepository.findByIdForUpdate(50L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registro.vincularCuenta(50L, UUID.randomUUID()))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("Reintento con el código, el DNI y el email correctos devuelve el alta")
    void validarReintento_ok() {
        transaccionDeSocio("30111222", "ana@mail.com", null);

        AltaRegistrada alta = registro.validarReintento(reintento("30111222"), "ana@mail.com");

        assertThat(alta.socio().getIdUsuario()).isEqualTo(50L);
        assertThat(alta.numeroFactura()).isEqualTo("0001-00000003");
        assertThat(alta.codigoReintento()).isEqualTo(codigo);
    }

    @Test
    @DisplayName("Reintento con un DNI que no coincide con el alta: 403")
    void validarReintento_datosNoCoinciden() {
        transaccionDeSocio("99999999", "ana@mail.com", null);

        assertThatThrownBy(() -> registro.validarReintento(reintento("30111222"), "ana@mail.com"))
                .isInstanceOf(AccesoDenegadoException.class);
    }

    @Test
    @DisplayName("Reintento con la cuenta ya creada: 409")
    void validarReintento_cuentaYaCreada() {
        transaccionDeSocio("30111222", "ana@mail.com", UUID.randomUUID());

        assertThatThrownBy(() -> registro.validarReintento(reintento("30111222"), "ana@mail.com"))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    @DisplayName("Reintento con un código que no existe: 404")
    void validarReintento_codigoInexistente() {
        when(transaccionRepository.findByCodigoReintento(codigo)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registro.validarReintento(reintento("30111222"), "ana@mail.com"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("Reintento con el código de un pago que no es una membresía: 403")
    void validarReintento_noEsMembresia() {
        Usuario socio = Usuario.builder().idUsuario(50L).dni("30111222").email("ana@mail.com").tipoUsuario(TipoUsuario.SOCIO).build();
        Transaccion transaccion = Transaccion.builder().usuario(socio).concepto(TipoOrigenTransaccion.RESERVA_CANCHA)
                .codigoReintento(codigo).build();
        when(transaccionRepository.findByCodigoReintento(codigo)).thenReturn(Optional.of(transaccion));

        assertThatThrownBy(() -> registro.validarReintento(reintento("30111222"), "ana@mail.com"))
                .isInstanceOf(AccesoDenegadoException.class);
    }

    private ReintentoCuentaRequest reintento(String dni) {
        return new ReintentoCuentaRequest(dni, "ana@mail.com", "secreta1", codigo);
    }

    private void transaccionDeSocio(String dni, String email, UUID authId) {
        Usuario socio = Usuario.builder().idUsuario(50L).dni(dni).email(email)
                .tipoUsuario(TipoUsuario.SOCIO).authId(authId).build();
        Membresia membresia = Membresia.builder().idMembresia(9L).fechaVencimiento(LocalDate.now().plusMonths(1)).build();
        Transaccion transaccion = Transaccion.builder().idTransaccion(70L).usuario(socio).membresia(membresia)
                .concepto(TipoOrigenTransaccion.MEMBRESIA).codigoReintento(codigo).build();
        when(transaccionRepository.findByCodigoReintento(codigo)).thenReturn(Optional.of(transaccion));
        lenient().when(comprobanteRepository.findByTransaccion_IdTransaccion(70L)).thenReturn(Optional.of(
                Comprobante.builder().idComprobante(3L).numeroFactura("0001-00000003").transaccion(transaccion).build()));
    }
}
