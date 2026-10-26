package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
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

    @Transactional
    public Transaccion procesarPago(PagoRequest request) {
        log.info("Iniciando procesamiento de pago: concepto={}, idUsuario={}, idSede={}",
                request.getConcepto(), request.getIdUsuario(), request.getIdSede());

        Usuario usuario = usuarioRepository.findById(request.getIdUsuario())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", request.getIdUsuario()));

        Sede sede = sedeRepository.findById(request.getIdSede())
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", request.getIdSede()));

        BigDecimal monto;
        String conceptoDescripcion;
        Membresia membresia = null;
        ReservaCancha reservaCancha = null;

        if (request.getConcepto() == TipoOrigenTransaccion.MEMBRESIA) {
            if (request.getIdMembresia() == null || request.getIdReservaCancha() != null) {
                throw new PeticionInvalidaException("Para pagos con concepto MEMBRESIA debe especificar idMembresia y omitir idReservaCancha");
            }

            membresia = membresiaRepository.findById(request.getIdMembresia())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Membresia", request.getIdMembresia()));

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

            boolean yaPagada = transaccionRepository.existsByReservaCancha_IdReservaCanchaAndEstadoPago(
                    request.getIdReservaCancha(), EstadoPago.CONFIRMADO);
            if (yaPagada) {
                throw new ConflictoException("La reserva de cancha ya fue pagada con éxito previamente");
            }

            if (reservaCancha.getPrecioFinal() == null) {
                throw new ReglaNegocioException("La reserva de cancha no tiene un precio final asignado");
            }

            monto = reservaCancha.getPrecioFinal();
            conceptoDescripcion = "Reserva Cancha #" + reservaCancha.getIdReservaCancha();

        } else {
            throw new PeticionInvalidaException("El concepto de pago no es soportado. Debe ser MEMBRESIA o RESERVA_CANCHA");
        }

        // Delegar cobro a la pasarela externa o simulada (Adapter Pattern)
        boolean forzarRechazo = Boolean.TRUE.equals(request.getForzarRechazo());
        RespuestaPasarela respuesta = pasarelaPago.cobrar(monto, conceptoDescripcion, forzarRechazo);

        EstadoPago estadoFinal;
        LocalDateTime fechaConfirmacion = null;

        if (respuesta.aprobado()) {
            estadoFinal = EstadoPago.CONFIRMADO;
            fechaConfirmacion = LocalDateTime.now();

            // Si es membresía y el pago fue confirmado, se renueva si no estaba activa o si ya tenía un pago previo
            if (request.getConcepto() == TipoOrigenTransaccion.MEMBRESIA) {
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
                .concepto(request.getConcepto())
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
        return transaccionRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Transacción", id));
    }

    @Transactional(readOnly = true)
    public List<Transaccion> listarPorUsuario(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new RecursoNoEncontradoException("Usuario", idUsuario);
        }
        return transaccionRepository.findByUsuario_IdUsuarioOrderByFechaHoraCreacionDesc(idUsuario);
    }
}
