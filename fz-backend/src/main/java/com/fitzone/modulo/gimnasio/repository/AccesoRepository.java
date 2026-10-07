package com.fitzone.modulo.gimnasio.repository;

import com.fitzone.modulo.gimnasio.models.Acceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccesoRepository extends JpaRepository<Acceso, Long> {

    // Buscar si un usuario tiene un acceso activo (ingresó pero no egresó )
    Optional<Acceso> findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(Long idUsuario);

    // Listar accesos activos en una sede (para cálculo de aforo en tiempo real)
    List<Acceso> findBySede_IdSedeAndFechaHoraEgresoIsNull(Long idSede);

    // Listar historial de accesos de un usuario ordenado por fecha de ingreso descendente
    List<Acceso> findByUsuario_IdUsuarioOrderByFechaHoraIngresoDesc(Long idUsuario);
}
