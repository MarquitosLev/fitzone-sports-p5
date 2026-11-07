package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.UsuarioActual;
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
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import com.fitzone.modulo.usuarios.service.MembresiaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PagoService {

    private final TransaccionRepository transaccionRepository;
    private final UsuarioRepository usuarioRepository;
    private final SedeRepository sedeRepository;
    private final MembresiaRepository membresiaRepository;
    private final ReservaCanchaRepository reservaCanchaRepository;
    private final MembresiaService membresiaService;
    private final PasarelaPago pasarelaPago;
    private final ComprobanteService comprobanteService;
    private final UsuarioActual usuarioActual;
    private final AccesoPagos accesoPagos;

    /**
     * Paga una membresía o una reserva propia del usuario logueado. El monto sale siempre del
     * servidor (precio del plan o precio congelado de la reserva), nunca del request.
     */
    @Transactional
    public Transaccion procesarPago(PagoRequest request) {
        Usuario usuario = usuarioActual.obtener();
        log.info("Iniciando procesamiento de pago: concepto={}, idUsuario={}",
                request.getConcepto(), usuario.getIdUsuario());

        BigDecimal monto;
        String conceptoDescripcion;
        Membresia membresia = null;
        ReservaCancha reservaCancha = null;
        Sede sede;

        if (request.getConcepto() == TipoOrigenTransaccion.MEMBRESIA) {
            if (request.getIdMembresia() == null || request.getIdReservaCancha() != null) {
                throw new PeticionInvalidaException("Para pagos con concepto MEMBRESIA debe especificar idMembresia y omitir idReservaCancha");
            }

            membresia = membresiaRepository.findById(request.getIdMembresia())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Membresia", request.getIdMembresia()));
            validarPropio(usuario, membresia.getUsuario(), "No puede pagar la membresía de otro usuario");

            // La membresía es de toda la red: la sede del cobro la indica el cliente
            if (request.getIdSede() == null) {
                throw new PeticionInvalidaException("Para pagos de membresía debe indicar idSede");
            }
            sede = sedeRepository.findById(request.getIdSede())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Sede", request.getIdSede()));

            if (membresia.getPlan() == null || membresia.getPlan().getPrecioBase() == null) {
                throw new ReglaNegocioException("La membresía no posee un plan con precio base asociado");
            }

            monto = membresia.getPlan().getPrecioBase();
            conceptoDescripcion = "Membresía - " + (membresia.getPlan().getNombre() != null ? membresia.getPlan().getNombre() : "Plan");

        } else if (request.getConcepto() == TipoOrigenTransaccion.RESERVA_CANCHA) {
            if (request.getIdReservaCancha() == null || request.getIdMembresia() != null) {
                throw new PeticionInvalidaException("Para pagos con concepto RESERVA_CANCHA debe especificar idReservaCancha y omitir idMembresia");
            }

            reservaCancha = reservaCanchaRepository.findById(request.getIdReservaCancha())
                    .orElseThrow(() -> new RecursoNoEncontradoException("ReservaCancha", request.getIdReservaCancha()));
            validarPropio(usuario, reservaCancha.getUsuario(), "No puede pagar la reserva de otro usuario");
            // El cobro de un turno se registra en la sede de la cancha; el idSede del request no se usa
            sede = reservaCancha.getCancha().getSede();
            validarReservaPagable(reservaCancha);
            monto = reservaCancha.getPrecioFinal();
            conceptoDescripcion = "Reserva Cancha #" + reservaCancha.getIdReservaCancha();

        } else {
            throw new PeticionInvalidaException("El concepto de pago no es soportado. Debe ser MEMBRESIA o RESERVA_CANCHA");
        }

        return cobrar(usuario, sede, membresia, reservaCancha, request.getConcepto(), monto,
                conceptoDescripcion, Boolean.TRUE.equals(request.getForzarRechazo()));
    }

    /** Paga la reserva de un invitado sin sesión; el código de la reserva ya fue validado por quien llama. */
    @Transactional
    public Transaccion procesarPagoInvitado(ReservaCancha reserva, boolean forzarRechazo) {
        validarReservaPagable(reserva);
        return cobrar(reserva.getUsuario(), reserva.getCancha().getSede(), null, reserva,
                TipoOrigenTransaccion.RESERVA_CANCHA, reserva.getPrecioFinal(),
                "Reserva Cancha #" + reserva.getIdReservaCancha(), forzarRechazo);
    }

    private void validarReservaPagable(ReservaCancha reserva) {
        if (transaccionRepository.existsByReservaCancha_IdReservaCanchaAndEstadoPago(
                reserva.getIdReservaCancha(), EstadoPago.CONFIRMADO)) {
            throw new ConflictoException("La reserva de cancha ya fue pagada con éxito previamente");
        }
        if (reserva.getPrecioFinal() == null) {
            throw new ReglaNegocioException("La reserva de cancha no tiene un precio final asignado");
        }
    }

    // Delegar cobro a la pasarela externa o simulada (Adapter Pattern)
    private Transaccion cobrar(Usuario usuario, Sede sede, Membresia membresia, ReservaCancha reservaCancha,
                               TipoOrigenTransaccion concepto, BigDecimal monto, String descripcion,
                               boolean forzarRechazo) {
        RespuestaPasarela respuesta = pasarelaPago.cobrar(monto, descripcion, forzarRechazo);
        return registrarCobro(usuario, sede, membresia, reservaCancha, concepto, monto, respuesta);
    }

    @Transactional
    public Transaccion registrarCobro(Usuario usuario, Sede sede, Membresia membresia, ReservaCancha reservaCancha,
                                      TipoOrigenTransaccion concepto, BigDecimal monto, RespuestaPasarela respuesta) {
        EstadoPago estadoFinal;
        LocalDateTime fechaConfirmacion = null;

        if (respuesta.aprobado()) {
            estadoFinal = EstadoPago.CONFIRMADO;
            fechaConfirmacion = LocalDateTime.now();

            // Si es membresía y el pago fue confirmado, se renueva si no estaba activa o si ya tenía un pago previo
            if (membresia != null) {
                boolean yaTeniaPago = transaccionRepository.existsByMembresia_IdMembresiaAndEstadoPago(
                        membresia.getIdMembresia(), EstadoPago.CONFIRMADO);
                if (membresia.getEstado() != EstadoMembresia.ACTIVO || yaTeniaPago) {
                    membresiaService.renovar(membresia.getIdMembresia());
                    log.info("Membresía #{} renovada automáticamente tras pago confirmado", membresia.getIdMembresia());
                }
            }
        } else {
            estadoFinal = EstadoPago.RECHAZADO;
            log.warn("Pago rechazado por la pasarela: {}", respuesta.mensaje());
        }

        Transaccion transaccion = Transaccion.builder()
                .usuario(usuario)
                .sede(sede)
                .membresia(membresia)
                .reservaCancha(reservaCancha)
                .concepto(concepto)
                .monto(monto)
                .estadoPago(estadoFinal)
                .tokenTransaccionPasarela(respuesta.tokenTransaccion())
                .fechaHoraCreacion(LocalDateTime.now())
                .fechaHoraConfirmacion(fechaConfirmacion)
                .build();

        Transaccion guardada = transaccionRepository.save(transaccion);

        if (estadoFinal == EstadoPago.CONFIRMADO) {
            comprobanteService.generarComprobante(guardada);
        }

        return guardada;
    }

    @Transactional(readOnly = true)
    public Transaccion obtenerPorId(Long id) {
        Transaccion transaccion = transaccionRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Transacción", id));
        accesoPagos.validarLectura(transaccion);
        return transaccion;
    }

    @Transactional(readOnly = true)
    public List<Transaccion> listarMios() {
        return transaccionRepository.findConDetalleByUsuario(usuarioActual.obtener().getIdUsuario());
    }

    private void validarPropio(Usuario logueado, Usuario duenio, String mensaje) {
        if (duenio == null || !logueado.getIdUsuario().equals(duenio.getIdUsuario())) {
            throw new AccesoDenegadoException(mensaje);
        }
    }

    @Transactional(readOnly = true)
    public List<Transaccion> listarPorUsuario(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new RecursoNoEncontradoException("Usuario", idUsuario);
        }
        return transaccionRepository.findByUsuario_IdUsuarioOrderByFechaHoraCreacionDesc(idUsuario);
    }
}
