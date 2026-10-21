package com.fitzone.modulo.clases.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.clases.service.ReservaClaseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReservaClaseController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class ReservaClaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReservaClaseService reservaClaseService;

    @Test
    @DisplayName("PATCH /v1/reservas-clase/{id}/cancelar responde 200 OK con la reserva CANCELADA")
    void cancelar_retorna200() throws Exception {
        ReservaClase cancelada = ReservaClase.builder()
                .idReservaClase(10L)
                .estado(EstadoReservaClase.CANCELADA)
                .build();

        when(reservaClaseService.cancelar(10L)).thenReturn(cancelada);

        mockMvc.perform(patch("/v1/reservas-clase/10/cancelar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idReservaClase", is(10)))
                .andExpect(jsonPath("$.estado", is("CANCELADA")));
    }

    @Test
    @DisplayName("PATCH /v1/reservas-clase/{id}/cancelar responde 404 cuando la reserva no existe")
    void cancelar_noExiste_retorna404() throws Exception {
        when(reservaClaseService.cancelar(99L))
                .thenThrow(new RecursoNoEncontradoException("Reserva", 99L));

        mockMvc.perform(patch("/v1/reservas-clase/99/cancelar"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo", is("RECURSO_NO_ENCONTRADO")));
    }

    @Test
    @DisplayName("PATCH /v1/reservas-clase/{id}/cancelar responde 422 cuando quedan menos de 2 hs")
    void cancelar_fueraDeVentana_retorna422() throws Exception {
        when(reservaClaseService.cancelar(10L))
                .thenThrow(new ReglaNegocioException("La cancelación solo está permitida hasta 2 horas antes"));

        mockMvc.perform(patch("/v1/reservas-clase/10/cancelar"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.codigo", is("REGLA_NEGOCIO")));
    }
}
