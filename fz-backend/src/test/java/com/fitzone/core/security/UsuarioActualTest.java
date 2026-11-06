package com.fitzone.core.security;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioActualTest {

    private static final UUID AUTH_ID = UUID.fromString("a1b2c3d4-e5f6-7890-abcd-ef1234567890");

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UsuarioActual usuarioActual;

    @AfterEach
    void limpiarSesion() {
        SecurityContextHolder.clearContext();
    }

    private void iniciarSesion(String subject) {
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "ES256").subject(subject).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    private void iniciarSesionComo(TipoUsuario tipo, Long idSede) {
        iniciarSesion(AUTH_ID.toString());
        Usuario usuario = Usuario.builder().idUsuario(1L).tipoUsuario(tipo).idSede(idSede).build();
        when(usuarioRepository.findByAuthId(AUTH_ID)).thenReturn(Optional.of(usuario));
    }

    @Test
    @DisplayName("obtenerOpcional sin sesión devuelve vacío en lugar de lanzar 401")
    void obtenerOpcional_sinSesion_vacio() {
        assertThat(usuarioActual.obtenerOpcional()).isEmpty();
    }

    @Test
    @DisplayName("obtenerOpcional con sub inválido devuelve vacío")
    void obtenerOpcional_subInvalido_vacio() {
        iniciarSesion("no-es-un-uuid");

        assertThat(usuarioActual.obtenerOpcional()).isEmpty();
    }

    @Test
    @DisplayName("obtenerOpcional con sesión devuelve el usuario del token")
    void obtenerOpcional_conSesion_devuelveUsuario() {
        iniciarSesionComo(TipoUsuario.SOCIO, null);

        assertThat(usuarioActual.obtenerOpcional()).get()
                .extracting(Usuario::getIdUsuario).isEqualTo(1L);
    }

    @Test
    @DisplayName("obtener devuelve el usuario vinculado al claim sub del token")
    void obtener_resuelvePorSub() {
        iniciarSesionComo(TipoUsuario.SOCIO, null);

        assertThat(usuarioActual.obtener().getIdUsuario()).isEqualTo(1L);
    }

    @Test
    @DisplayName("obtener sin sesión lanza AccesoNoAutorizadoException (401)")
    void obtener_sinSesion_lanza401() {
        assertThatThrownBy(() -> usuarioActual.obtener())
                .isInstanceOf(AccesoNoAutorizadoException.class);
    }

    @Test
    @DisplayName("obtener con un sub que no es UUID lanza AccesoNoAutorizadoException (401)")
    void obtener_subInvalido_lanza401() {
        iniciarSesion("no-es-un-uuid");

        assertThatThrownBy(() -> usuarioActual.obtener())
                .isInstanceOf(AccesoNoAutorizadoException.class);
    }

    @Test
    @DisplayName("obtener con un token sin claim sub lanza AccesoNoAutorizadoException (401)")
    void obtener_sinSub_lanza401() {
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "ES256").claim("email", "x@fitzone.com").build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

        assertThatThrownBy(() -> usuarioActual.obtener())
                .isInstanceOf(AccesoNoAutorizadoException.class);
    }

    @Test
    @DisplayName("obtener con un token sin usuario registrado lanza AccesoNoAutorizadoException (401)")
    void obtener_usuarioNoRegistrado_lanza401() {
        iniciarSesion(AUTH_ID.toString());
        when(usuarioRepository.findByAuthId(AUTH_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usuarioActual.obtener())
                .isInstanceOf(AccesoNoAutorizadoException.class);
    }

    @Test
    @DisplayName("validarSede rechaza al personal que opera sobre otra sede (403)")
    void validarSede_personalDeOtraSede_lanza403() {
        iniciarSesionComo(TipoUsuario.GERENTE, 1L);

        assertThatThrownBy(() -> usuarioActual.validarSede(2L))
                .isInstanceOf(AccesoDenegadoException.class);
    }

    @Test
    @DisplayName("validarSede acepta al personal en su sede asignada")
    void validarSede_personalDeSuSede_pasa() {
        iniciarSesionComo(TipoUsuario.RECEPCIONISTA, 1L);

        assertThatCode(() -> usuarioActual.validarSede(1L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validarSede acepta a un gerente sin sede asignada en cualquier sede")
    void validarSede_gerenteSinSede_pasa() {
        iniciarSesionComo(TipoUsuario.GERENTE, null);

        assertThatCode(() -> usuarioActual.validarSede(2L)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validarSede rechaza a una recepcionista sin sede asignada (403)")
    void validarSede_recepcionistaSinSede_lanza403() {
        iniciarSesionComo(TipoUsuario.RECEPCIONISTA, null);

        assertThatThrownBy(() -> usuarioActual.validarSede(1L))
                .isInstanceOf(AccesoDenegadoException.class);
    }

    @Test
    @DisplayName("validarSede no limita a los socios (RF-03)")
    void validarSede_socio_pasa() {
        iniciarSesionComo(TipoUsuario.SOCIO, null);

        assertThatCode(() -> usuarioActual.validarSede(2L)).doesNotThrowAnyException();
    }
}
