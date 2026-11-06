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
 * Extrae el claim 'sub' (UUID en Supabase Auth), busca el usuario en la BD
 * y asigna la autoridad 'ROLE_<TIPO_USUARIO>' para autorización RBAC en Spring Security.
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

        try {
            UUID authId = UUID.fromString(sub);
            Optional<Usuario> usuarioOpt = usuarioRepository.findByAuthId(authId);
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                if (usuario.getTipoUsuario() != null) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + usuario.getTipoUsuario().name()));
                }
            } else {
                log.warn("JWT recibido con sub {} pero no se encontró usuario vinculado en la BD", sub);
            }
        } catch (IllegalArgumentException e) {
            log.warn("El claim sub '{}' del JWT no es un UUID válido", sub);
        }

        return authorities;
    }
}
