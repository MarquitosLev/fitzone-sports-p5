package com.fitzone.modulo.clases.repository;

import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.modulo.clases.models.ReservaClase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservaClaseRepository extends JpaRepository<ReservaClase, Long> {

    // Reservas de una clase específica
    List<ReservaClase> findByClase_IdClase(Long idClase);

    // Contar reservas de una clase filtradas por estado (ej: CONFIRMADA)
    long countByClase_IdClaseAndEstado(Long idClase, EstadoReservaClase estado);

    // Reservas de un usuario
    List<ReservaClase> findByUsuario_IdUsuario(Long idUsuario);

    // Inscriptos de una clase por estado (ej: CONFIRMADA)
    List<ReservaClase> findByClase_IdClaseAndEstado(Long idClase, EstadoReservaClase estado);

    // Valida si un socio ya posee una reserva en un estado específico
    boolean existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(Long idClase, Long idUsuario, EstadoReservaClase estado);
}
