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

    // Un usuario puede tener varias membresías (renovaciones), por eso devuelven List
    List<Membresia> findByUsuario(Usuario usuario);

    List<Membresia> findByUsuarioIdUsuario(Long idUsuario);

    List<Membresia> findByEstado(EstadoMembresia estado);

    // Membresías cuya fecha de inicio cae dentro del rango [desde, hasta]
    List<Membresia> findByFechaInicioBetween(LocalDate desde, LocalDate hasta);

}