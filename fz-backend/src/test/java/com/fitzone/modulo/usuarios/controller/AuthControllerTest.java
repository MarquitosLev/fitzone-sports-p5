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
    private static final UUID AUTH_ID_SEED     = UUID.fromString("99999999-8888-7777-6666-555555555555");
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
    @DisplayName("login actualiza authId provisorio del seed con el real devuelto por Supabase")
    void login_actualizaAuthIdProvisorio() {
        LoginRequest request = new LoginRequest();
        request.setEmail(EMAIL);
        request.setPassword(PASSWORD);

        SupabaseAuthClient.SesionSupabase sesion = new SupabaseAuthClient.SesionSupabase(ACCESS_TOKEN, AUTH_ID_SUPABASE);
        when(supabaseAuthClient.iniciarSesion(EMAIL, PASSWORD)).thenReturn(sesion);

        Usuario usuarioSeed = Usuario.builder()
                .idUsuario(3L)
                .email(EMAIL)
                .authId(AUTH_ID_SEED)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioRepository.findByAuthId(AUTH_ID_SUPABASE)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(usuarioSeed));
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

