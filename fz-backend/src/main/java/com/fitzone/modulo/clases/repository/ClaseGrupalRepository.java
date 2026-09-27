package com.fitzone.modulo.clases.repository;

import com.fitzone.modulo.clases.models.ClaseGrupal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClaseGrupalRepository extends JpaRepository<ClaseGrupal, UUID> {

    // Clases grupales de una sede específica
    List<ClaseGrupal> findByIdSede(UUID idSede);

    // Agenda de clases de una sede en un rango de fechas (ej: agenda semanal)
    List<ClaseGrupal> findByIdSedeAndFechaHoraInicioBetween(UUID idSede, LocalDateTime inicio, LocalDateTime fin);
}
