package com.fitzone.modulo.usuarios.repository;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    @EntityGraph(attributePaths = {"usuario", "plan"})
    List<Membresia> findByUsuario(Usuario usuario);

    @EntityGraph(attributePaths = {"usuario", "plan"})
    List<Membresia> findByUsuarioIdUsuario(Long idUsuario);

    @EntityGraph(attributePaths = {"usuario", "plan"})
    List<Membresia> findByEstado(EstadoMembresia estado);

    // Membresías cuya fecha de inicio cae dentro del rango [desde, hasta]
    List<Membresia> findByFechaInicioBetween(LocalDate desde, LocalDate hasta);

    // Verifica si el socio ya tiene membresía en estados específicos (ej: ACTIVO o SUSPENDIDO)
    boolean existsByUsuario_IdUsuarioAndEstadoIn(Long idUsuario, List<EstadoMembresia> estados);

    // Obtener membresía vigente (ACTIVO o SUSPENDIDO) de un socio
    @EntityGraph(attributePaths = {"usuario", "plan"})
    Optional<Membresia> findFirstByUsuario_IdUsuarioAndEstadoInOrderByFechaVencimientoDesc(Long idUsuario, List<EstadoMembresia> estados);

    // Obtener la membresía más reciente de un socio independientemente del estado
    @EntityGraph(attributePaths = {"usuario", "plan"})
    Optional<Membresia> findFirstByUsuario_IdUsuarioOrderByFechaVencimientoDesc(Long idUsuario);

    // Tarea programada diaria: membresías ACTIVAS vencidas antes de hoy
    @EntityGraph(attributePaths = {"usuario", "plan"})
    List<Membresia> findByEstadoAndFechaVencimientoBefore(EstadoMembresia estado, LocalDate fecha);
}