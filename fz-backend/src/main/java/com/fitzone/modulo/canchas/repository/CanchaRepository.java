package com.fitzone.modulo.canchas.repository;

import com.fitzone.modulo.canchas.models.Cancha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanchaRepository extends JpaRepository<Cancha, Long> {

    Optional<Cancha> findBySede_IdSede(Long idSede);

    Optional<Cancha> findByNombre(String nombre);

    List<Cancha> findByEnMantenimiento(Boolean enMantenimiento);

}
