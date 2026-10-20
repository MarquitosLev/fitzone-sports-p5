package com.fitzone.core.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.NegocioException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.exception.ServicioExternoException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Cliente de la Admin API de Supabase Auth (GoTrue). Crea, actualiza y elimina cuentas en {@code auth.users}
 * usando la service-role key, que solo vive en el backend (variable de entorno SUPABASE_SERVICE_ROLE_KEY).
 * Guía operativa: docs/GUIA_SUPABASE_USUARIOS.md
 */
@Slf4j
@Component
public class SupabaseAuthClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String serviceRoleKey;
    private final String inviteRedirectUrl;

    /** true: alta por invitación (mail). false: la cuenta se crea confirmada con la contraseña inicial. */
    @Getter
    private final boolean altaPorEmail;

    @Autowired
    public SupabaseAuthClient(RestClient.Builder restClientBuilder,
                              ObjectMapper objectMapper,
                              @Value("${fitzone.supabase.url}") String supabaseUrl,
                              @Value("${fitzone.supabase.service-role-key:}") String serviceRoleKey,
                              @Value("${fitzone.supabase.invite-redirect-url}") String inviteRedirectUrl,
                              @Value("${fitzone.supabase.alta-por-email:true}") boolean altaPorEmail) {
        this(restClientBuilder, objectMapper, supabaseUrl, serviceRoleKey, inviteRedirectUrl, altaPorEmail, true);
    }

    public SupabaseAuthClient(RestClient.Builder restClientBuilder,
                              ObjectMapper objectMapper,
                              String supabaseUrl,
                              String serviceRoleKey,
                              String inviteRedirectUrl,
                              boolean altaPorEmail,
                              boolean configurarTimeouts) {
        this.objectMapper = objectMapper;
        this.serviceRoleKey = serviceRoleKey;
        this.inviteRedirectUrl = inviteRedirectUrl;
        this.altaPorEmail = altaPorEmail;

        if (configurarTimeouts) {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(Duration.ofSeconds(5));
            requestFactory.setReadTimeout(Duration.ofSeconds(10));
            restClientBuilder.requestFactory(requestFactory);
        }

        this.restClient = restClientBuilder
                .baseUrl(supabaseUrl + "/auth/v1")
                .defaultHeader("apikey", serviceRoleKey)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                .build();
    }

    /** Alta por mail: Supabase crea la cuenta y envía la invitación para que el usuario defina su contraseña. */
    public UUID invitarUsuario(String email, Map<String, Object> datosUsuario) {
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            log.warn("[DEV MODE] SUPABASE_SERVICE_ROLE_KEY no configurada. Simulando respuesta de Supabase Auth con authId mock para {}", email);
            return UUID.randomUUID();
        }
        Map<String, Object> body = Map.of("email", email, "data", datosUsuario);
        JsonNode respuesta = ejecutar(() -> restClient.post()
                .uri(uri -> uri.path("/invite").queryParam("redirect_to", inviteRedirectUrl).build())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (request, response) -> {
                    throw traducirError(response);
                })
                .body(JsonNode.class));
        return leerId(respuesta);
    }

    /** Alta en el sistema (sin mails): la cuenta queda confirmada y lista para loguearse con la contraseña inicial. */
    public UUID crearUsuarioConfirmado(String email, String password, Map<String, Object> datosUsuario) {
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            log.warn("[DEV MODE] SUPABASE_SERVICE_ROLE_KEY no configurada. Simulando creación confirmada con authId mock para {}", email);
            return UUID.randomUUID();
        }
        Map<String, Object> body = Map.of(
                "email", email,
                "password", password,
                "email_confirm", true,
                "user_metadata", datosUsuario);
        JsonNode respuesta = ejecutar(() -> restClient.post()
                .uri("/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (request, response) -> {
                    throw traducirError(response);
                })
                .body(JsonNode.class));
        return leerId(respuesta);
    }

    /** Cambia el email de la cuenta y lo deja confirmado (lo edita personal autorizado, no el propio usuario). */
    public void actualizarEmail(UUID authId, String email) {
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            log.warn("[DEV MODE] SUPABASE_SERVICE_ROLE_KEY no configurada. Simulando actualización de email para authId {}", authId);
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("email_confirm", true);
        ejecutar(() -> restClient.put()
                .uri("/admin/users/{id}", authId)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (request, response) -> {
                    throw traducirError(response);
                })
                .toBodilessEntity());
    }

    /** Elimina la cuenta. Se usa como compensación cuando el alta en la BD falla después de crearla en Supabase. */
    public void eliminarUsuario(UUID authId) {
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            log.warn("[DEV MODE] SUPABASE_SERVICE_ROLE_KEY no configurada. Simulando compensación para authId {}", authId);
            return;
        }
        ejecutar(() -> restClient.delete()
                .uri("/admin/users/{id}", authId)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (request, response) -> {
                    throw traducirError(response);
                })
                .toBodilessEntity());
    }

    private <T> T ejecutar(Supplier<T> llamada) {
        if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
            throw new ServicioExternoException(
                    "Supabase Auth no está configurado: falta la variable SUPABASE_SERVICE_ROLE_KEY");
        }
        try {
            return llamada.get();
        } catch (ResourceAccessException ex) {
            log.error("Supabase Auth no respondió: {}", ex.getMessage());
            throw new ServicioExternoException("No se pudo conectar con Supabase Auth");
        }
    }

    private UUID leerId(JsonNode respuesta) {
        // /invite y /admin/users devuelven el usuario en la raíz; algunas versiones lo anidan en "user"
        JsonNode id = respuesta == null ? null : respuesta.hasNonNull("id") ? respuesta.get("id") : respuesta.at("/user/id");
        if (id == null || id.isMissingNode() || id.asText().isBlank()) {
            throw new ServicioExternoException("Supabase Auth no devolvió el id de la cuenta creada");
        }
        return UUID.fromString(id.asText());
    }

    private NegocioException traducirError(ClientHttpResponse response) throws IOException {
        int status = response.getStatusCode().value();
        String cuerpo = new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
        String codigo = "";
        String mensaje = cuerpo;
        try {
            JsonNode json = objectMapper.readTree(cuerpo);
            codigo = json.path("error_code").asText("");
            mensaje = json.hasNonNull("msg") ? json.get("msg").asText()
                    : json.path("error_description").asText(json.path("message").asText(cuerpo));
        } catch (IOException ignorada) {
            // El cuerpo no es JSON: se usa tal cual en el log
        }

        return switch (codigo) {
            case "email_exists", "user_already_exists" ->
                    new ConflictoException("Ya existe una cuenta registrada con ese email");
            case "weak_password" ->
                    new ReglaNegocioException("La contraseña no cumple la política de Supabase: " + mensaje);
            case "email_address_invalid" ->
                    new ReglaNegocioException("Supabase rechazó el email: " + mensaje);
            case "user_not_found" ->
                    new ServicioExternoException("La cuenta vinculada no existe en Supabase Auth");
            case "over_email_send_rate_limit" ->
                    new ServicioExternoException("Se alcanzó el límite de envío de mails de Supabase. "
                            + "Probá más tarde o desactivá el alta por email (fitzone.supabase.alta-por-email=false)");
            default -> {
                log.error("Error de Supabase Auth (HTTP {}, código '{}'): {}", status, codigo, mensaje);
                yield new ServicioExternoException("Supabase Auth rechazó la operación (HTTP " + status + ")");
            }
        };
    }
}
