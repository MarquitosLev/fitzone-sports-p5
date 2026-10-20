package com.fitzone.core.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.database.DatabaseQueryService;
import com.fitzone.core.database.dto.ConsultaSqlRequest;
import com.fitzone.core.database.dto.ConsultaSqlResponse;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.core.security.RootKeySecurityService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminDatabaseController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class AdminDatabaseControllerTest {

    private static final String ROOT_KEY = "test-root-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RootKeySecurityService rootKeySecurityService;

    @MockitoBean
    private DatabaseQueryService databaseQueryService;

    @Test
    @DisplayName("Permite ejecutar consulta con Bearer Root Key válida")
    void ejecutaConsultaExitosamente() throws Exception {
        ConsultaSqlRequest request = ConsultaSqlRequest.builder()
                .query("SELECT id, nombre FROM sedes")
                .maxFilas(10)
                .build();

        ConsultaSqlResponse mockResponse = ConsultaSqlResponse.builder()
                .sql("SELECT id, nombre FROM sedes")
                .cantidadFilas(1)
                .tiempoEjecucionMs(5)
                .columnas(List.of("id", "nombre"))
                .filas(List.of(Map.of("id", 1, "nombre", "Sede Central")))
                .build();

        doNothing().when(rootKeySecurityService).validarRootKey("Bearer " + ROOT_KEY);
        when(databaseQueryService.ejecutarConsulta(any(ConsultaSqlRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/admin/database/query")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ROOT_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cantidadFilas").value(1))
                .andExpect(jsonPath("$.columnas[0]").value("id"))
                .andExpect(jsonPath("$.filas[0].nombre").value("Sede Central"));
    }

    @Test
    @DisplayName("Rechaza consulta con 401 si la Root Key es inválida o falta el header")
    void rechazaHeaderInvalido() throws Exception {
        ConsultaSqlRequest request = ConsultaSqlRequest.builder()
                .query("SELECT id FROM usuarios")
                .build();

        doThrow(new AccesoNoAutorizadoException("Root Key inválida o no autorizada."))
                .when(rootKeySecurityService).validarRootKey(any());

        mockMvc.perform(post("/admin/database/query")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo").value("ACCESO_DENEGADO"));
    }

    @Test
    @DisplayName("Rechaza consulta con body vacío o query en blanco")
    void rechazaQueryEnBlanco() throws Exception {
        ConsultaSqlRequest request = ConsultaSqlRequest.builder()
                .query("   ")
                .build();

        doNothing().when(rootKeySecurityService).validarRootKey(any());

        mockMvc.perform(post("/admin/database/query")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ROOT_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("VALIDACION"));
    }
}
