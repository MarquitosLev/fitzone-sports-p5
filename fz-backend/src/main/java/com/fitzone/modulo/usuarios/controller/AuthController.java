package com.fitzone.modulo.usuarios.controller;

import com.fitzone.core.exception.AccesoNoAutorizadoException;
import com.fitzone.core.security.SupabaseAuthClient;
import com.fitzone.modulo.usuarios.models.AuthResponse;
import com.fitzone.modulo.usuarios.models.LoginRequest;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Autenticación", description = "Endpoints de login, sesión y logout")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final SupabaseAuthClient supabaseAuthClient;

    @PostMapping("/login")
    @Operation(summary = "Inicio de sesión de usuarios con correo y contraseña")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String emailNormalizado = request.getEmail().trim().toLowerCase();
        SupabaseAuthClient.SesionSupabase sesion = supabaseAuthClient.iniciarSesion(emailNormalizado, request.getPassword());

        Usuario usuario = usuarioRepository.findByAuthId(sesion.authId())
                .or(() -> usuarioRepository.findByEmail(emailNormalizado))
                .orElseThrow(() -> new AccesoNoAutorizadoException("Credenciales inválidas. Verifique su correo y contraseña."));

        if (!sesion.authId().equals(usuario.getAuthId())) {
            usuario.setAuthId(sesion.authId());
            usuario = usuarioRepository.save(usuario);
        }

        return AuthResponse.builder()
                .token(sesion.accessToken())
                .usuario(usuario)
                .build();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cierre de sesión de la cuenta activa")
    public void logout() {
        // Enfoque stateless: el frontend revoca y limpia la sesión en el cliente
    }
}
