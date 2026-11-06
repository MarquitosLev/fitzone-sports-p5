package com.fitzone.modulo.gimnasio.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.IngresoRequest;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.service.AccesoService;
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

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccesoController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class AccesoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AccesoService accesoService;

    @Test
    @DisplayName("POST /v1/accesos/ingreso responde 201 Created cuando el ingreso es exitoso")
    void registrarIngreso_retorna201() throws Exception {
        IngresoRequest request = new IngresoRequest("valid-token-qr", 1L);
        Acceso accesoCreado = Acceso.builder()
                .idAcceso(10L)
                .usuario(Usuario.builder().idUsuario(5L).nombre("Carlos").build())
                .sede(Sede.builder().idSede(1L).nombre("Sede Central").build())
                .fechaHoraIngreso(LocalDateTime.now())
                .build();

        when(accesoService.registrarIngreso("valid-token-qr", 1L)).thenReturn(accesoCreado);

        mockMvc.perform(post("/v1/accesos/ingreso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idAcceso", is(10)))
                .andExpect(jsonPath("$.usuario.idUsuario", is(5)));
    }

    @Test
    @DisplayName("POST /v1/accesos/ingreso responde 400 Bad Request cuando el body es inválido")
    void registrarIngreso_validaCampos() throws Exception {
        IngresoRequest requestInvalido = new IngresoRequest("", null);

        mockMvc.perform(post("/v1/accesos/ingreso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestInvalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("VALIDACION")));
    }

    @Test
    @DisplayName("POST /v1/accesos/ingreso responde 422 cuando el token QR está vencido")
    void registrarIngreso_qrVencido_retorna422() throws Exception {
        IngresoRequest request = new IngresoRequest("token-expirado", 1L);
        when(accesoService.registrarIngreso(eq("token-expirado"), eq(1L)))
                .thenThrow(new AccesoException(CodigoError.QR_VENCIDO, "El código QR ha expirado"));

        mockMvc.perform(post("/v1/accesos/ingreso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.codigo", is("QR_VENCIDO")));
    }

    @Test
    @DisplayName("POST /v1/accesos/ingreso responde 409 cuando el socio ya tiene ingreso activo")
    void registrarIngreso_yaIngresado_retorna409() throws Exception {
        IngresoRequest request = new IngresoRequest("token-valido", 1L);
        when(accesoService.registrarIngreso(eq("token-valido"), eq(1L)))
                .thenThrow(new AccesoException(CodigoError.YA_INGRESADO, "El socio ya tiene un acceso activo"));

        mockMvc.perform(post("/v1/accesos/ingreso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo", is("YA_INGRESADO")));
    }

    @Test
    @DisplayName("POST /v1/accesos/{id}/egreso responde 200 OK cuando el egreso es exitoso")
    void registrarEgreso_retorna200() throws Exception {
        Acceso accesoEgreso = Acceso.builder()
                .idAcceso(10L)
                .fechaHoraIngreso(LocalDateTime.now().minusHours(1))
                .fechaHoraEgreso(LocalDateTime.now())
                .build();

        when(accesoService.registrarEgreso(10L)).thenReturn(accesoEgreso);

        mockMvc.perform(post("/v1/accesos/10/egreso"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idAcceso", is(10)))
                .andExpect(jsonPath("$.fechaHoraEgreso").isNotEmpty());
    }

    @Test
    @DisplayName("POST /v1/accesos/{id}/egreso responde 404 cuando el acceso no existe")
    void registrarEgreso_noEncontrado_retorna404() throws Exception {
        when(accesoService.registrarEgreso(999L))
                .thenThrow(new RecursoNoEncontradoException("Acceso", 999L));

        mockMvc.perform(post("/v1/accesos/999/egreso"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo", is("RECURSO_NO_ENCONTRADO")));
    }
}
