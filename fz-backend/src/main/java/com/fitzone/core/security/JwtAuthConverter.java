package com.fitzone.core.security;

import com.fitzone.core.domain.enums.TipoUsuario;
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
 * si no lo encuentra, hace un fallback TOFU (Trust On First Use) por email para vincular
 * el authId definitivo en el primer login real. Asigna la autoridad 'ROLE_<TIPO_USUARIO>' para RBAC.
 *
 * Flujo de vinculacion automatica (TOFU):
 *   1. Busca por authId (sub del JWT). Ruta rapida para usuarios ya vinculados.
 *   2. Si no existe por authId, busca por email (claim del JWT).
 *   3. Si lo encuentra por email y el usuario tiene auth_id == null y no es EXTERNO,
 *      actualiza su authId con el sub real y guarda (vinculacion TOFU unica).
 *   4. Si el usuario encontrado por email ya tiene un auth_id distinto, rechaza (Account Takeover).
 *   5. EXTERNO nunca se vincula via JWT (es un invitado sin cuenta Supabase).
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

        // Ruta 2: primer login real, TOFU (Trust On First Use)
        // Solo vincula si el usuario tiene auth_id == null y no es EXTERNO
        if (usuarioOpt.isEmpty()) {
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                Optional<Usuario> porEmail = usuarioRepository.findByEmailIgnoreCase(email.trim());
                if (porEmail.isPresent()) {
                    Usuario u = porEmail.get();
                    if (u.getTipoUsuario() == TipoUsuario.EXTERNO) {
                        // EXTERNO es un invitado sin cuenta Supabase: nunca se vincula por JWT
                        log.warn("Intento de vincular usuario EXTERNO '{}' via JWT, rechazado", email);
                    } else if (u.getAuthId() != null && !u.getAuthId().equals(authId)) {
                        // Conflicto: el email ya tiene un auth_id distinto (riesgo de Account Takeover)
                        log.warn("Conflicto de identidad: email '{}' ya tiene authId {} distinto al JWT sub {}; acceso denegado",
                                email, u.getAuthId(), authId);
                    } else if (u.getAuthId() == null) {
                        // TOFU: vincular el auth_id real por primera y única vez
                        log.info("Vinculando authId {} al usuario '{}' por primera vez (TOFU)", authId, email);
                        u.setAuthId(authId);
                        usuarioOpt = Optional.of(usuarioRepository.save(u));
                    } else {
                        // auth_id ya es el mismo (coincidencia exacta), no hacer nada
                        usuarioOpt = porEmail;
                    }
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
