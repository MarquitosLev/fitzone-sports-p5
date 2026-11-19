package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.exception.RequiereInicioSesionException;
import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.canchas.repository.ReservaCanchaRepository;
import com.fitzone.modulo.canchas.service.CanchaService;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.models.ReservaInvitadoRequest;
import com.fitzone.modulo.pagos.models.ReservaInvitadoResponse;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
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
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CheckoutInvitadoServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ReservaCanchaRepository reservaCanchaRepository;
    @Mock private TransaccionRepository transaccionRepository;
    @Mock private ComprobanteRepository comprobanteRepository;
    @Mock private CanchaService canchaService;
    @Mock private PagoService pagoService;
    @Mock private ComprobanteService comprobanteService;

    @InjectMocks
    private CheckoutInvitadoService service;

    private ReservaInvitadoRequest request;
    private Cancha cancha;

    @BeforeEach
    void setUp() {
        LocalDateTime inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        request = ReservaInvitadoRequest.builder()
                .idCancha(1L).fechaHoraInicio(inicio).fechaHoraFin(inicio.plusHours(1))
                .nombre("Ana").apellido("Pérez").dni("30111222").email("Ana@Mail.com")
                .build();
        cancha = Cancha.builder().idCancha(1L).nombre("Pádel 1").tipo("PADEL")
                .sede(Sede.builder().idSede(1L).nombre("Palermo").build()).build();
    }

    private ReservaCancha reservaDe(Usuario usuario) {
        return ReservaCancha.builder().idReservaCancha(10L).codigoReserva(UUID.randomUUID())
                .cancha(cancha).usuario(usuario)
                .fechaHoraInicio(request.getFechaHoraInicio()).fechaHoraFin(request.getFechaHoraFin())
                .precioFinal(new BigDecimal("10000.00")).build();
    }

    private CotizacionDTO cotizacion(String total) {
        return CotizacionDTO.builder().precioBase(new BigDecimal(total)).descuento(BigDecimal.ZERO)
                .recargo(BigDecimal.ZERO).precioFinal(new BigDecimal(total)).build();
    }

    private void sinCuenta() {
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot("ana@mail.com", TipoUsuario.EXTERNO)).thenReturn(false);
    }

    @Test
    @DisplayName("Pago aprobado: reserva sin usuario, no guarda al cliente como usuario y sus datos quedan en el comprobante")
    void reservarYPagar_aprobado() {
        sinCuenta();
        ReservaCancha reserva = reservaDe(null);
        when(canchaService.reservarComoInvitado(eq(1L), any(ReservaCancha.class))).thenReturn(reserva);
        Transaccion pago = Transaccion.builder().idTransaccion(99L).estadoPago(EstadoPago.CONFIRMADO).build();
        when(pagoService.procesarPagoInvitado(reserva, false)).thenReturn(pago);
        Comprobante comprobante = Comprobante.builder().idComprobante(5L).numeroFactura("FZ-1").build();
        when(comprobanteRepository.findByTransaccion_IdTransaccion(99L)).thenReturn(Optional.of(comprobante));
        when(canchaService.cotizarPara(eq(1L), any(), any(), any())).thenReturn(cotizacion("10000.00"));

        ReservaInvitadoResponse respuesta = service.reservarYPagar(request);

        verify(usuarioRepository, never()).save(any());
        assertThat(comprobante.getClienteNombre()).isEqualTo("Ana Pérez");
        assertThat(comprobante.getClienteDni()).isEqualTo("30111222");
        assertThat(comprobante.getClienteEmail()).isEqualTo("ana@mail.com");
        verify(comprobanteRepository).save(comprobante);
        assertThat(respuesta.pagada()).isTrue();
        assertThat(respuesta.numeroFactura()).isEqualTo("FZ-1");
        assertThat(respuesta.codigoReserva()).isEqualTo(reserva.getCodigoReserva());
    }

    @Test
    @DisplayName("Pago rechazado: 422 para que la transacción revierta la reserva y no quede comprobante")
    void reservarYPagar_rechazado() {
        sinCuenta();
        request.setForzarRechazo(true);
        ReservaCancha reserva = reservaDe(null);
        when(canchaService.reservarComoInvitado(eq(1L), any(ReservaCancha.class))).thenReturn(reserva);
        when(pagoService.procesarPagoInvitado(reserva, true))
                .thenReturn(Transaccion.builder().idTransaccion(99L).estadoPago(EstadoPago.RECHAZADO).build());

        assertThatThrownBy(() -> service.reservarYPagar(request))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("rechazado");
        verify(comprobanteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Turno ocupado: el 409 de la reserva llega antes del cobro")
    void reservarYPagar_turnoOcupadoNoCobra() {
        sinCuenta();
        when(canchaService.reservarComoInvitado(eq(1L), any(ReservaCancha.class)))
                .thenThrow(new ConflictoException("La cancha ya se encuentra reservada en el horario solicitado"));

        assertThatThrownBy(() -> service.reservarYPagar(request)).isInstanceOf(ConflictoException.class);
        verify(pagoService, never()).procesarPagoInvitado(any(), anyBoolean());
    }

    @Test
    @DisplayName("DNI de un socio: REQUIERE_INICIO_SESION y no se reserva")
    void reservar_dniDeSocio() {
        when(usuarioRepository.findByDni("30111222"))
                .thenReturn(Optional.of(Usuario.builder().idUsuario(1L).tipoUsuario(TipoUsuario.SOCIO).build()));

        assertThatThrownBy(() -> service.reservarYPagar(request)).isInstanceOf(RequiereInicioSesionException.class);
        verify(canchaService, never()).reservarComoInvitado(anyLong(), any());
    }

    @Test
    @DisplayName("Email de una cuenta: REQUIERE_INICIO_SESION")
    void reservar_emailDeCuenta() {
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot("ana@mail.com", TipoUsuario.EXTERNO)).thenReturn(true);

        assertThatThrownBy(() -> service.reservarYPagar(request)).isInstanceOf(RequiereInicioSesionException.class);
    }

    @Test
    @DisplayName("Un DNI de EXTERNO anterior a ADR-018 no exige sesión")
    void reservar_dniDeExternoViejo() {
        when(usuarioRepository.findByDni("30111222"))
                .thenReturn(Optional.of(Usuario.builder().idUsuario(7L).tipoUsuario(TipoUsuario.EXTERNO).build()));
        when(usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot("ana@mail.com", TipoUsuario.EXTERNO)).thenReturn(false);
        when(canchaService.reservarComoInvitado(eq(1L), any(ReservaCancha.class)))
                .thenThrow(new ConflictoException("ocupado"));

        assertThatThrownBy(() -> service.reservarYPagar(request)).isInstanceOf(ConflictoException.class);
    }

    @Test
    @DisplayName("El código de una reserva de socio no sirve en el checkout de invitado")
    void obtener_codigoDeReservaDeSocio() {
        Usuario socio = Usuario.builder().idUsuario(1L).tipoUsuario(TipoUsuario.SOCIO).build();
        ReservaCancha reserva = reservaDe(socio);
        when(reservaCanchaRepository.findConDetalleByCodigoReserva(reserva.getCodigoReserva())).thenReturn(Optional.of(reserva));

        assertThatThrownBy(() -> service.obtener(reserva.getCodigoReserva()))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("Si la tarifa cambió después de reservar, la respuesta no trae un desglose que no explica el precio")
    void obtener_sinDesgloseSiCambioLaTarifa() {
        Usuario invitado = Usuario.builder().idUsuario(7L).tipoUsuario(TipoUsuario.EXTERNO).build();
        ReservaCancha reserva = reservaDe(invitado);
        when(reservaCanchaRepository.findConDetalleByCodigoReserva(reserva.getCodigoReserva())).thenReturn(Optional.of(reserva));
        when(canchaService.cotizarPara(eq(1L), any(), any(), any())).thenReturn(cotizacion("12000.00"));

        assertThat(service.obtener(reserva.getCodigoReserva()).cotizacion()).isNull();
    }

    @Test
    @DisplayName("Una reserva de invitado sin usuario se consulta por su código con el comprobante")
    void obtener_reservaSinUsuario() {
        ReservaCancha reserva = reservaDe(null);
        when(reservaCanchaRepository.findConDetalleByCodigoReserva(reserva.getCodigoReserva())).thenReturn(Optional.of(reserva));
        when(transaccionRepository.findFirstByReservaCancha_IdReservaCanchaAndEstadoPago(10L, EstadoPago.CONFIRMADO))
                .thenReturn(Optional.of(Transaccion.builder().idTransaccion(99L).build()));
        when(comprobanteRepository.findByTransaccion_IdTransaccion(99L))
                .thenReturn(Optional.of(Comprobante.builder().numeroFactura("FZ-1").build()));
        when(canchaService.cotizarPara(eq(1L), any(), any(), any())).thenReturn(cotizacion("10000.00"));

        ReservaInvitadoResponse respuesta = service.obtener(reserva.getCodigoReserva());

        assertThat(respuesta.pagada()).isTrue();
        assertThat(respuesta.numeroFactura()).isEqualTo("FZ-1");
    }

    @Test
    @DisplayName("El comprobante de una reserva sin pagar responde 422")
    void comprobantePdf_sinPago() {
        Usuario invitado = Usuario.builder().idUsuario(7L).tipoUsuario(TipoUsuario.EXTERNO).build();
        ReservaCancha reserva = reservaDe(invitado);
        when(reservaCanchaRepository.findConDetalleByCodigoReserva(reserva.getCodigoReserva())).thenReturn(Optional.of(reserva));
        when(transaccionRepository.findFirstByReservaCancha_IdReservaCanchaAndEstadoPago(10L, EstadoPago.CONFIRMADO))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.comprobantePdf(reserva.getCodigoReserva()))
                .isInstanceOf(ReglaNegocioException.class);
    }
}
