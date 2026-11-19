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
import com.fitzone.modulo.pagos.models.ReservaInvitadoRequest;
import com.fitzone.modulo.pagos.models.ReservaInvitadoResponse;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Reserva y pago de una cancha por un cliente externo, en un solo paso (ADR-018).
 * El externo no es usuario del sistema: no se guarda en fz_usr_usuarios y sus datos quedan solo en el comprobante.
 * La retención del turno mientras completa el pago vive en su navegador; acá recién se ocupa el turno si el pago se aprueba.
 */
@Service
@RequiredArgsConstructor
public class CheckoutInvitadoService {

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

    /**
     * Ocupa el turno con bloqueo pesimista sobre la cancha (RN-02), cobra y deja todo guardado solo si el pago se aprueba.
     * Si la pasarela rechaza, la excepción revierte la transacción: no queda reserva, ni pago, ni datos del cliente.
     * Como en un Java EE con JTA: el rollback deshace el INSERT de la reserva hecho antes del cobro.
     */
    @Transactional
    public ReservaInvitadoResponse reservarYPagar(ReservaInvitadoRequest request) {
        String dni = request.getDni().trim();
        String email = request.getEmail().trim().toLowerCase();
        validarQueNoTengaCuenta(dni, email);

        ReservaCancha reserva = ReservaCancha.builder()
                .fechaHoraInicio(request.getFechaHoraInicio())
                .fechaHoraFin(request.getFechaHoraFin())
                .build();
        ReservaCancha guardada = canchaService.reservarComoInvitado(request.getIdCancha(), reserva);

        Transaccion pago = pagoService.procesarPagoInvitado(guardada, Boolean.TRUE.equals(request.getForzarRechazo()));
        if (pago.getEstadoPago() != EstadoPago.CONFIRMADO) {
            throw new ReglaNegocioException("El pago fue rechazado. Podés intentarlo de nuevo mientras el turno siga retenido.");
        }

        Comprobante comprobante = comprobanteRepository.findByTransaccion_IdTransaccion(pago.getIdTransaccion())
                .orElseThrow(() -> new RecursoNoEncontradoException("Comprobante para la transacción", pago.getIdTransaccion()));
        comprobante.setClienteNombre(request.getNombre().trim() + " " + request.getApellido().trim());
        comprobante.setClienteDni(dni);
        comprobante.setClienteEmail(email);
        comprobanteRepository.save(comprobante);

        return respuestaDe(guardada, Optional.of(comprobante));
    }

    @Transactional(readOnly = true)
    public ReservaInvitadoResponse obtener(UUID codigo) {
        ReservaCancha reserva = buscarPorCodigo(codigo);
        return respuestaDe(reserva, comprobanteDe(reserva));
    }

    @Transactional(readOnly = true)
    public ComprobantePdf comprobantePdf(UUID codigo) {
        Comprobante comprobante = comprobanteDe(buscarPorCodigo(codigo))
                .orElseThrow(() -> new ReglaNegocioException("La reserva todavía no está pagada y no tiene comprobante"));
        return new ComprobantePdf(comprobante.getNumeroFactura(), comprobanteService.generarPdf(comprobante));
    }

    // Un socio o un empleado reserva con sesión: así el socio recibe su descuento y no queda una reserva anónima suya
    private void validarQueNoTengaCuenta(String dni, String email) {
        boolean dniDeCuenta = usuarioRepository.findByDni(dni)
                .map(u -> u.getTipoUsuario() != TipoUsuario.EXTERNO)
                .orElse(false);
        if (dniDeCuenta || usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot(email, TipoUsuario.EXTERNO)) {
            throw new RequiereInicioSesionException(MENSAJE_TIENE_CUENTA);
        }
    }

    // Reservas de invitado: las nuevas no tienen usuario; las anteriores a ADR-018 apuntan a un usuario EXTERNO
    private ReservaCancha buscarPorCodigo(UUID codigo) {
        return reservaCanchaRepository.findConDetalleByCodigoReserva(codigo)
                .filter(r -> r.getUsuario() == null || r.getUsuario().getTipoUsuario() == TipoUsuario.EXTERNO)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe una reserva de invitado con ese código"));
    }

    private Optional<Comprobante> comprobanteDe(ReservaCancha reserva) {
        return transaccionRepository
                .findFirstByReservaCancha_IdReservaCanchaAndEstadoPago(reserva.getIdReservaCancha(), EstadoPago.CONFIRMADO)
                .flatMap(pago -> comprobanteRepository.findByTransaccion_IdTransaccion(pago.getIdTransaccion()));
    }

    private ReservaInvitadoResponse respuestaDe(ReservaCancha reserva, Optional<Comprobante> comprobante) {
        CotizacionDTO cotizacion = canchaService.cotizarPara(reserva.getCancha().getIdCancha(), null,
                reserva.getFechaHoraInicio(), reserva.getFechaHoraFin());
        return ReservaInvitadoResponse.desde(reserva, cotizacion, comprobante.orElse(null));
    }
}
