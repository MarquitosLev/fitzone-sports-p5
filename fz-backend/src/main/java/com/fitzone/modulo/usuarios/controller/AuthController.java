package com.fitzone.modulo.usuarios.controller;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import com.fitzone.core.security.SupabaseAuthClient;
import com.fitzone.modulo.usuarios.models.AltaSocioRequest;
import com.fitzone.modulo.usuarios.models.AltaSocioResponse;
import com.fitzone.modulo.usuarios.models.AuthResponse;
import com.fitzone.modulo.usuarios.models.LoginRequest;
import com.fitzone.modulo.usuarios.models.ReintentoCuentaRequest;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import com.fitzone.modulo.usuarios.service.AltaSocioService;
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
@Tag(name = "Autenticación", description = "Endpoints de login, alta de socio, sesión y logout")
public class AuthController {

    private static final String CREDENCIALES_INVALIDAS = "Credenciales inválidas. Verifique su correo y contraseña.";
    private static final String ERROR_EXTERNO_LOGIN = "Los clientes sin cuenta no inician sesión. Reservá como invitado o hacete socio.";

    private final UsuarioRepository usuarioRepository;
    private final SupabaseAuthClient supabaseAuthClient;
    private final AltaSocioService altaSocioService;

    @PostMapping("/login")
    @Operation(summary = "Inicio de sesión de usuarios con correo y contraseña")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String emailNormalizado = request.getEmail().trim().toLowerCase();
        SupabaseAuthClient.SesionSupabase sesion = supabaseAuthClient.iniciarSesion(emailNormalizado, request.getPassword());

        // Ruta 1: usuario ya vinculado por authId (caso normal, login recurrente)
        Usuario usuario = usuarioRepository.findByAuthId(sesion.authId())
                .orElseGet(() -> {
                    // Ruta 2: primer login real (TOFU — Trust On First Use)
                    // Solo se vincula si el usuario local tiene auth_id == null y no es EXTERNO
                    Usuario porEmail = usuarioRepository.findByEmailIgnoreCase(emailNormalizado)
                            .orElseThrow(() -> new AccesoNoAutorizadoException(CREDENCIALES_INVALIDAS));

                    // EXTERNO es un invitado sin cuenta Supabase: nunca puede iniciar sesión
                    if (porEmail.getTipoUsuario() == TipoUsuario.EXTERNO) {
                        throw new AccesoNoAutorizadoException(ERROR_EXTERNO_LOGIN);
                    }

                    // Seguridad TOFU: rechazar si ya tiene un auth_id distinto (Account Takeover)
                    if (porEmail.getAuthId() != null) {
                        throw new AccesoNoAutorizadoException(CREDENCIALES_INVALIDAS);
                    }

                    return porEmail;
                });

        // Validación de EXTERNO (cubre el caso de que se encuentre directamente por authId)
        if (usuario.getTipoUsuario() == TipoUsuario.EXTERNO) {
            throw new AccesoNoAutorizadoException(ERROR_EXTERNO_LOGIN);
        }

        // Vincular el authId real de Supabase si el usuario no lo tenía (primer login TOFU)
        if (usuario.getAuthId() == null) {
            usuario.setAuthId(sesion.authId());
            usuario = usuarioRepository.save(usuario);
        }

        return AuthResponse.builder()
                .token(sesion.accessToken())
                .usuario(usuario)
                .build();
    }

    @PostMapping("/alta-socio")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Alta de socio online: la cuenta se crea solo con el pago de la suscripción aprobado",
            description = "Pago rechazado: 422 y no se crea nada. DNI o email de una cuenta: 409 REQUIERE_INICIO_SESION.")
    public AltaSocioResponse altaSocio(@Valid @RequestBody AltaSocioRequest request) {
        return altaSocioService.darDeAlta(request);
    }

    @PostMapping("/alta-socio/reintentar-cuenta")
    @Operation(summary = "Crea la cuenta de un socio que ya pagó y quedó con la cuenta pendiente")
    public AltaSocioResponse reintentarCuenta(@Valid @RequestBody ReintentoCuentaRequest request) {
        return altaSocioService.reintentarCuenta(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Cierre de sesión de la cuenta activa")
    public void logout() {
        // Enfoque stateless: el frontend revoca y limpia la sesión en el cliente
    }
}
