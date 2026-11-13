package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.exception.RequiereInicioSesionException;
import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.canchas.repository.ReservaCanchaRepository;
import com.fitzone.modulo.canchas.service.CanchaService;
import com.fitzone.modulo.gimnasio.models.Sede;
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
import org.mockito.ArgumentCaptor;
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
                .nombre("Ana").apellido("Pérez").dni("30111222").email("Ana@Mail.com").telefono("1155550000")
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

    @Test
    @DisplayName("Un DNI nuevo crea un EXTERNO sin cuenta, con el email normalizado, y reserva")
    void reservar_creaInvitado() {
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot("ana@mail.com", TipoUsuario.EXTERNO)).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setIdUsuario(50L);
            return u;
        });
        when(canchaService.reservarComoInvitado(eq(1L), any(Usuario.class), any(ReservaCancha.class)))
                .thenAnswer(inv -> reservaDe(inv.getArgument(1)));
        when(canchaService.cotizarPara(eq(1L), any(), any(), any())).thenReturn(cotizacion("10000.00"));

        ReservaInvitadoResponse respuesta = service.reservar(request);

        ArgumentCaptor<Usuario> guardado = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(guardado.capture());
        assertThat(guardado.getValue().getTipoUsuario()).isEqualTo(TipoUsuario.EXTERNO);
        assertThat(guardado.getValue().getAuthId()).isNull();
        assertThat(guardado.getValue().getEmail()).isEqualTo("ana@mail.com");
        assertThat(respuesta.codigoReserva()).isNotNull();
        assertThat(respuesta.cotizacion()).isNotNull();
        assertThat(respuesta.pagada()).isFalse();
    }

    @Test
    @DisplayName("Un DNI de EXTERNO existente se reutiliza y actualiza sus datos de contacto")
    void reservar_reutilizaInvitado() {
        Usuario existente = Usuario.builder().idUsuario(7L).dni("30111222").nombre("Viejo")
                .tipoUsuario(TipoUsuario.EXTERNO).build();
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.of(existente));
        when(usuarioRepository.save(existente)).thenReturn(existente);
        when(canchaService.reservarComoInvitado(eq(1L), eq(existente), any())).thenReturn(reservaDe(existente));
        when(canchaService.cotizarPara(eq(1L), any(), any(), any())).thenReturn(cotizacion("10000.00"));

        service.reservar(request);

        assertThat(existente.getNombre()).isEqualTo("Ana");
        assertThat(existente.getTelefono()).isEqualTo("1155550000");
    }

    @Test
    @DisplayName("DNI de un socio: REQUIERE_INICIO_SESION y no se reserva")
    void reservar_dniDeSocio() {
        when(usuarioRepository.findByDni("30111222"))
                .thenReturn(Optional.of(Usuario.builder().idUsuario(1L).tipoUsuario(TipoUsuario.SOCIO).build()));

        assertThatThrownBy(() -> service.reservar(request)).isInstanceOf(RequiereInicioSesionException.class);
        verify(canchaService, never()).reservarComoInvitado(anyLong(), any(), any());
    }

    @Test
    @DisplayName("Email de una cuenta: REQUIERE_INICIO_SESION")
    void reservar_emailDeCuenta() {
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.empty());
        when(usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot("ana@mail.com", TipoUsuario.EXTERNO)).thenReturn(true);

        assertThatThrownBy(() -> service.reservar(request)).isInstanceOf(RequiereInicioSesionException.class);
    }

    @Test
    @DisplayName("Con 3 reservas sin pagar no se puede reservar otra")
    void reservar_limitePendientes() {
        Usuario existente = Usuario.builder().idUsuario(7L).dni("30111222").tipoUsuario(TipoUsuario.EXTERNO).build();
        when(usuarioRepository.findByDni("30111222")).thenReturn(Optional.of(existente));
        when(usuarioRepository.save(existente)).thenReturn(existente);
        when(reservaCanchaRepository.contarPendientesDePago(eq(7L), any())).thenReturn(3L);

        assertThatThrownBy(() -> service.reservar(request))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("3 reservas sin pagar");
        verify(canchaService, never()).reservarComoInvitado(anyLong(), any(), any());
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
    @DisplayName("Pagar delega en PagoService con la reserva del código")
    void pagar_delegaEnPagoService() {
        Usuario invitado = Usuario.builder().idUsuario(7L).tipoUsuario(TipoUsuario.EXTERNO).build();
        ReservaCancha reserva = reservaDe(invitado);
        Transaccion transaccion = Transaccion.builder().idTransaccion(99L).estadoPago(EstadoPago.CONFIRMADO).build();
        when(reservaCanchaRepository.findConDetalleByCodigoReserva(reserva.getCodigoReserva())).thenReturn(Optional.of(reserva));
        when(pagoService.procesarPagoInvitado(reserva, false)).thenReturn(transaccion);
        when(comprobanteRepository.findByTransaccion_IdTransaccion(99L)).thenReturn(Optional.empty());

        assertThat(service.pagar(reserva.getCodigoReserva(), false).aprobado()).isTrue();
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
