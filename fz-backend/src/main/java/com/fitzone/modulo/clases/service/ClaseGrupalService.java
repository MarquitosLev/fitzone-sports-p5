package com.fitzone.modulo.clases.service;

import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.ListaEspera;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.clases.repository.ListaEsperaRepository;
import com.fitzone.modulo.clases.repository.ReservaClaseRepository;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaseGrupalService {

    private final ClaseGrupalRepository claseGrupalRepository;
    private final ReservaClaseRepository reservaClaseRepository;
    private final ListaEsperaRepository listaEsperaRepository;
    private final SedeRepository sedeRepository;
    private final AccesoRepository accesoRepository;
    private final UsuarioActual usuarioActual;

    @Transactional
    public ClaseGrupal crear(ClaseGrupal clase) {
        Long idSede = clase.getSede() != null ? clase.getSede().getIdSede() : null;
        if (idSede == null) {
            throw new ReglaNegocioException("La sede es obligatoria");
        }
        usuarioActual.validarSede(idSede);
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
        // Mismo bloqueo que reservar: bajar el cupo mientras alguien reserva terminaría en sobreventa
        ClaseGrupal existente = claseGrupalRepository.findByIdWithLock(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", id));
        usuarioActual.validarSede(existente.getSede().getIdSede());

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
            usuarioActual.validarSede(nuevoIdSede);
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
        ClaseGrupal clase = claseGrupalRepository.findByIdWithLock(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", id));
        usuarioActual.validarSede(clase.getSede().getIdSede());

        long reservasVigentes = reservaClaseRepository.countByClase_IdClaseAndEstadoNot(id, EstadoReservaClase.CANCELADA);
        if (reservasVigentes > 0) {
            throw new ConflictoException("No se puede eliminar la clase porque tiene " + reservasVigentes
                    + " reserva(s) confirmada(s) o con asistencia registrada");
        }
        if (accesoRepository.existsByReservaClase_Clase_IdClase(id)) {
            throw new ConflictoException("No se puede eliminar la clase porque tiene accesos registrados");
        }

        // Sin esto las claves foráneas de la cola y de las reservas canceladas impiden la baja
        listaEsperaRepository.deleteByClase_IdClase(id);
        reservaClaseRepository.deleteByClase_IdClaseAndEstado(id, EstadoReservaClase.CANCELADA);
        claseGrupalRepository.delete(clase);
    }

    @Transactional(readOnly = true)
    public ClaseGrupal obtenerPorId(Long id) {
        ClaseGrupal clase = claseGrupalRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", id));
        Usuario usuario = usuarioActual.obtener();
        usuarioActual.validarSede(usuario, clase.getSede().getIdSede());

        long reservasConfirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(id, EstadoReservaClase.CONFIRMADA);
        clase.setCupoDisponible(Math.max(0, (int) (clase.getCupoMaximo() - reservasConfirmadas)));
        completarEstadoDelSocio(usuario, List.of(clase));
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
        Usuario usuario = usuarioActual.obtener();
        usuarioActual.validarSede(usuario, idSede);

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

        List<Long> idsClases = clases.stream().map(ClaseGrupal::getIdClase).toList();
        Map<Long, Long> reservasConfirmadas = reservaClaseRepository.contarPorClases(idsClases, EstadoReservaClase.CONFIRMADA).stream()
                .collect(Collectors.toMap(fila -> (Long) fila[0], fila -> (Long) fila[1]));
        for (ClaseGrupal c : clases) {
            c.setCupoDisponible(Math.max(0, (int) (c.getCupoMaximo() - reservasConfirmadas.getOrDefault(c.getIdClase(), 0L))));
        }

        completarEstadoDelSocio(usuario, clases);
        return clases;
    }

    private void completarEstadoDelSocio(Usuario usuario, List<ClaseGrupal> clases) {
        if (usuario.getTipoUsuario() != TipoUsuario.SOCIO) {
            return;
        }

        Set<Long> clasesReservadas = reservaClaseRepository
                .findByUsuario_IdUsuarioAndEstado(usuario.getIdUsuario(), EstadoReservaClase.CONFIRMADA).stream()
                .map(reserva -> reserva.getClase().getIdClase())
                .collect(Collectors.toSet());
        Map<Long, Integer> posicionesEnEspera = listaEsperaRepository.findByUsuario_IdUsuario(usuario.getIdUsuario()).stream()
                .collect(Collectors.toMap(espera -> espera.getClase().getIdClase(), ListaEspera::getOrdenPosicion, Math::min));

        for (ClaseGrupal clase : clases) {
            clase.setYaReservada(clasesReservadas.contains(clase.getIdClase()));
            clase.setPosicionEspera(posicionesEnEspera.get(clase.getIdClase()));
        }
    }
}
