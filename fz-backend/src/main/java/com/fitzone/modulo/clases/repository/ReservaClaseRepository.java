package com.fitzone.modulo.clases.repository;

import com.fitzone.modulo.clases.models.ReservaClase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservaClaseRepository extends JpaRepository<ReservaClase, Long> {

    // Reservas de una clase específica
    List<ReservaClase> findByClase_IdClase(Long idClase);

    // Reservas de un usuario
    List<ReservaClase> findByUsuario_IdUsuario(Long idUsuario);
}
