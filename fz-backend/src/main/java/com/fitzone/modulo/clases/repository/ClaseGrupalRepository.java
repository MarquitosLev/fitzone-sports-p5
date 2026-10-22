package com.fitzone.modulo.clases.repository;

import com.fitzone.modulo.clases.models.ClaseGrupal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClaseGrupalRepository extends JpaRepository<ClaseGrupal, Long> {

    // Clases grupales de una sede específica
    List<ClaseGrupal> findBySede_IdSede(Long idSede);

    // Agenda de clases de una sede en un rango de fechas (ej: agenda semanal)
    List<ClaseGrupal> findBySede_IdSedeAndFechaHoraInicioBetween(Long idSede, LocalDateTime inicio, LocalDateTime fin);

    // Agenda de clases a partir de una fecha determinada
    List<ClaseGrupal> findBySede_IdSedeAndFechaHoraInicioGreaterThanEqual(Long idSede, LocalDateTime desde);

    // Agenda de clases hasta una fecha determinada
    List<ClaseGrupal> findBySede_IdSedeAndFechaHoraInicioLessThanEqual(Long idSede, LocalDateTime hasta);

    // Búsqueda con bloqueo pesimista para concurrencia en reserva de cupo
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT c FROM ClaseGrupal c WHERE c.idClase = :id")
    java.util.Optional<ClaseGrupal> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);
}
