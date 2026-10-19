package com.fitzone.modulo.canchas.repository;

import com.fitzone.modulo.canchas.models.Cancha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanchaRepository extends JpaRepository<Cancha, Long> {

    // Una sede tiene varias canchas
    List<Cancha> findBySede_IdSede(Long idSede);

    List<Cancha> findBySede_IdSedeAndTipoIgnoreCase(Long idSede, String tipo);

    boolean existsBySede_IdSedeAndNombreIgnoreCase(Long idSede, String nombre);

    boolean existsBySede_IdSedeAndNombreIgnoreCaseAndIdCanchaNot(Long idSede, String nombre, Long idCancha);

    Optional<Cancha> findByNombre(String nombre);

    List<Cancha> findByEnMantenimiento(Boolean enMantenimiento);
}
