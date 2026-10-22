package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.canchas.repository.ReservaCanchaRepository;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.pagos.models.PagoRequest;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.pasarela.PasarelaPago;
import com.fitzone.modulo.pagos.pasarela.RespuestaPasarela;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import com.fitzone.modulo.usuarios.service.MembresiaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PagoServiceTest {

    @Mock
    private TransaccionRepository transaccionRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private ReservaCanchaRepository reservaCanchaRepository;

    @Mock
    private MembresiaService membresiaService;

    @Mock
    private PasarelaPago pasarelaPago;

    @Mock
    private ComprobanteService comprobanteService;

    @InjectMocks
    private PagoService pagoService;

    private Usuario usuario;
    private Sede sede;
    private Plan plan;
    private Membresia membresia;
    private ReservaCancha reservaCancha;

    @BeforeEach
    void setUp() {
        usuario = Usuario.builder().idUsuario(1L).nombre("Carlos").apellido("Pérez").build();
        sede = Sede.builder().idSede(10L).nombre("Sede Central").build();
        plan = Plan.builder().idPlan(2).nombre("Plan Full").precioBase(new BigDecimal("30000.00")).duracionMeses(1).build();
        membresia = Membresia.builder().idMembresia(20L).usuario(usuario).plan(plan).build();
        reservaCancha = ReservaCancha.builder().idReservaCancha(30L).usuario(usuario).precioFinal(new BigDecimal("12000.00")).build();
    }

    @Test
    @DisplayName("procesarPago con RESERVA_CANCHA aprobado guarda transacción CONFIRMADO")
    void procesarPago_reservaCancha_aprobado() {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.RESERVA_CANCHA)
                .idReservaCancha(30L)
                .build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(sedeRepository.findById(10L)).thenReturn(Optional.of(sede));
        when(reservaCanchaRepository.findById(30L)).thenReturn(Optional.of(reservaCancha));
        when(transaccionRepository.existsByReservaCancha_IdReservaCanchaAndEstadoPago(30L, EstadoPago.CONFIRMADO))
                .thenReturn(false);
        when(pasarelaPago.cobrar(eq(new BigDecimal("12000.00")), anyString(), eq(false)))
                .thenReturn(new RespuestaPasarela(true, "tok_aprobado_123", "Pago aprobado"));
        when(transaccionRepository.save(any(Transaccion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaccion resultado = pagoService.procesarPago(request);

        assertThat(resultado.getEstadoPago()).isEqualTo(EstadoPago.CONFIRMADO);
        assertThat(resultado.getMonto()).isEqualByComparingTo("12000.00");
        assertThat(resultado.getTokenTransaccionPasarela()).isEqualTo("tok_aprobado_123");
        assertThat(resultado.getFechaHoraConfirmacion()).isNotNull();
        verify(membresiaService, never()).renovar(any());
        verify(transaccionRepository).save(any(Transaccion.class));
        verify(comprobanteService).generarComprobante(any(Transaccion.class));
    }

    @Test
    @DisplayName("procesarPago con forzarRechazo=true guarda transacción RECHAZADO")
    void procesarPago_reservaCancha_rechazado() {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.RESERVA_CANCHA)
                .idReservaCancha(30L)
                .forzarRechazo(true)
                .build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(sedeRepository.findById(10L)).thenReturn(Optional.of(sede));
        when(reservaCanchaRepository.findById(30L)).thenReturn(Optional.of(reservaCancha));
        when(transaccionRepository.existsByReservaCancha_IdReservaCanchaAndEstadoPago(30L, EstadoPago.CONFIRMADO))
                .thenReturn(false);
        when(pasarelaPago.cobrar(eq(new BigDecimal("12000.00")), anyString(), eq(true)))
                .thenReturn(new RespuestaPasarela(false, "tok_rechazo_999", "Pago rechazado"));
        when(transaccionRepository.save(any(Transaccion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaccion resultado = pagoService.procesarPago(request);

        assertThat(resultado.getEstadoPago()).isEqualTo(EstadoPago.RECHAZADO);
        assertThat(resultado.getTokenTransaccionPasarela()).isEqualTo("tok_rechazo_999");
        assertThat(resultado.getFechaHoraConfirmacion()).isNull();
        verify(transaccionRepository).save(any(Transaccion.class));
        verify(comprobanteService, never()).generarComprobante(any());
    }

    @Test
    @DisplayName("procesarPago para reserva de cancha ya pagada lanza ConflictoException (409)")
    void procesarPago_reservaCancha_duplicada_lanzaConflicto() {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.RESERVA_CANCHA)
                .idReservaCancha(30L)
                .build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(sedeRepository.findById(10L)).thenReturn(Optional.of(sede));
        when(reservaCanchaRepository.findById(30L)).thenReturn(Optional.of(reservaCancha));
        when(transaccionRepository.existsByReservaCancha_IdReservaCanchaAndEstadoPago(30L, EstadoPago.CONFIRMADO))
                .thenReturn(true);

        assertThatThrownBy(() -> pagoService.procesarPago(request))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya fue pagada con éxito");

        verify(pasarelaPago, never()).cobrar(any(), any(), anyBoolean());
        verify(transaccionRepository, never()).save(any());
    }

    @Test
    @DisplayName("procesarPago con MEMBRESIA aprobado renueva automáticamente la membresía")
    void procesarPago_membresia_aprobado_renueva() {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .idMembresia(20L)
                .build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(sedeRepository.findById(10L)).thenReturn(Optional.of(sede));
        when(membresiaRepository.findById(20L)).thenReturn(Optional.of(membresia));
        when(pasarelaPago.cobrar(eq(new BigDecimal("30000.00")), anyString(), eq(false)))
                .thenReturn(new RespuestaPasarela(true, "tok_membresia_ok", "Pago aprobado"));
        when(transaccionRepository.save(any(Transaccion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Transaccion resultado = pagoService.procesarPago(request);

        assertThat(resultado.getEstadoPago()).isEqualTo(EstadoPago.CONFIRMADO);
        assertThat(resultado.getMonto()).isEqualByComparingTo("30000.00");
        verify(membresiaService).renovar(20L);
        verify(transaccionRepository).save(any(Transaccion.class));
        verify(comprobanteService).generarComprobante(any(Transaccion.class));
    }

    @Test
    @DisplayName("procesarPago con MEMBRESIA pero omitiendo idMembresia lanza PeticionInvalidaException (400)")
    void procesarPago_membresiaSinIdMembresia_lanzaPeticionInvalida() {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .idMembresia(null)
                .build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(sedeRepository.findById(10L)).thenReturn(Optional.of(sede));

        assertThatThrownBy(() -> pagoService.procesarPago(request))
                .isInstanceOf(PeticionInvalidaException.class)
                .hasMessageContaining("debe especificar idMembresia");

        verify(pasarelaPago, never()).cobrar(any(), any(), anyBoolean());
    }

    @Test
    @DisplayName("procesarPago con MEMBRESIA e idReservaCancha presente lanza PeticionInvalidaException (400)")
    void procesarPago_membresiaConIdReserva_lanzaPeticionInvalida() {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .idMembresia(20L)
                .idReservaCancha(30L)
                .build();

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(sedeRepository.findById(10L)).thenReturn(Optional.of(sede));

        assertThatThrownBy(() -> pagoService.procesarPago(request))
                .isInstanceOf(PeticionInvalidaException.class)
                .hasMessageContaining("omitir idReservaCancha");

        verify(pasarelaPago, never()).cobrar(any(), any(), anyBoolean());
    }

    @Test
    @DisplayName("procesarPago con usuario inexistente lanza RecursoNoEncontradoException (404)")
    void procesarPago_usuarioInexistente_lanzaRecursoNoEncontrado() {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(999L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .idMembresia(20L)
                .build();

        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pagoService.procesarPago(request))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("obtenerPorId retorna transacción cuando existe")
    void obtenerPorId_existente() {
        Transaccion t = Transaccion.builder().idTransaccion(50L).build();
        when(transaccionRepository.findById(50L)).thenReturn(Optional.of(t));

        Transaccion resultado = pagoService.obtenerPorId(50L);

        assertThat(resultado.getIdTransaccion()).isEqualTo(50L);
    }

    @Test
    @DisplayName("obtenerPorId inexistente lanza RecursoNoEncontradoException (404)")
    void obtenerPorId_inexistente() {
        when(transaccionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pagoService.obtenerPorId(999L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("listarPorUsuario retorna historial de pagos si usuario existe")
    void listarPorUsuario_usuarioExiste() {
        Transaccion t = Transaccion.builder().idTransaccion(50L).usuario(usuario).build();
        when(usuarioRepository.existsById(1L)).thenReturn(true);
        when(transaccionRepository.findByUsuario_IdUsuarioOrderByFechaHoraCreacionDesc(1L))
                .thenReturn(List.of(t));

        List<Transaccion> resultado = pagoService.listarPorUsuario(1L);

        assertThat(resultado).hasSize(1);
        assertThat(resultado.get(0).getIdTransaccion()).isEqualTo(50L);
    }

    @Test
    @DisplayName("listarPorUsuario con usuario inexistente lanza RecursoNoEncontradoException (404)")
    void listarPorUsuario_usuarioNoExiste() {
        when(usuarioRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> pagoService.listarPorUsuario(999L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }
}
