package com.fitzone.core.security;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios para JwtAuthConverter.
 *
 * Cubre el flujo de vinculacion automatica de authId: cuando el usuario del seed
 * tiene un authId provisorio distinto al sub del JWT real de Supabase, el converter
 * lo encuentra por email, actualiza el authId y asigna el rol correctamente.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthConverterTest {

    private static final UUID AUTH_ID_REAL    = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static final UUID AUTH_ID_SEED    = UUID.fromString("11111111-2222-3333-4444-555555555555");
    private static final String EMAIL_SOCIO   = "socio@fitzone.com";

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private JwtAuthConverter converter;

    private Jwt buildJwt(UUID sub, String email) {
        Jwt.Builder builder = Jwt.withTokenValue("token-de-prueba")
                .header("alg", "RS256")
                .subject(sub.toString());
        if (email != null) {
            builder.claim("email", email);
        }
        return builder.build();
    }

    @BeforeEach
    void resetMocks() {
        // No hay setup global: cada test configura sus propios stubs.
    }

    // ── Ruta 1: authId ya vinculado (caso normal) ──────────────────────────────

    @Test
    @DisplayName("usuario ya vinculado por authId obtiene su rol sin modificar la BD")
    void convert_usuarioVinculadoPorAuthId_asignaRolSinGuardar() {
        Usuario socio = Usuario.builder()
                .idUsuario(3L)
                .authId(AUTH_ID_REAL)
                .email(EMAIL_SOCIO)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioRepository.findByAuthId(AUTH_ID_REAL)).thenReturn(Optional.of(socio));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(buildJwt(AUTH_ID_REAL, EMAIL_SOCIO));

        assertThat(token).isNotNull();
        assertThat(extractRoles(token)).containsExactly("ROLE_SOCIO");
        verify(usuarioRepository, never()).save(any());
    }

    // ── Ruta 2: primer login real, authId del seed distinto al sub del JWT ──────

    @Test
    @DisplayName("primer login real vincula authId por email y asigna el rol correctamente")
    void convert_authIdDesactualizadoPeroEmailCoincide_vinculaYAsignaRol() {
        // El usuario del seed tiene un authId provisorio (AUTH_ID_SEED)
        Usuario socioConAuthIdSeed = Usuario.builder()
                .idUsuario(3L)
                .authId(AUTH_ID_SEED)
                .email(EMAIL_SOCIO)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        // El JWT llega con el sub real de Supabase (AUTH_ID_REAL) y el email del seed
        when(usuarioRepository.findByAuthId(AUTH_ID_REAL)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(EMAIL_SOCIO)).thenReturn(Optional.of(socioConAuthIdSeed));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(buildJwt(AUTH_ID_REAL, EMAIL_SOCIO));

        // El rol se asigna correctamente
        assertThat(token).isNotNull();
        assertThat(extractRoles(token)).containsExactly("ROLE_SOCIO");

        // El authId del usuario se actualiza al UUID real de Supabase
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getAuthId()).isEqualTo(AUTH_ID_REAL);
    }

    @Test
    @DisplayName("primer login de gerente por email vincula authId y asigna ROLE_GERENTE")
    void convert_gerenteVinculadoPorEmail_asignaRolGerente() {
        String emailGerente = "gerente@fitzone.com";
        UUID subReal = UUID.randomUUID();

        Usuario gerente = Usuario.builder()
                .idUsuario(1L)
                .authId(UUID.randomUUID())
                .email(emailGerente)
                .tipoUsuario(TipoUsuario.GERENTE)
                .build();

        when(usuarioRepository.findByAuthId(subReal)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(emailGerente)).thenReturn(Optional.of(gerente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(buildJwt(subReal, emailGerente));

        assertThat(extractRoles(token)).containsExactly("ROLE_GERENTE");
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getAuthId()).isEqualTo(subReal);
    }

    // ── Casos de borde ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("JWT sin sub devuelve token sin authorities")
    void convert_sinSub_sinAuthorities() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .claim("email", EMAIL_SOCIO)
                .build();

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(token).isNotNull();
        assertThat(token.getAuthorities()).isEmpty();
        verify(usuarioRepository, never()).findByAuthId(any());
    }

    @Test
    @DisplayName("sub no-UUID devuelve token sin authorities sin lanzar excepcion")
    void convert_subNoUuid_sinAuthoritiesSinExcepcion() {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "RS256")
                .subject("no-es-un-uuid")
                .build();

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(jwt);

        assertThat(token).isNotNull();
        assertThat(token.getAuthorities()).isEmpty();
    }

    @Test
    @DisplayName("usuario no encontrado por authId ni por email devuelve token sin authorities")
    void convert_usuarioNoRegistrado_sinAuthorities() {
        when(usuarioRepository.findByAuthId(any())).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(buildJwt(AUTH_ID_REAL, EMAIL_SOCIO));

        assertThat(token).isNotNull();
        assertThat(token.getAuthorities()).isEmpty();
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("usuario no encontrado por authId y JWT sin email devuelve token sin authorities")
    void convert_usuarioNoEncontradoYSinEmailEnJwt_sinAuthorities() {
        when(usuarioRepository.findByAuthId(AUTH_ID_REAL)).thenReturn(Optional.empty());

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(buildJwt(AUTH_ID_REAL, null));

        assertThat(token).isNotNull();
        assertThat(token.getAuthorities()).isEmpty();
        verify(usuarioRepository, never()).findByEmailIgnoreCase(any());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("el nombre del principal es el email del JWT cuando esta disponible")
    void convert_principalEsEmailCuandoDisponible() {
        when(usuarioRepository.findByAuthId(AUTH_ID_REAL)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(EMAIL_SOCIO)).thenReturn(Optional.empty());

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(buildJwt(AUTH_ID_REAL, EMAIL_SOCIO));

        assertThat(token.getName()).isEqualTo(EMAIL_SOCIO);
    }

    @Test
    @DisplayName("el nombre del principal cae al sub cuando el JWT no tiene email")
    void convert_principalEsSubCuandoNoHayEmail() {
        when(usuarioRepository.findByAuthId(AUTH_ID_REAL)).thenReturn(Optional.empty());

        JwtAuthenticationToken token = (JwtAuthenticationToken) converter.convert(buildJwt(AUTH_ID_REAL, null));

        assertThat(token.getName()).isEqualTo(AUTH_ID_REAL.toString());
    }

    // ── Helper ──────────────────────────────────────────────────────────────────

    private Collection<String> extractRoles(JwtAuthenticationToken token) {
        return token.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }
}
