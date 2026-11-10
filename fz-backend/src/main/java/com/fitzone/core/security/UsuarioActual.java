package com.fitzone.core.security;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Resuelve el usuario logueado a partir del claim 'sub' del JWT, para que los servicios
 * no dependan de un id que venga en el request (SCRUM-91).
 * La vinculacion de auth_id la gestiona JwtAuthConverter en el momento de autenticar.
 */
@Component
@RequiredArgsConstructor
public class UsuarioActual {

    private static final String USUARIO_NO_REGISTRADO = "La sesión no corresponde a un usuario registrado";

    private final UsuarioRepository usuarioRepository;

    public Usuario obtener() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new AccesoNoAutorizadoException("Debe iniciar sesión para realizar esta operación");
        }
        UUID authId = authIdDe(jwt);
        return usuarioRepository.findByAuthId(authId)
                .orElseThrow(() -> new AccesoNoAutorizadoException(USUARIO_NO_REGISTRADO));
    }

    /**
     * Para endpoints públicos que cambian su respuesta si hay sesión (ej: cotización de canchas con
     * descuento de socio). Sin sesión, o con un token que no corresponde a un usuario registrado, devuelve vacío.
     */
    public Optional<Usuario> obtenerOpcional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt) || jwt.getSubject() == null) {
            return Optional.empty();
        }
        try {
            UUID authId = UUID.fromString(jwt.getSubject());
            return usuarioRepository.findByAuthId(authId);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public void validarSede(Long idSede) {
        validarSede(obtener(), idSede);
    }

    /**
     * El personal solo opera sobre su sede asignada. Las excepciones son el gerente sin sede, que es global,
     * y los socios, que acceden a cualquier sede (RF-03).
     */
    public void validarSede(Usuario usuario, Long idSede) {
        boolean esSocio = usuario.getTipoUsuario() == TipoUsuario.SOCIO;
        boolean esGerenteGlobal = usuario.getTipoUsuario() == TipoUsuario.GERENTE && usuario.getIdSede() == null;
        if (!esSocio && !esGerenteGlobal && !idSede.equals(usuario.getIdSede())) {
            throw new AccesoDenegadoException("No tiene permisos para operar sobre una sede distinta a la asignada");
        }
    }

    private UUID authIdDe(Jwt jwt) {
        String subject = jwt.getSubject();
        if (subject == null) {
            throw new AccesoNoAutorizadoException(USUARIO_NO_REGISTRADO);
        }
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException e) {
            throw new AccesoNoAutorizadoException(USUARIO_NO_REGISTRADO);
        }
    }
}
