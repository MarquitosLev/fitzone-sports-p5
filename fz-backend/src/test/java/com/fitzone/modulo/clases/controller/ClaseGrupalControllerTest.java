package com.fitzone.modulo.clases.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.exception.ClaseCompletaException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.clases.models.ReservaClaseRequest;
import com.fitzone.modulo.clases.service.ClaseGrupalService;
import com.fitzone.modulo.clases.service.ReservaClaseService;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ClaseGrupalController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class ClaseGrupalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ClaseGrupalService claseGrupalService;

    @MockitoBean
    private ReservaClaseService reservaClaseService;

    @Test
    @DisplayName("POST /v1/clases/{id}/reservas responde 201 Created cuando la reserva es exitosa")
    void reservar_retorna201() throws Exception {
        ReservaClaseRequest request = new ReservaClaseRequest(1L);
        ReservaClase reserva = ReservaClase.builder()
                .idReservaClase(5L)
                .clase(ClaseGrupal.builder().idClase(10L).build())
                .usuario(Usuario.builder().idUsuario(1L).build())
                .estado(EstadoReservaClase.CONFIRMADA)
                .build();

        when(reservaClaseService.reservar(10L, 1L)).thenReturn(reserva);

        mockMvc.perform(post("/v1/clases/10/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idReservaClase", is(5)))
                .andExpect(jsonPath("$.estado", is("CONFIRMADA")));
    }

    @Test
    @DisplayName("POST /v1/clases/{id}/reservas responde 400 Bad Request cuando el body es inválido")
    void reservar_bodyInvalido_retorna400() throws Exception {
        ReservaClaseRequest requestInvalido = new ReservaClaseRequest(null);

        mockMvc.perform(post("/v1/clases/10/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("VALIDACION")));
    }

    @Test
    @DisplayName("POST /v1/clases/{id}/reservas responde 409 con CLASE_COMPLETA cuando no hay cupo")
    void reservar_sinCupo_retorna409ClaseCompleta() throws Exception {
        ReservaClaseRequest request = new ReservaClaseRequest(1L);
        when(reservaClaseService.reservar(eq(10L), eq(1L)))
                .thenThrow(new ClaseCompletaException("No hay cupo disponible en la clase"));

        mockMvc.perform(post("/v1/clases/10/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo", is("CLASE_COMPLETA")));
    }

    @Test
    @DisplayName("POST /v1/clases/{id}/reservas responde 409 CONFLICTO cuando el socio ya tiene reserva confirmada")
    void reservar_duplicada_retorna409() throws Exception {
        ReservaClaseRequest request = new ReservaClaseRequest(1L);
        when(reservaClaseService.reservar(eq(10L), eq(1L)))
                .thenThrow(new ConflictoException("El socio ya posee una reserva confirmada"));

        mockMvc.perform(post("/v1/clases/10/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo", is("CONFLICTO")));
    }

    @Test
    @DisplayName("GET /v1/clases/{id}/reservas responde 200 OK con los socios inscriptos")
    void listarInscriptos_retorna200() throws Exception {
        ReservaClase reserva = ReservaClase.builder()
                .idReservaClase(5L)
                .estado(EstadoReservaClase.CONFIRMADA)
                .build();

        when(reservaClaseService.listarInscriptos(10L)).thenReturn(List.of(reserva));

        mockMvc.perform(get("/v1/clases/10/reservas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].idReservaClase", is(5)));
    }
}
