package com.fitzone.modulo.clases.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ClaseCompletaException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.MembresiaInactivaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.clases.event.CupoLiberadoEvent;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.ListaEspera;
import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.clases.repository.ListaEsperaRepository;
import com.fitzone.modulo.clases.repository.ReservaClaseRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

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
    private final ListaEsperaRepository listaEsperaRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ReservaClase reservar(Long idClase, Long idUsuario) {
        ClaseGrupal clase = claseGrupalRepository.findByIdWithLock(idClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", idClase));

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", idUsuario));

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

        return guardada;
    }

    @Transactional
    public ReservaClase cancelar(Long idReservaClase) {
        ReservaClase reserva = reservaClaseRepository.findById(idReservaClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Reserva", idReservaClase));

        if (reserva.getEstado() == EstadoReservaClase.CANCELADA) {
            throw new ReglaNegocioException("La reserva ya se encuentra cancelada");
        }

        LocalDateTime ahora = LocalDateTime.now();
        ClaseGrupal clase = reserva.getClase();
        if (ahora.isAfter(clase.getFechaHoraInicio().minusHours(2))) {
            throw new ReglaNegocioException("La cancelación solo está permitida hasta 2 horas antes del inicio de la clase");
        }

        reserva.setEstado(EstadoReservaClase.CANCELADA);
        ReservaClase cancelada = reservaClaseRepository.save(reserva);

        eventPublisher.publishEvent(new CupoLiberadoEvent(clase.getIdClase()));

        return cancelada;
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onCupoLiberado(CupoLiberadoEvent event) {
        procesarCupoLiberado(event.idClase());
    }

    @Transactional
    public void procesarCupoLiberado(Long idClase) {
        ClaseGrupal clase = claseGrupalRepository.findByIdWithLock(idClase).orElse(null);
        if (clase == null) {
            return;
        }

        List<ListaEspera> listaEspera = listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(idClase);
        if (!listaEspera.isEmpty()) {
            ListaEspera primerEspera = listaEspera.get(0);
            ReservaClase promocionada = ReservaClase.builder()
                    .clase(clase)
                    .usuario(primerEspera.getUsuario())
                    .estado(EstadoReservaClase.CONFIRMADA)
                    .build();
            reservaClaseRepository.save(promocionada);
            listaEsperaRepository.delete(primerEspera);

            for (int i = 1; i < listaEspera.size(); i++) {
                ListaEspera espera = listaEspera.get(i);
                espera.setOrdenPosicion(i);
                listaEsperaRepository.save(espera);
            }
        } else {
            long confirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(idClase, EstadoReservaClase.CONFIRMADA);
            clase.setCupoDisponible(Math.max(0, (int) (clase.getCupoMaximo() - confirmadas)));
            claseGrupalRepository.save(clase);
        }
    }

    @Transactional(readOnly = true)
    public List<ReservaClase> listarPorUsuario(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new RecursoNoEncontradoException("Usuario", idUsuario);
        }
        return reservaClaseRepository.findByUsuario_IdUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<ReservaClase> listarInscriptos(Long idClase) {
        if (!claseGrupalRepository.existsById(idClase)) {
            throw new RecursoNoEncontradoException("Clase grupal", idClase);
        }
        return reservaClaseRepository.findByClase_IdClaseAndEstado(idClase, EstadoReservaClase.CONFIRMADA);
    }
}
