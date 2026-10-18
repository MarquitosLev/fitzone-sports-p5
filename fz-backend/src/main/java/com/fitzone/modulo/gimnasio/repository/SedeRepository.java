package com.fitzone.modulo.gimnasio.repository;

import com.fitzone.modulo.gimnasio.models.Sede;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SedeRepository extends JpaRepository<Sede, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdSedeNot(String nombre, Long idSede);
}
