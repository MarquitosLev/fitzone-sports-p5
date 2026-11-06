package com.fitzone.modulo.usuarios.controller;

import com.fitzone.core.config.WebConfig;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.service.MembresiaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PlanController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class PlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MembresiaService membresiaService;

    @Test
    @DisplayName("GET /v1/planes retorna 200 y catálogo de planes")
    void listar_retorna200() throws Exception {
        Plan plan = Plan.builder()
                .idPlan(1)
                .nombre("Plan Mensual")
                .precioBase(new BigDecimal("15000.00"))
                .duracionMeses(1)
                .build();

        when(membresiaService.listarPlanes()).thenReturn(List.of(plan));

        mockMvc.perform(get("/v1/planes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombre", is("Plan Mensual")))
                .andExpect(jsonPath("$[0].duracionMeses", is(1)));
    }
}
