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

    // Verifica si el socio ya tiene membresía vigente en estados específicos (ej: ACTIVO o SUSPENDIDO) que no hayan vencido aún
    boolean existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(Long idUsuario, List<EstadoMembresia> estados, LocalDate fecha);

    // Obtener membresía vigente (ACTIVO o SUSPENDIDO) de un socio cuya fecha de vencimiento sea hoy o posterior
    @EntityGraph(attributePaths = {"usuario", "plan"})
    Optional<Membresia> findFirstByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqualOrderByFechaVencimientoDesc(
            Long idUsuario, List<EstadoMembresia> estados, LocalDate fecha);

    // Obtener la membresía más reciente de un socio independientemente del estado
    @EntityGraph(attributePaths = {"usuario", "plan"})
    Optional<Membresia> findFirstByUsuario_IdUsuarioOrderByFechaVencimientoDesc(Long idUsuario);

    // Tarea programada diaria: membresías ACTIVAS o SUSPENDIDAS vencidas antes de una fecha
    @EntityGraph(attributePaths = {"usuario", "plan"})
    List<Membresia> findByEstadoInAndFechaVencimientoBefore(List<EstadoMembresia> estados, LocalDate fecha);
}