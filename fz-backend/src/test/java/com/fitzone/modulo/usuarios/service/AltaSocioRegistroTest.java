package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.pasarela.RespuestaPasarela;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AltaSocioRegistroTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private MembresiaService membresiaService;
    @Mock private PagoService pagoService;
    @Mock private ComprobanteRepository comprobanteRepository;

    @InjectMocks
    private AltaSocioRegistro registro;

    private AltaSocioRequest request;
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
    @DisplayName("Un DNI nuevo crea un SOCIO sin cuenta, con membresía, cobro y comprobante")
    void registrarSocio_nuevo() {
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.empty());
        membresiaPagadaConComprobante();

        AltaRegistrada alta = registro.registrarSocio(request, "30111222", "ana@mail.com", plan, sede, aprobada);

        assertThat(alta.socio().getTipoUsuario()).isEqualTo(TipoUsuario.SOCIO);
        assertThat(alta.socio().getAuthId()).isNull();
        assertThat(alta.socio().getNombre()).isEqualTo("Ana");
        assertThat(alta.socio().getEmail()).isEqualTo("ana@mail.com");
        assertThat(alta.idMembresia()).isEqualTo(9L);
        assertThat(alta.numeroFactura()).isEqualTo("0001-00000003");
    }

    @Test
    @DisplayName("Un invitado previo (EXTERNO) con ese DNI se reutiliza y pasa a SOCIO")
    void registrarSocio_reutilizaInvitado() {
        Usuario invitado = Usuario.builder().idUsuario(7L).dni("30111222").tipoUsuario(TipoUsuario.EXTERNO).build();
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.of(invitado));
        membresiaPagadaConComprobante();

        registro.registrarSocio(request, "30111222", "ana@mail.com", plan, sede, aprobada);

        verify(usuarioRepository).saveAndFlush(invitado);
        assertThat(invitado.getTipoUsuario()).isEqualTo(TipoUsuario.SOCIO);
        assertThat(invitado.getIdUsuario()).isEqualTo(50L);
    }

    @Test
    @DisplayName("vincularCuenta guarda el authId en el socio")
    void vincularCuenta() {
        UUID authId = UUID.randomUUID();
        Usuario socio = Usuario.builder().idUsuario(50L).tipoUsuario(TipoUsuario.SOCIO).build();
        when(usuarioRepository.findById(50L)).thenReturn(Optional.of(socio));
        when(usuarioRepository.save(socio)).thenReturn(socio);

        Usuario vinculado = registro.vincularCuenta(50L, authId);

        assertThat(vinculado.getAuthId()).isEqualTo(authId);
    }

    @Test
    @DisplayName("vincularCuenta de un usuario inexistente lanza RecursoNoEncontradoException")
    void vincularCuenta_inexistente() {
        when(usuarioRepository.findById(50L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registro.vincularCuenta(50L, UUID.randomUUID()))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("Reintento con el comprobante, el DNI y el email correctos devuelve el alta")
    void validarReintento_ok() {
        comprobanteDeSocio("30111222", "ana@mail.com", null);

        AltaRegistrada alta = registro.validarReintento(reintento("30111222"), "ana@mail.com");

        assertThat(alta.socio().getIdUsuario()).isEqualTo(50L);
        assertThat(alta.numeroFactura()).isEqualTo("0001-00000003");
    }

    @Test
    @DisplayName("Reintento con un DNI que no coincide con el comprobante: 403")
    void validarReintento_datosNoCoinciden() {
        comprobanteDeSocio("99999999", "ana@mail.com", null);

        assertThatThrownBy(() -> registro.validarReintento(reintento("30111222"), "ana@mail.com"))
                .isInstanceOf(AccesoDenegadoException.class);
    }

    @Test
    @DisplayName("Reintento con la cuenta ya creada: 409")
    void validarReintento_cuentaYaCreada() {
        comprobanteDeSocio("30111222", "ana@mail.com", UUID.randomUUID());

        assertThatThrownBy(() -> registro.validarReintento(reintento("30111222"), "ana@mail.com"))
                .isInstanceOf(ConflictoException.class);
    }

    @Test
    @DisplayName("Reintento con un comprobante inexistente: 404")
    void validarReintento_comprobanteInexistente() {
        when(comprobanteRepository.findByNumeroFactura("0001-00000003")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registro.validarReintento(reintento("30111222"), "ana@mail.com"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    private ReintentoCuentaRequest reintento(String dni) {
        return new ReintentoCuentaRequest(dni, "ana@mail.com", "secreta1", "0001-00000003");
    }

    private void comprobanteDeSocio(String dni, String email, UUID authId) {
        Usuario socio = Usuario.builder().idUsuario(50L).dni(dni).email(email)
                .tipoUsuario(TipoUsuario.SOCIO).authId(authId).build();
        Membresia membresia = Membresia.builder().idMembresia(9L).fechaVencimiento(LocalDate.now().plusMonths(1)).build();
        Transaccion transaccion = Transaccion.builder().usuario(socio).membresia(membresia).build();
        when(comprobanteRepository.findByNumeroFactura("0001-00000003")).thenReturn(Optional.of(
                Comprobante.builder().idComprobante(3L).numeroFactura("0001-00000003").transaccion(transaccion).build()));
    }
}
