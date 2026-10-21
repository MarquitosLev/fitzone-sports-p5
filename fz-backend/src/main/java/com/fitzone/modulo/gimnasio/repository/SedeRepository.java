package com.fitzone.modulo.gimnasio.repository;

import com.fitzone.modulo.gimnasio.models.Sede;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SedeRepository extends JpaRepository<Sede, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdSedeNot(String nombre, Long idSede);

    // Búsqueda con bloqueo pesimista para sincronizar aforo y admisiones simultáneas
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT s FROM Sede s WHERE s.idSede = :id")
    java.util.Optional<Sede> findByIdWithLock(@org.springframework.data.repository.query.Param("id") Long id);
}
