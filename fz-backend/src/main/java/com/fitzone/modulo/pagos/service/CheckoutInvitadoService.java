package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.exception.RequiereInicioSesionException;
import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.canchas.repository.ReservaCanchaRepository;
import com.fitzone.modulo.canchas.service.CanchaService;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.models.PagoInvitadoResponse;
import com.fitzone.modulo.pagos.models.ReservaInvitadoRequest;
import com.fitzone.modulo.pagos.models.ReservaInvitadoResponse;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Reserva, pago y comprobante de una cancha sin cuenta. El invitado es un usuario EXTERNO sin auth_id,
 * identificado por su DNI; el código no adivinable de la reserva es lo único que da acceso a ella.
 */
@Service
@RequiredArgsConstructor
public class CheckoutInvitadoService {

    public static final int MAX_RESERVAS_PENDIENTES = 3;

    private static final String MENSAJE_TIENE_CUENTA =
            "Esos datos pertenecen a una cuenta de FitZone. Iniciá sesión para reservar con tus beneficios.";

    private final UsuarioRepository usuarioRepository;
    private final ReservaCanchaRepository reservaCanchaRepository;
    private final TransaccionRepository transaccionRepository;
    private final ComprobanteRepository comprobanteRepository;
    private final CanchaService canchaService;
    private final PagoService pagoService;
    private final ComprobanteService comprobanteService;

    public record ComprobantePdf(String numeroFactura, byte[] contenido) {}

    @Transactional
    public ReservaInvitadoResponse reservar(ReservaInvitadoRequest request) {
        Usuario invitado = resolverInvitado(request);

        long pendientes = reservaCanchaRepository.contarPendientesDePago(invitado.getIdUsuario(), LocalDateTime.now());
        if (pendientes >= MAX_RESERVAS_PENDIENTES) {
            throw new ReglaNegocioException("Ya tenés " + MAX_RESERVAS_PENDIENTES
                    + " reservas sin pagar. Pagá alguna antes de reservar otro turno.");
        }

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(request.getFechaHoraInicio())
                .fechaHoraFin(request.getFechaHoraFin())
                .build();
        ReservaCancha guardada = canchaService.reservarComoInvitado(request.getIdCancha(), invitado, reserva);
        return respuestaDe(guardada, false);
    }

    @Transactional(readOnly = true)
    public ReservaInvitadoResponse obtener(UUID codigo) {
        ReservaCancha reserva = buscarPorCodigo(codigo);
        return respuestaDe(reserva, estaPagada(reserva));
    }

    @Transactional
    public PagoInvitadoResponse pagar(UUID codigo, boolean forzarRechazo) {
        ReservaCancha reserva = buscarPorCodigo(codigo);
        Transaccion transaccion = pagoService.procesarPagoInvitado(reserva, forzarRechazo);
        Comprobante comprobante = comprobanteRepository
                .findByTransaccion_IdTransaccion(transaccion.getIdTransaccion())
                .orElse(null);
        return PagoInvitadoResponse.desde(transaccion, comprobante);
    }

    @Transactional(readOnly = true)
    public ComprobantePdf comprobantePdf(UUID codigo) {
        ReservaCancha reserva = buscarPorCodigo(codigo);
        Transaccion pago = transaccionRepository
                .findFirstByReservaCancha_IdReservaCanchaAndEstadoPago(reserva.getIdReservaCancha(), EstadoPago.CONFIRMADO)
                .orElseThrow(() -> new ReglaNegocioException("La reserva todavía no está pagada y no tiene comprobante"));
        Comprobante comprobante = comprobanteRepository.findByTransaccion_IdTransaccion(pago.getIdTransaccion())
                .orElseThrow(() -> new RecursoNoEncontradoException("Comprobante para la transacción", pago.getIdTransaccion()));
        return new ComprobantePdf(comprobante.getNumeroFactura(), comprobanteService.generarPdf(comprobante));
    }

    private Usuario resolverInvitado(ReservaInvitadoRequest request) {
        String dni = request.getDni().trim();
        String email = request.getEmail().trim().toLowerCase();

        Usuario invitado = usuarioRepository.findByDni(dni).orElse(null);
        boolean dniDeCuenta = invitado != null && invitado.getTipoUsuario() != TipoUsuario.EXTERNO;
        if (dniDeCuenta || usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot(email, TipoUsuario.EXTERNO)) {
            throw new RequiereInicioSesionException(MENSAJE_TIENE_CUENTA);
        }

        if (invitado == null) {
            invitado = Usuario.builder().dni(dni).tipoUsuario(TipoUsuario.EXTERNO).build();
        }
        invitado.setNombre(request.getNombre().trim());
        invitado.setApellido(request.getApellido().trim());
        invitado.setEmail(email);
        invitado.setTelefono(request.getTelefono().trim());
        invitado.setIdSede(null);
        return usuarioRepository.save(invitado);
    }

    private ReservaCancha buscarPorCodigo(UUID codigo) {
        return reservaCanchaRepository.findConDetalleByCodigoReserva(codigo)
                .filter(r -> r.getUsuario().getTipoUsuario() == TipoUsuario.EXTERNO)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una reserva de invitado con ese código"));
    }

    private boolean estaPagada(ReservaCancha reserva) {
        return transaccionRepository.existsByReservaCancha_IdReservaCanchaAndEstadoPago(
                reserva.getIdReservaCancha(), EstadoPago.CONFIRMADO);
    }

    private ReservaInvitadoResponse respuestaDe(ReservaCancha reserva, boolean pagada) {
        CotizacionDTO cotizacion = canchaService.cotizarPara(reserva.getCancha().getIdCancha(), reserva.getUsuario(),
                reserva.getFechaHoraInicio(), reserva.getFechaHoraFin());
        return ReservaInvitadoResponse.desde(reserva, cotizacion, pagada);
    }
}
