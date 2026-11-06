package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.AforoSede;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SedeService {

    private final SedeRepository sedeRepository;
    private final AccesoRepository accesoRepository;
    private final AccesoService accesoService;

    @Transactional(readOnly = true)
    public List<Sede> listar() {
        return sedeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Sede obtenerPorId(Long id) {
        return sedeRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", id));
    }

    @Transactional
    public Sede crear(Sede sede) {
        if (sede.getAforoMaximo() == null || sede.getAforoMaximo() <= 0) {
            throw new ReglaNegocioException("El aforo máximo debe ser mayor a 0");
        }
        if (sedeRepository.existsByNombreIgnoreCase(sede.getNombre())) {
            throw new ConflictoException("Ya existe una sede con el nombre '" + sede.getNombre() + "'");
        }
        sede.setIdSede(null);
        return sedeRepository.save(sede);
    }

    @Transactional
    public Sede actualizar(Long id, Sede datos) {
        Long idSedeEfectiva = accesoService.resolverYValidarSedeOperador(id);
        Sede existente = sedeRepository.findByIdWithLock(idSedeEfectiva)
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", idSedeEfectiva));

        if (datos.getAforoMaximo() == null || datos.getAforoMaximo() <= 0) {
            throw new ReglaNegocioException("El aforo máximo debe ser mayor a 0");
        }

        int aforoActual = (int) accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(idSedeEfectiva);
        if (datos.getAforoMaximo() < aforoActual) {
            throw new ReglaNegocioException("El aforo máximo (" + datos.getAforoMaximo()
                    + ") no se puede bajar por debajo del aforo actual (" + aforoActual + ")");
        }

        if (sedeRepository.existsByNombreIgnoreCaseAndIdSedeNot(datos.getNombre(), idSedeEfectiva)) {
            throw new ConflictoException("Ya existe otra sede con el nombre '" + datos.getNombre() + "'");
        }

        existente.setNombre(datos.getNombre());
        existente.setAforoMaximo(datos.getAforoMaximo());
        return sedeRepository.save(existente);
    }

    @Transactional(readOnly = true)
    public AforoSede obtenerAforo(Long id) {
        Long idSedeEfectiva = accesoService.resolverYValidarSedeOperador(id);
        Sede sede = obtenerPorId(idSedeEfectiva);
        int aforoActual = (int) accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(idSedeEfectiva);
        int aforoMaximo = sede.getAforoMaximo();
        double porcentaje = aforoMaximo > 0
                ? Math.round(((double) aforoActual / aforoMaximo * 100.0) * 100.0) / 100.0
                : 0.0;
        return new AforoSede(aforoActual, aforoMaximo, porcentaje);
    }

    @Transactional(readOnly = true)
    public List<Acceso> listarAccesosActivos(Long id) {
        Long idSedeEfectiva = accesoService.resolverYValidarSedeOperador(id);
        // Validar que la sede existe (lanza 404 si no existe)
        obtenerPorId(idSedeEfectiva);
        // Aislamiento por sede: nunca devolver datos de otra sede
        return accesoRepository.findBySede_IdSedeAndFechaHoraEgresoIsNull(idSedeEfectiva);
    }
}
