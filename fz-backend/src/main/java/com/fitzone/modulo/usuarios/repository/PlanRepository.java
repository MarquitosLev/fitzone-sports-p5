package com.fitzone.modulo.usuarios.repository;

import com.fitzone.modulo.usuarios.models.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Integer> {

    Optional<Plan> findByNombre(String nombre);

    boolean existsByNombre(String nombre);
}
