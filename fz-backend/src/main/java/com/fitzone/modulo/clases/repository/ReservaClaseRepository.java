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

    // Contar reservas de una clase que no están en el estado indicado (ej: todas menos CANCELADA)
    long countByClase_IdClaseAndEstadoNot(Long idClase, EstadoReservaClase estado);

    // Reservas por clase en un estado, en una sola consulta: cada fila es [idClase, cantidad]
    @org.springframework.data.jpa.repository.Query("SELECT r.clase.idClase, COUNT(r) FROM ReservaClase r "
            + "WHERE r.clase.idClase IN :idsClases AND r.estado = :estado GROUP BY r.clase.idClase")
    List<Object[]> contarPorClases(
            @org.springframework.data.repository.query.Param("idsClases") List<Long> idsClases,
            @org.springframework.data.repository.query.Param("estado") EstadoReservaClase estado);

    // Búsqueda con bloqueo pesimista para que dos cancelaciones simultáneas no vean el mismo estado
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT r FROM ReservaClase r WHERE r.idReservaClase = :id")
    java.util.Optional<ReservaClase> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);

    // Reservas de un usuario
    List<ReservaClase> findByUsuario_IdUsuario(Long idUsuario);

    // Reservas de un usuario por estado (ej: CONFIRMADA)
    List<ReservaClase> findByUsuario_IdUsuarioAndEstado(Long idUsuario, EstadoReservaClase estado);

    // Borra las reservas de una clase por estado (ej: CANCELADA, al dar de baja la clase)
    void deleteByClase_IdClaseAndEstado(Long idClase, EstadoReservaClase estado);

    // Inscriptos de una clase por estado (ej: CONFIRMADA), con el usuario para evitar una consulta por fila
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "usuario")
    List<ReservaClase> findByClase_IdClaseAndEstado(Long idClase, EstadoReservaClase estado);

    // Valida si un socio ya posee una reserva en un estado específico
    boolean existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(Long idClase, Long idUsuario, EstadoReservaClase estado);
}
