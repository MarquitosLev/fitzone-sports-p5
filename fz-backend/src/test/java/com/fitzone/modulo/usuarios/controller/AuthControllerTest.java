package com.fitzone.modulo.usuarios.controller;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import com.fitzone.core.security.SupabaseAuthClient;
import com.fitzone.modulo.usuarios.models.AuthResponse;
import com.fitzone.modulo.usuarios.models.LoginRequest;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private static final UUID AUTH_ID_SUPABASE = UUID.fromString("11111111-2222-3333-4444-555555555555");
    private static final UUID AUTH_ID_PREVIO   = UUID.fromString("99999999-8888-7777-6666-555555555555");
    private static final String EMAIL          = "socio@fitzone.com";
    private static final String PASSWORD       = "password123";
    private static final String ACCESS_TOKEN   = "jwt-token-real";

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private SupabaseAuthClient supabaseAuthClient;

    @InjectMocks
    private AuthController authController;

    @Test
    @DisplayName("login vincula authId al usuario semilla con authId null (primer login TOFU)")
    void login_actualizaAuthIdProvisorio() {
        LoginRequest request = new LoginRequest();
        request.setEmail(EMAIL);
        request.setPassword(PASSWORD);

        SupabaseAuthClient.SesionSupabase sesion = new SupabaseAuthClient.SesionSupabase(ACCESS_TOKEN, AUTH_ID_SUPABASE);
        when(supabaseAuthClient.iniciarSesion(EMAIL, PASSWORD)).thenReturn(sesion);

        Usuario usuarioSeedSinVincular = Usuario.builder()
                .idUsuario(3L)
                .email(EMAIL)
                .authId(null)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioRepository.findByAuthId(AUTH_ID_SUPABASE)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(usuarioSeedSinVincular));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authController.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo(ACCESS_TOKEN);
        assertThat(response.getUsuario().getAuthId()).isEqualTo(AUTH_ID_SUPABASE);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().getAuthId()).isEqualTo(AUTH_ID_SUPABASE);
    }

    @Test
    @DisplayName("login con authId ya sincronizado no re-guarda el usuario")
    void login_authIdYaSincronizado_noGuarda() {
        LoginRequest request = new LoginRequest();
        request.setEmail(EMAIL);
        request.setPassword(PASSWORD);

        SupabaseAuthClient.SesionSupabase sesion = new SupabaseAuthClient.SesionSupabase(ACCESS_TOKEN, AUTH_ID_SUPABASE);
        when(supabaseAuthClient.iniciarSesion(EMAIL, PASSWORD)).thenReturn(sesion);

        Usuario usuarioVinculado = Usuario.builder()
                .idUsuario(3L)
                .email(EMAIL)
                .authId(AUTH_ID_SUPABASE)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioRepository.findByAuthId(AUTH_ID_SUPABASE)).thenReturn(Optional.of(usuarioVinculado));

        AuthResponse response = authController.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo(ACCESS_TOKEN);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("seguridad TOFU: usuario encontrado por email que ya tiene otro authId lanza 401")
    void login_usuarioYaVinculadoAOtroAuthId_lanza401() {
        LoginRequest request = new LoginRequest();
        request.setEmail(EMAIL);
        request.setPassword(PASSWORD);

        SupabaseAuthClient.SesionSupabase sesion = new SupabaseAuthClient.SesionSupabase(ACCESS_TOKEN, AUTH_ID_SUPABASE);
        when(supabaseAuthClient.iniciarSesion(EMAIL, PASSWORD)).thenReturn(sesion);

        Usuario usuarioConOtroAuthId = Usuario.builder()
                .idUsuario(3L)
                .email(EMAIL)
                .authId(AUTH_ID_PREVIO)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioRepository.findByAuthId(AUTH_ID_SUPABASE)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(usuarioConOtroAuthId));

        assertThatThrownBy(() -> authController.login(request))
                .isInstanceOf(AccesoNoAutorizadoException.class)
                .hasMessageContaining("Credenciales inválidas");

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("usuario EXTERNO no puede iniciar sesion y lanza 401 explicativo")
    void login_usuarioExterno_lanza401() {
        String emailExterno = "externo@fitzone.com";
        LoginRequest request = new LoginRequest();
        request.setEmail(emailExterno);
        request.setPassword(PASSWORD);

        SupabaseAuthClient.SesionSupabase sesion = new SupabaseAuthClient.SesionSupabase(ACCESS_TOKEN, AUTH_ID_SUPABASE);
        when(supabaseAuthClient.iniciarSesion(emailExterno, PASSWORD)).thenReturn(sesion);

        Usuario usuarioExterno = Usuario.builder()
                .idUsuario(4L)
                .email(emailExterno)
                .authId(null)
                .tipoUsuario(TipoUsuario.EXTERNO)
                .build();

        when(usuarioRepository.findByAuthId(AUTH_ID_SUPABASE)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(emailExterno)).thenReturn(Optional.of(usuarioExterno));

        assertThatThrownBy(() -> authController.login(request))
                .isInstanceOf(AccesoNoAutorizadoException.class)
                .hasMessageContaining("Los clientes sin cuenta no inician sesión");

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("login con credenciales validas en Supabase pero sin usuario local lanza 401")
    void login_usuarioNoExisteEnBD_lanza401() {
        LoginRequest request = new LoginRequest();
        request.setEmail(EMAIL);
        request.setPassword(PASSWORD);

        SupabaseAuthClient.SesionSupabase sesion = new SupabaseAuthClient.SesionSupabase(ACCESS_TOKEN, AUTH_ID_SUPABASE);
        when(supabaseAuthClient.iniciarSesion(EMAIL, PASSWORD)).thenReturn(sesion);

        when(usuarioRepository.findByAuthId(AUTH_ID_SUPABASE)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authController.login(request))
                .isInstanceOf(AccesoNoAutorizadoException.class);
    }

    @Test
    @DisplayName("logout no realiza acciones en el servidor")
    void logout_noLanzaExcepcion() {
        authController.logout();
    }
}
