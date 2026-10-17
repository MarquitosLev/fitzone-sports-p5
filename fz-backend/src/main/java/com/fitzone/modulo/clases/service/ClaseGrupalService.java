package com.fitzone.modulo.clases.service;

import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.clases.repository.ReservaClaseRepository;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClaseGrupalService {

    private final ClaseGrupalRepository claseGrupalRepository;
    private final ReservaClaseRepository reservaClaseRepository;
    private final SedeRepository sedeRepository;

    @Transactional
    public ClaseGrupal crear(ClaseGrupal clase) {
        Long idSede = clase.getSede() != null ? clase.getSede().getIdSede() : null;
        if (idSede == null) {
            throw new ReglaNegocioException("La sede es obligatoria");
        }
        Sede sede = sedeRepository.findById(idSede)
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", idSede));
        clase.setSede(sede);

        if (clase.getCupoMaximo() == null || clase.getCupoMaximo() <= 0) {
            throw new ReglaNegocioException("El cupo máximo debe ser mayor a 0");
        }
        if (clase.getDuracionMinutos() == null || clase.getDuracionMinutos() <= 0) {
            throw new ReglaNegocioException("La duración en minutos debe ser mayor a 0");
        }
        if (clase.getFechaHoraInicio() == null || !clase.getFechaHoraInicio().isAfter(LocalDateTime.now())) {
            throw new ReglaNegocioException("La fecha y hora de inicio debe ser en el futuro");
        }

        clase.setIdClase(null);
        clase.setCupoDisponible(clase.getCupoMaximo());
        return claseGrupalRepository.save(clase);
    }

    @Transactional
    public ClaseGrupal actualizar(Long id, ClaseGrupal datos) {
        ClaseGrupal existente = claseGrupalRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", id));

        if (datos.getCupoMaximo() == null || datos.getCupoMaximo() <= 0) {
            throw new ReglaNegocioException("El cupo máximo debe ser mayor a 0");
        }
        if (datos.getDuracionMinutos() == null || datos.getDuracionMinutos() <= 0) {
            throw new ReglaNegocioException("La duración en minutos debe ser mayor a 0");
        }

        long reservasConfirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(id, EstadoReservaClase.CONFIRMADA);
        if (datos.getCupoMaximo() < reservasConfirmadas) {
            throw new ReglaNegocioException("El cupo máximo (" + datos.getCupoMaximo()
                    + ") no se puede bajar por debajo de las reservas confirmadas (" + reservasConfirmadas + ")");
        }

        Long nuevoIdSede = datos.getSede() != null ? datos.getSede().getIdSede() : null;
        if (nuevoIdSede != null && !nuevoIdSede.equals(existente.getSede().getIdSede())) {
            Sede nuevaSede = sedeRepository.findById(nuevoIdSede)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Sede", nuevoIdSede));
            existente.setSede(nuevaSede);
        }

        existente.setNombreActividad(datos.getNombreActividad());
        if (datos.getFechaHoraInicio() != null) {
            existente.setFechaHoraInicio(datos.getFechaHoraInicio());
        }
        existente.setDuracionMinutos(datos.getDuracionMinutos());
        existente.setCupoMaximo(datos.getCupoMaximo());
        existente.setCupoDisponible(Math.max(0, (int) (datos.getCupoMaximo() - reservasConfirmadas)));

        return claseGrupalRepository.save(existente);
    }

    @Transactional
    public void eliminar(Long id) {
        ClaseGrupal clase = claseGrupalRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", id));

        long reservasConfirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(id, EstadoReservaClase.CONFIRMADA);
        if (reservasConfirmadas > 0) {
            throw new ConflictoException("No se puede eliminar la clase porque tiene " + reservasConfirmadas + " reserva(s) confirmada(s)");
        }

        claseGrupalRepository.delete(clase);
    }

    @Transactional(readOnly = true)
    public ClaseGrupal obtenerPorId(Long id) {
        ClaseGrupal clase = claseGrupalRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", id));

        long reservasConfirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(id, EstadoReservaClase.CONFIRMADA);
        clase.setCupoDisponible(Math.max(0, (int) (clase.getCupoMaximo() - reservasConfirmadas)));
        return clase;
    }

    @Transactional(readOnly = true)
    public List<ClaseGrupal> listar(Long idSede, LocalDateTime desde, LocalDateTime hasta) {
        if (idSede == null) {
            throw new ReglaNegocioException("El parámetro idSede es obligatorio");
        }
        if (!sedeRepository.existsById(idSede)) {
            throw new RecursoNoEncontradoException("Sede", idSede);
        }

        List<ClaseGrupal> clases;
        if (desde != null && hasta != null) {
            clases = claseGrupalRepository.findBySede_IdSedeAndFechaHoraInicioBetween(idSede, desde, hasta);
        } else if (desde != null) {
            clases = claseGrupalRepository.findBySede_IdSedeAndFechaHoraInicioGreaterThanEqual(idSede, desde);
        } else if (hasta != null) {
            clases = claseGrupalRepository.findBySede_IdSedeAndFechaHoraInicioLessThanEqual(idSede, hasta);
        } else {
            clases = claseGrupalRepository.findBySede_IdSede(idSede);
        }

        for (ClaseGrupal c : clases) {
            long reservasConfirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(c.getIdClase(), EstadoReservaClase.CONFIRMADA);
            c.setCupoDisponible(Math.max(0, (int) (c.getCupoMaximo() - reservasConfirmadas)));
        }

        return clases;
    }
}
