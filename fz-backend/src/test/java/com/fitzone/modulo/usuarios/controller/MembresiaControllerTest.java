package com.fitzone.modulo.usuarios.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.service.MembresiaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MembresiaController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class MembresiaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MembresiaService membresiaService;

    @Test
    @DisplayName("POST /v1/membresias crea membresía y retorna 201")
    void crear_retorna201() throws Exception {
        Membresia membresiaCreada = Membresia.builder()
                .idMembresia(1L)
                .estado(EstadoMembresia.ACTIVO)
                .fechaInicio(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .build();

        when(membresiaService.crear(any(Membresia.class))).thenReturn(membresiaCreada);

        mockMvc.perform(post("/v1/membresias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idUsuario\": 1, \"idPlan\": 1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idMembresia", is(1)))
                .andExpect(jsonPath("$.estado", is("ACTIVO")));
    }

    @Test
    @DisplayName("POST /v1/membresias/{id}/renovar renueva y retorna 200")
    void renovar_retorna200() throws Exception {
        Membresia renovada = Membresia.builder()
                .idMembresia(1L)
                .estado(EstadoMembresia.ACTIVO)
                .fechaInicio(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusMonths(2))
                .build();

        when(membresiaService.renovar(1L)).thenReturn(renovada);

        mockMvc.perform(post("/v1/membresias/1/renovar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMembresia", is(1)))
                .andExpect(jsonPath("$.estado", is("ACTIVO")));
    }

    @Test
    @DisplayName("PATCH /v1/membresias/{id}/estado actualiza estado y retorna 200")
    void cambiarEstado_retorna200() throws Exception {
        Membresia suspendida = Membresia.builder()
                .idMembresia(1L)
                .estado(EstadoMembresia.SUSPENDIDO)
                .build();

        when(membresiaService.cambiarEstado(eq(1L), eq(EstadoMembresia.SUSPENDIDO))).thenReturn(suspendida);

        mockMvc.perform(patch("/v1/membresias/1/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("estado", "SUSPENDIDO"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMembresia", is(1)))
                .andExpect(jsonPath("$.estado", is("SUSPENDIDO")));
    }
}
