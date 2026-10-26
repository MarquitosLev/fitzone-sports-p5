package com.fitzone.modulo.usuarios.repository;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.modulo.usuarios.models.Usuario;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM Usuario u WHERE u.idUsuario = :id")
    Optional<Usuario> findByIdForUpdate(@Param("id") Long id);

    boolean existsByDni(String dni);

    Optional<Usuario> findByDni(String dni);

    Optional<Usuario> findByAuthId(UUID authId);

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Usuario> findByTipoUsuario(TipoUsuario tipoUsuario);

    List<Usuario> findByDniAndTipoUsuario(String dni, TipoUsuario tipoUsuario);

    List<Usuario> findByIdSede(Long idSede);

    List<Usuario> findByTipoUsuarioAndIdSede(TipoUsuario tipoUsuario, Long idSede);

    Optional<Usuario> findByDniAndIdSede(String dni, Long idSede);

    List<Usuario> findByDniAndTipoUsuarioAndIdSede(String dni, TipoUsuario tipoUsuario, Long idSede);
}

