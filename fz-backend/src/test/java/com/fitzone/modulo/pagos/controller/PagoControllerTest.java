package com.fitzone.modulo.pagos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.pagos.models.PagoRequest;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.service.PagoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PagoController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class PagoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PagoService pagoService;

    @MockitoBean
    private com.fitzone.modulo.pagos.service.ComprobanteService comprobanteService;

    @Test
    @DisplayName("POST /v1/pagos retorna 201 Created cuando los datos son válidos")
    void procesarPago_retorna201() throws Exception {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .idMembresia(2L)
                .build();

        Transaccion transaccion = Transaccion.builder()
                .idTransaccion(100L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .monto(new BigDecimal("25000.00"))
                .estadoPago(EstadoPago.CONFIRMADO)
                .tokenTransaccionPasarela("tok_mock_123")
                .build();

        when(pagoService.procesarPago(any(PagoRequest.class))).thenReturn(transaccion);

        mockMvc.perform(post("/v1/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idTransaccion", is(100)))
                .andExpect(jsonPath("$.concepto", is("MEMBRESIA")))
                .andExpect(jsonPath("$.estadoPago", is("CONFIRMADO")))
                .andExpect(jsonPath("$.tokenTransaccionPasarela", is("tok_mock_123")));
    }

    @Test
    @DisplayName("POST /v1/pagos sin idUsuario responde 400 Bad Request por validación")
    void procesarPago_sinIdUsuario_responde400() throws Exception {
        PagoRequest request = PagoRequest.builder()
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .idMembresia(2L)
                .build();

        mockMvc.perform(post("/v1/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("VALIDACION")));
    }

    @Test
    @DisplayName("POST /v1/pagos con parámetros inconsistentes responde 400 SOLICITUD_INVALIDA")
    void procesarPago_invalido_responde400() throws Exception {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .build();

        when(pagoService.procesarPago(any(PagoRequest.class)))
                .thenThrow(new PeticionInvalidaException("Para pagos con concepto MEMBRESIA debe especificar idMembresia"));

        mockMvc.perform(post("/v1/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("SOLICITUD_INVALIDA")));
    }

    @Test
    @DisplayName("POST /v1/pagos con reserva duplicada responde 409 CONFLICTO")
    void procesarPago_duplicado_responde409() throws Exception {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(1L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.RESERVA_CANCHA)
                .idReservaCancha(5L)
                .build();

        when(pagoService.procesarPago(any(PagoRequest.class)))
                .thenThrow(new ConflictoException("La reserva de cancha ya fue pagada con éxito previamente"));

        mockMvc.perform(post("/v1/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo", is("CONFLICTO")));
    }

    @Test
    @DisplayName("POST /v1/pagos con usuario inexistente responde 404 RECURSO_NO_ENCONTRADO")
    void procesarPago_usuarioInexistente_responde404() throws Exception {
        PagoRequest request = PagoRequest.builder()
                .idUsuario(999L)
                .idSede(10L)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .idMembresia(2L)
                .build();

        when(pagoService.procesarPago(any(PagoRequest.class)))
                .thenThrow(new RecursoNoEncontradoException("Usuario", 999L));

        mockMvc.perform(post("/v1/pagos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo", is("RECURSO_NO_ENCONTRADO")));
    }

    @Test
    @DisplayName("GET /v1/pagos/{id} responde 200 y el detalle de la transacción")
    void obtenerPorId_retorna200() throws Exception {
        Transaccion transaccion = Transaccion.builder()
                .idTransaccion(50L)
                .monto(new BigDecimal("15000.00"))
                .estadoPago(EstadoPago.CONFIRMADO)
                .build();

        when(pagoService.obtenerPorId(50L)).thenReturn(transaccion);

        mockMvc.perform(get("/v1/pagos/50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idTransaccion", is(50)))
                .andExpect(jsonPath("$.estadoPago", is("CONFIRMADO")));
    }

    @Test
    @DisplayName("GET /v1/pagos/{id} inexistente responde 404")
    void obtenerPorId_inexistente_responde404() throws Exception {
        when(pagoService.obtenerPorId(999L))
                .thenThrow(new RecursoNoEncontradoException("Transacción", 999L));

        mockMvc.perform(get("/v1/pagos/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo", is("RECURSO_NO_ENCONTRADO")));
    }

    @Test
    @DisplayName("GET /v1/pagos/{id}/comprobante responde 200 con los datos del comprobante")
    void obtenerComprobantePorPago_retorna200() throws Exception {
        com.fitzone.modulo.pagos.models.Comprobante comprobante = com.fitzone.modulo.pagos.models.Comprobante.builder()
                .idComprobante(1L)
                .numeroFactura("0001-00000001")
                .build();

        when(comprobanteService.obtenerPorIdTransaccion(50L)).thenReturn(comprobante);

        mockMvc.perform(get("/v1/pagos/50/comprobante"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idComprobante", is(1)))
                .andExpect(jsonPath("$.numeroFactura", is("0001-00000001")));
    }

    @Test
    @DisplayName("GET /v1/pagos/{id}/comprobante de pago inexistente responde 404")
    void obtenerComprobantePorPago_inexistente_responde404() throws Exception {
        when(comprobanteService.obtenerPorIdTransaccion(999L))
                .thenThrow(new RecursoNoEncontradoException("Comprobante para la transacción", 999L));

        mockMvc.perform(get("/v1/pagos/999/comprobante"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo", is("RECURSO_NO_ENCONTRADO")));
    }
}
