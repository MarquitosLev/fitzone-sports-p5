package com.fitzone.modulo.usuarios.repository;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MembresiaRepository extends JpaRepository<Membresia, Long> {

    Membresia findByUsuario(Usuario usuario);

    Membresia findByUsuarioIdUsuario(Long idUsuario);

    List<Membresia> findByEstado(EstadoMembresia estado);

    List<Membresia> findByBetweenFechas(LocalDate fechaInicio, LocalDate fechaVencimiento);

}