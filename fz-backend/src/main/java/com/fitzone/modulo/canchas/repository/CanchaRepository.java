package com.fitzone.modulo.canchas.repository;

import com.fitzone.modulo.canchas.models.Cancha;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanchaRepository extends JpaRepository<Cancha, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Cancha c WHERE c.idCancha = :id")
    Optional<Cancha> findByIdForUpdate(@Param("id") Long id);

    // Una sede tiene varias canchas
    List<Cancha> findBySede_IdSede(Long idSede);

    List<Cancha> findBySede_IdSedeAndTipoIgnoreCase(Long idSede, String tipo);

    boolean existsBySede_IdSedeAndNombreIgnoreCase(Long idSede, String nombre);

    boolean existsBySede_IdSedeAndNombreIgnoreCaseAndIdCanchaNot(Long idSede, String nombre, Long idCancha);

    Optional<Cancha> findByNombre(String nombre);

    List<Cancha> findByEnMantenimiento(Boolean enMantenimiento);
}
