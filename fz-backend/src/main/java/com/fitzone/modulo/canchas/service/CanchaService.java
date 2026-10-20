package com.fitzone.modulo.canchas.service;

import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.repository.CanchaRepository;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CanchaService {

    private final CanchaRepository canchaRepository;
    private final SedeRepository sedeRepository;

    @Transactional
    public Cancha crear(Cancha cancha) {
        Long idSede = cancha.getSede() != null ? cancha.getSede().getIdSede() : null;
        if (idSede == null) {
            throw new ReglaNegocioException("La sede es obligatoria");
        }
        Sede sede = sedeRepository.findById(idSede)
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", idSede));
        cancha.setSede(sede);

        if (cancha.getPrecioBaseHora() == null || cancha.getPrecioBaseHora().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException("El precio base por hora debe ser mayor a 0");
        }
        if (canchaRepository.existsBySede_IdSedeAndNombreIgnoreCase(idSede, cancha.getNombre())) {
            throw new ConflictoException("Ya existe una cancha con el nombre '" + cancha.getNombre() + "' en la sede seleccionada");
        }

        cancha.setIdCancha(null);
        return canchaRepository.save(cancha);
    }

    @Transactional
    public Cancha actualizar(Long id, Cancha datos) {
        Cancha existente = obtenerPorId(id);

        if (datos.getPrecioBaseHora() == null || datos.getPrecioBaseHora().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException("El precio base por hora debe ser mayor a 0");
        }

        Long idSedeActual = existente.getSede().getIdSede();
        Long nuevoIdSede = datos.getSede() != null ? datos.getSede().getIdSede() : null;
        if (nuevoIdSede != null && !nuevoIdSede.equals(idSedeActual)) {
            Sede nuevaSede = sedeRepository.findById(nuevoIdSede)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Sede", nuevoIdSede));
            existente.setSede(nuevaSede);
            idSedeActual = nuevoIdSede;
        }

        if (canchaRepository.existsBySede_IdSedeAndNombreIgnoreCaseAndIdCanchaNot(idSedeActual, datos.getNombre(), id)) {
            throw new ConflictoException("Ya existe otra cancha con el nombre '" + datos.getNombre() + "' en la sede");
        }

        existente.setNombre(datos.getNombre());
        existente.setTipo(datos.getTipo());
        existente.setPrecioBaseHora(datos.getPrecioBaseHora());
        return canchaRepository.save(existente);
    }

    @Transactional(readOnly = true)
    public Cancha obtenerPorId(Long id) {
        return canchaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cancha", id));
    }

    @Transactional(readOnly = true)
    public List<Cancha> listar(Long idSede, String tipo) {
        if (idSede == null) {
            throw new ReglaNegocioException("El parámetro idSede es obligatorio");
        }
        if (!sedeRepository.existsById(idSede)) {
            throw new RecursoNoEncontradoException("Sede", idSede);
        }
        if (tipo != null && !tipo.isBlank()) {
            return canchaRepository.findBySede_IdSedeAndTipoIgnoreCase(idSede, tipo.trim());
        }
        return canchaRepository.findBySede_IdSede(idSede);
    }

    @Transactional
    public Cancha cambiarMantenimiento(Long id, boolean enMantenimiento) {
        Cancha cancha = obtenerPorId(id);
        cancha.setEnMantenimiento(enMantenimiento);
        return canchaRepository.save(cancha);
    }
}
