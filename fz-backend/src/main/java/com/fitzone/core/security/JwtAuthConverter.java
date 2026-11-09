package com.fitzone.core.security;

import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Convertidor de autenticación JWT (ADR-002).
 * Extrae el claim 'sub' (UUID de Supabase Auth), busca el usuario en la BD por authId y,
 * si no lo encuentra, hace un fallback por email para vincular el authId definitivo
 * en el primer login real. Asigna la autoridad 'ROLE_<TIPO_USUARIO>' para RBAC.
 *
 * Flujo de vinculacion automatica:
 *   1. Busca por authId (sub del JWT). Ruta rapida para usuarios ya vinculados.
 *   2. Si no existe por authId, busca por email (claim del JWT).
 *   3. Si lo encuentra por email, actualiza su authId con el sub real y guarda.
 *   Este mecanismo permite que los usuarios del seed (con authId provisorio) se vinculen
 *   automaticamente en su primer inicio de sesion real contra Supabase Auth.
 */
@Slf4j
@RequiredArgsConstructor
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UsuarioRepository usuarioRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        String principalClaim = jwt.getClaimAsString("email");
        if (principalClaim == null || principalClaim.isBlank()) {
            principalClaim = jwt.getSubject();
        }
        return new JwtAuthenticationToken(jwt, authorities, principalClaim);
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            return authorities;
        }

        UUID authId;
        try {
            authId = UUID.fromString(sub);
        } catch (IllegalArgumentException e) {
            log.warn("El claim sub '{}' del JWT no es un UUID valido", sub);
            return authorities;
        }

        // Ruta 1: usuario ya vinculado por authId (caso normal post-primer-login)
        Optional<Usuario> usuarioOpt = usuarioRepository.findByAuthId(authId);

        // Ruta 2: primer login real con authId del seed todavia pendiente de vincular
        if (usuarioOpt.isEmpty()) {
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                usuarioOpt = usuarioRepository.findByEmailIgnoreCase(email.trim());
                if (usuarioOpt.isPresent()) {
                    Usuario usuario = usuarioOpt.get();
                    log.info("Vinculando authId {} al usuario '{}' por coincidencia de email (primer login real)",
                            authId, email);
                    usuario.setAuthId(authId);
                    usuarioOpt = Optional.of(usuarioRepository.save(usuario));
                }
            }
        }

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (usuario.getTipoUsuario() != null) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + usuario.getTipoUsuario().name()));
            }
        } else {
            log.warn("JWT recibido con sub {} pero no se encontro usuario vinculado en la BD (ni por authId ni por email)", sub);
        }

        return authorities;
    }
}
