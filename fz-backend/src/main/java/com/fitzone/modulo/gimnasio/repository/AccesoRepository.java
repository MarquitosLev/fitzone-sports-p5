package com.fitzone.modulo.gimnasio.repository;

import com.fitzone.modulo.gimnasio.models.Acceso;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccesoRepository extends JpaRepository<Acceso, Long> {

    // Buscar si un usuario tiene un acceso activo (ingresó pero no egresó )
    Optional<Acceso> findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(Long idUsuario);

    // Listar accesos activos en una sede (para cálculo de aforo en tiempo real y detalle de personas adentro)
    @EntityGraph(attributePaths = {"usuario", "sede"})
    List<Acceso> findBySede_IdSedeAndFechaHoraEgresoIsNull(Long idSede);

    // Listar historial completo de accesos de una sede ordenado por fecha de ingreso descendente
    @EntityGraph(attributePaths = {"usuario", "sede"})
    List<Acceso> findBySede_IdSedeOrderByFechaHoraIngresoDesc(Long idSede);

    // Contar accesos activos de una sede para el aforo actual
    long countBySede_IdSedeAndFechaHoraEgresoIsNull(Long idSede);

    // Listar historial de accesos de un usuario ordenado por fecha de ingreso descendente
    @EntityGraph(attributePaths = {"usuario", "sede"})
    List<Acceso> findByUsuario_IdUsuarioOrderByFechaHoraIngresoDesc(Long idUsuario);

    // Buscar acceso por token QR para garantizar idempotencia y prevenir reutilización
    @EntityGraph(attributePaths = {"usuario", "sede"})
    Optional<Acceso> findByTokenQr(String tokenQr);

    // Búsqueda con bloqueo pesimista para egresos atómicos
    @EntityGraph(attributePaths = {"usuario", "sede"})
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Acceso a WHERE a.idAcceso = :id")
    Optional<Acceso> findByIdWithLock(@Param("id") Long id);
}
