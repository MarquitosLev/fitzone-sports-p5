package com.fitzone.modulo.clases.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ClaseCompletaException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.MembresiaInactivaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.clases.event.CupoLiberadoEvent;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.InscriptoResponse;
import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.clases.repository.ReservaClaseRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservaClaseService {

    private final ReservaClaseRepository reservaClaseRepository;
    private final ClaseGrupalRepository claseGrupalRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final ListaEsperaService listaEsperaService;
    private final ApplicationEventPublisher eventPublisher;
    private final UsuarioActual usuarioActual;

    @Transactional
    public ReservaClase reservar(Long idClase) {
        ClaseGrupal clase = claseGrupalRepository.findByIdWithLock(idClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", idClase));

        Usuario usuario = usuarioActual.obtener();
        Long idUsuario = usuario.getIdUsuario();

        if (usuario.getTipoUsuario() != TipoUsuario.SOCIO) {
            throw new ReglaNegocioException("Solo los socios pueden reservar una clase");
        }

        boolean tieneMembresiaActiva = membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                idUsuario, List.of(EstadoMembresia.ACTIVO), LocalDate.now());
        if (!tieneMembresiaActiva) {
            throw new MembresiaInactivaException("El socio no posee una membresía activa y vigente");
        }

        LocalDateTime ahora = LocalDateTime.now();
        if (!ahora.isBefore(clase.getFechaHoraInicio())) {
            throw new ReglaNegocioException("No se puede reservar una clase que ya ha comenzado");
        }
        if (ahora.isBefore(clase.getFechaHoraInicio().minusHours(48))) {
            throw new ReglaNegocioException("La reserva solo puede realizarse con hasta 48 horas de anticipación");
        }

        if (reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(idClase, idUsuario, EstadoReservaClase.CONFIRMADA)) {
            throw new ConflictoException("El socio ya posee una reserva confirmada para esta clase");
        }

        long reservasConfirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(idClase, EstadoReservaClase.CONFIRMADA);
        if (reservasConfirmadas >= clase.getCupoMaximo()) {
            throw new ClaseCompletaException("No hay cupo disponible en la clase seleccionada");
        }

        ReservaClase nuevaReserva = ReservaClase.builder()
                .clase(clase)
                .usuario(usuario)
                .estado(EstadoReservaClase.CONFIRMADA)
                .build();

        ReservaClase guardada = reservaClaseRepository.save(nuevaReserva);

        clase.setCupoDisponible(Math.max(0, (int) (clase.getCupoMaximo() - (reservasConfirmadas + 1))));
        claseGrupalRepository.save(clase);

        listaEsperaService.removerSocioSiEstaEnEspera(idClase, idUsuario);

        return guardada;
    }

    @Transactional
    public ReservaClase cancelar(Long idReservaClase) {
        ReservaClase reserva = reservaClaseRepository.findByIdWithLock(idReservaClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Reserva", idReservaClase));

        if (!reserva.getUsuario().getIdUsuario().equals(usuarioActual.obtener().getIdUsuario())) {
            throw new AccesoDenegadoException("Solo podés cancelar tus propias reservas");
        }

        if (reserva.getEstado() == EstadoReservaClase.CANCELADA) {
            throw new ReglaNegocioException("La reserva ya se encuentra cancelada");
        }

        LocalDateTime ahora = LocalDateTime.now();
        // Mismo bloqueo que reservar, para que el cupo no se calcule con una reserva a medio confirmar
        Long idClase = reserva.getClase().getIdClase();
        ClaseGrupal clase = claseGrupalRepository.findByIdWithLock(idClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", idClase));
        if (ahora.isAfter(clase.getFechaHoraInicio().minusHours(2))) {
            throw new ReglaNegocioException("La cancelación solo está permitida hasta 2 horas antes del inicio de la clase");
        }

        reserva.setEstado(EstadoReservaClase.CANCELADA);
        ReservaClase cancelada = reservaClaseRepository.save(reserva);

        long confirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(clase.getIdClase(), EstadoReservaClase.CONFIRMADA);
        clase.setCupoDisponible(Math.max(0, (int) (clase.getCupoMaximo() - confirmadas)));
        claseGrupalRepository.save(clase);

        eventPublisher.publishEvent(new CupoLiberadoEvent(clase.getIdClase()));

        return cancelada;
    }

    @Transactional(readOnly = true)
    public List<ReservaClase> listarPorUsuario(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new RecursoNoEncontradoException("Usuario", idUsuario);
        }
        return reservaClaseRepository.findByUsuario_IdUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<ReservaClase> listarMias() {
        return reservaClaseRepository.findByUsuario_IdUsuario(usuarioActual.obtener().getIdUsuario());
    }

    @Transactional(readOnly = true)
    public List<InscriptoResponse> listarInscriptos(Long idClase) {
        ClaseGrupal clase = claseGrupalRepository.findById(idClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", idClase));
        usuarioActual.validarSede(clase.getSede().getIdSede());
        return reservaClaseRepository.findByClase_IdClaseAndEstado(idClase, EstadoReservaClase.CONFIRMADA).stream()
                .map(InscriptoResponse::desde)
                .toList();
    }
}
