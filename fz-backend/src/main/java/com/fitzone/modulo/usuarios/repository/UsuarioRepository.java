package com.fitzone.modulo.usuarios.repository;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    // Busca el usaurio por el UUID de supabase
    Optional<Usuario> findByAuthId(UUID authId);

    Optional<Usuario> findByDni(String dni);

    Optional<Usuario> findByEmail(String email);

    boolean existsByDni(String dni);

    boolean existsByEmail(String email);

    List<Usuario> findByTipoUsuario(TipoUsuario tipoUsuario);
}
