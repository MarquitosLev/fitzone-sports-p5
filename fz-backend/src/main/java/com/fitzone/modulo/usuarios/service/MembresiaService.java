package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.PlanRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MembresiaService {

    private final MembresiaRepository membresiaRepository;
    private final PlanRepository planRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<Plan> listarPlanes() {
        return planRepository.findAll();
    }

    @Transactional
    public Membresia crear(Membresia membresia) {
        // Elimina cualquier ID provisto por el cliente para evitar sobrescribir membresías existentes
        membresia.setIdMembresia(null);

        if (membresia.getUsuario() == null || membresia.getUsuario().getIdUsuario() == null) {
            throw new ReglaNegocioException("Debe especificar el idUsuario para asociar la membresía");
        }
        if (membresia.getPlan() == null || membresia.getPlan().getIdPlan() == null) {
            throw new ReglaNegocioException("Debe especificar el idPlan para la membresía");
        }

        Long idUsuario = membresia.getUsuario().getIdUsuario();
        Integer idPlan = membresia.getPlan().getIdPlan();

        // Bloqueo pesimista sobre el usuario para serializar atómicamente creaciones concurrentes del mismo usuario
        Usuario usuario = usuarioRepository.findByIdForUpdate(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", idUsuario));

        // Solo usuarios SOCIO pueden tener membresía (si es EXTERNO o rol administrativo -> 422)
        if (usuario.getTipoUsuario() != TipoUsuario.SOCIO) {
            throw new ReglaNegocioException("Solo los usuarios con rol SOCIO pueden tener una membresía");
        }

        // Un socio no puede tener más de una membresía activa o suspendida vigente (409).
        // Comprueba contra la fecha de vencimiento actual para no bloquear si ya venció
        LocalDate hoy = LocalDate.now();
        boolean yaTieneVigente = membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                idUsuario, List.of(EstadoMembresia.ACTIVO, EstadoMembresia.SUSPENDIDO), hoy);
        if (yaTieneVigente) {
            throw new ConflictoException("El usuario ya cuenta con una membresía activa o suspendida");
        }

        Plan plan = planRepository.findById(idPlan)
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan", idPlan));

        LocalDate fechaInicio = membresia.getFechaInicio() != null ? membresia.getFechaInicio() : hoy;
        int duracionMeses = plan.getDuracionMeses() != null ? plan.getDuracionMeses() : 1;
        LocalDate fechaVencimiento = fechaInicio.plusMonths(duracionMeses);

        membresia.setUsuario(usuario);
        membresia.setPlan(plan);
        membresia.setFechaInicio(fechaInicio);
        membresia.setFechaVencimiento(fechaVencimiento);
        membresia.setEstado(EstadoMembresia.ACTIVO);
        membresia.setFechaCancelacion(null);

        return membresiaRepository.save(membresia);
    }

    @Transactional(readOnly = true)
    public Membresia obtenerVigentePorUsuario(Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new RecursoNoEncontradoException("Usuario", idUsuario);
        }

        LocalDate hoy = LocalDate.now();
        return membresiaRepository.findFirstByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqualOrderByFechaVencimientoDesc(
                        idUsuario, List.of(EstadoMembresia.ACTIVO, EstadoMembresia.SUSPENDIDO), hoy)
                .orElseThrow(() -> new RecursoNoEncontradoException("El usuario no posee una membresía activa o suspendida"));
    }

    @Transactional
    public Membresia renovar(Long idMembresia) {
        Membresia membresia = membresiaRepository.findById(idMembresia)
                .orElseThrow(() -> new RecursoNoEncontradoException("Membresia", idMembresia));

        if (membresia.getEstado() == EstadoMembresia.CANCELADO) {
            throw new ReglaNegocioException("Una membresía cancelada no puede ser renovada");
        }

        Plan plan = membresia.getPlan();
        if (plan == null) {
            throw new ReglaNegocioException("La membresía no tiene un plan asignado para calcular la renovación");
        }
        int duracionMeses = plan.getDuracionMeses() != null ? plan.getDuracionMeses() : 1;

        if (membresia.getEstado() == EstadoMembresia.ACTIVO) {
            membresia.setFechaVencimiento(membresia.getFechaVencimiento().plusMonths(duracionMeses));
        } else {
            // Si está VENCIDO o SUSPENDIDO, la renovación parte desde hoy y reactiva a ACTIVO
            membresia.setFechaInicio(LocalDate.now());
            membresia.setFechaVencimiento(LocalDate.now().plusMonths(duracionMeses));
            membresia.setEstado(EstadoMembresia.ACTIVO);
        }

        return membresiaRepository.save(membresia);
    }

    @Transactional
    public Membresia cambiarEstado(Long idMembresia, EstadoMembresia nuevoEstado) {
        Membresia membresia = membresiaRepository.findByIdWithLock(idMembresia)
                .orElseThrow(() -> new RecursoNoEncontradoException("Membresia", idMembresia));

        EstadoMembresia actual = membresia.getEstado();

        // Validaciones de transición de estado:
        // ACTIVO -> SUSPENDIDO o CANCELADO
        // SUSPENDIDO -> ACTIVO o CANCELADO
        boolean transicionValida = (actual == EstadoMembresia.ACTIVO && (nuevoEstado == EstadoMembresia.SUSPENDIDO || nuevoEstado == EstadoMembresia.CANCELADO))
                || (actual == EstadoMembresia.SUSPENDIDO && (nuevoEstado == EstadoMembresia.ACTIVO || nuevoEstado == EstadoMembresia.CANCELADO));

        if (!transicionValida) {
            throw new ReglaNegocioException("No se permite cambiar el estado de " + actual + " a " + nuevoEstado);
        }

        if (nuevoEstado == EstadoMembresia.CANCELADO) {
            membresia.setFechaCancelacion(LocalDate.now());
        }

        membresia.setEstado(nuevoEstado);
        return membresiaRepository.save(membresia);
    }

    // RN-03: tarea diaria que pasa a VENCIDO las membresías activas o suspendidas cuya fecha_vencimiento ya pasó
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expirarMembresiasVencidas() {
        LocalDate hoy = LocalDate.now();
        List<Membresia> vencidas = membresiaRepository.findByEstadoInAndFechaVencimientoBefore(
                List.of(EstadoMembresia.ACTIVO, EstadoMembresia.SUSPENDIDO), hoy);
        if (!vencidas.isEmpty()) {
            for (Membresia m : vencidas) {
                m.setEstado(EstadoMembresia.VENCIDO);
            }
            membresiaRepository.saveAll(vencidas);
            log.info("Tarea programada ejecutada: se marcaron {} membresías (activas/suspendidas vencidas) como VENCIDO", vencidas.size());
        }
    }
}
