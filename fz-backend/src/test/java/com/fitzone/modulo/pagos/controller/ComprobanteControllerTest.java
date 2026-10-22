package com.fitzone.modulo.pagos.controller;

import com.fitzone.core.config.WebConfig;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.service.ComprobanteService;
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

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ComprobanteController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class ComprobanteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ComprobanteService comprobanteService;

    @Test
    @DisplayName("GET /v1/comprobantes/{id}/pdf retorna 200 con application/pdf y contenido binario")
    void descargarPdf_retorna200() throws Exception {
        byte[] pdfFake = "%PDF-1.4 fake content".getBytes();
        Comprobante comprobante = Comprobante.builder()
                .idComprobante(10L)
                .numeroFactura("0001-00000010")
                .build();

        when(comprobanteService.obtenerPorId(10L)).thenReturn(comprobante);
        when(comprobanteService.generarPdf(10L)).thenReturn(pdfFake);

        mockMvc.perform(get("/v1/comprobantes/10/pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("comprobante-0001-00000010.pdf")))
                .andExpect(content().bytes(pdfFake));
    }

    @Test
    @DisplayName("GET /v1/comprobantes/{id}/pdf con ID inexistente responde 404")
    void descargarPdf_inexistente_responde404() throws Exception {
        when(comprobanteService.obtenerPorId(999L))
                .thenThrow(new RecursoNoEncontradoException("Comprobante", 999L));

        mockMvc.perform(get("/v1/comprobantes/999/pdf"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo", is("RECURSO_NO_ENCONTRADO")));
    }
}
