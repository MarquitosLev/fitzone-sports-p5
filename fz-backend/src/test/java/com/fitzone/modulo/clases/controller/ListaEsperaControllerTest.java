package com.fitzone.modulo.clases.controller;

import com.fitzone.core.config.WebConfig;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.clases.service.ListaEsperaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ListaEsperaController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class ListaEsperaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ListaEsperaService listaEsperaService;

    @Test
    @DisplayName("DELETE /v1/lista-espera/{id} responde 204 No Content cuando sale exitosamente")
    void salir_retorna204() throws Exception {
        doNothing().when(listaEsperaService).salir(1L);

        mockMvc.perform(delete("/v1/lista-espera/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /v1/lista-espera/{id} responde 404 NOT_FOUND cuando el ID no existe")
    void salir_inexistente_retorna404() throws Exception {
        doThrow(new RecursoNoEncontradoException("Inscripción en lista de espera", 99L))
                .when(listaEsperaService).salir(99L);

        mockMvc.perform(delete("/v1/lista-espera/99"))
                .andExpect(status().isNotFound());
    }
}
