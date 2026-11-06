package com.fitzone.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.ServicioExternoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class SupabaseAuthClientTest {

    private MockRestServiceServer mockServer;
    private SupabaseAuthClient client;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        client = new SupabaseAuthClient(
                builder,
                objectMapper,
                "https://test.supabase.co",
                "test-service-key",
                "http://localhost:5173",
                true,
                false
        );
    }

    @Test
    @DisplayName("invitarUsuario envía POST a /invite con apikey, Bearer y retorna UUID de la cuenta")
    void invitarUsuario_exitoso() {
        UUID expectedId = UUID.randomUUID();
        String jsonResponse = "{\"id\":\"" + expectedId + "\",\"email\":\"socio@fitzone.com\"}";

        mockServer.expect(requestTo("https://test.supabase.co/auth/v1/invite?redirect_to=http://localhost:5173"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("apikey", "test-service-key"))
                .andExpect(header("Authorization", "Bearer test-service-key"))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        UUID actualId = client.invitarUsuario("socio@fitzone.com", Map.of("nombre", "Juan"));

        assertThat(actualId).isEqualTo(expectedId);
        mockServer.verify();
    }

    @Test
    @DisplayName("crearUsuarioConfirmado envía POST a /admin/users y retorna UUID")
    void crearUsuarioConfirmado_exitoso() {
        UUID expectedId = UUID.randomUUID();
        String jsonResponse = "{\"id\":\"" + expectedId + "\",\"email\":\"recep@fitzone.com\"}";

        mockServer.expect(requestTo("https://test.supabase.co/auth/v1/admin/users"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("apikey", "test-service-key"))
                .andExpect(header("Authorization", "Bearer test-service-key"))
                .andRespond(withSuccess(jsonResponse, MediaType.APPLICATION_JSON));

        UUID actualId = client.crearUsuarioConfirmado("recep@fitzone.com", "Password123!", Map.of("tipo", "RECEPCIONISTA"));

        assertThat(actualId).isEqualTo(expectedId);
        mockServer.verify();
    }

    @Test
    @DisplayName("actualizarEmail envía PUT a /admin/users/{id} con email_confirm")
    void actualizarEmail_exitoso() {
        UUID authId = UUID.randomUUID();

        mockServer.expect(requestTo("https://test.supabase.co/auth/v1/admin/users/" + authId))
                .andExpect(method(HttpMethod.PUT))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        client.actualizarEmail(authId, "nuevo@fitzone.com");

        mockServer.verify();
    }

    @Test
    @DisplayName("eliminarUsuario envía DELETE a /admin/users/{id}")
    void eliminarUsuario_exitoso() {
        UUID authId = UUID.randomUUID();

        mockServer.expect(requestTo("https://test.supabase.co/auth/v1/admin/users/" + authId))
                .andExpect(method(HttpMethod.DELETE))
                .andRespond(withSuccess());

        client.eliminarUsuario(authId);

        mockServer.verify();
    }

    @Test
    @DisplayName("Error con código email_exists se traduce a ConflictoException")
    void traducirError_emailExiste() {
        String errorJson = "{\"code\":422,\"error_code\":\"email_exists\",\"msg\":\"A user with this email address has already been registered\"}";

        mockServer.expect(requestTo("https://test.supabase.co/auth/v1/invite?redirect_to=http://localhost:5173"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withBadRequest().body(errorJson).contentType(MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.invitarUsuario("duplicado@fitzone.com", Map.of()))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("Ya existe una cuenta registrada con ese email");

        mockServer.verify();
    }

    @Test
    @DisplayName("Error 500 de Supabase se traduce a ServicioExternoException (502)")
    void traducirError_servidorSupabaseCaido() {
        mockServer.expect(requestTo("https://test.supabase.co/auth/v1/invite?redirect_to=http://localhost:5173"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        assertThatThrownBy(() -> client.invitarUsuario("test@fitzone.com", Map.of()))
                .isInstanceOf(ServicioExternoException.class)
                .hasMessageContaining("Supabase Auth rechazó la operación");

        mockServer.verify();
    }
}
