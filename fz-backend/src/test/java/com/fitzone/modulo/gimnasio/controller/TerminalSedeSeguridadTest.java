package com.fitzone.modulo.gimnasio.controller;

import com.fitzone.core.config.SecurityConfig;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.modulo.gimnasio.models.HabilitadosResponse;
import com.fitzone.modulo.gimnasio.models.SincronizacionResponse;
import com.fitzone.modulo.gimnasio.service.TerminalSedeService;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Corre con los filtros de seguridad activos: la lista de habilitados y la sincronización
 * son solo para el personal de sede.
 */
@WebMvcTest(TerminalSedeController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class, SecurityConfig.class})
class TerminalSedeSeguridadTest {

    private static final String UN_EVENTO = """
            {"eventos":[{"tokenQr":"token","idSede":1,"ocurrioEn":"2026-11-15T15:00:00Z"}]}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TerminalSedeService terminalSedeService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    private RequestPostProcessor sesionDe(String rol) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + rol));
    }

    @Test
    @DisplayName("Sin token los endpoints del terminal responden 401")
    void sinToken_retorna401() throws Exception {
        mockMvc.perform(get("/v1/accesos/terminal/habilitados"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/v1/accesos/sincronizacion").contentType(MediaType.APPLICATION_JSON).content(UN_EVENTO))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("El socio y el externo reciben 403 en los endpoints del terminal")
    void socioYExterno_retornan403() throws Exception {
        for (String rol : new String[]{"SOCIO", "EXTERNO"}) {
            mockMvc.perform(get("/v1/accesos/terminal/habilitados").with(sesionDe(rol)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.codigo", is("ACCESO_DENEGADO")));
            mockMvc.perform(post("/v1/accesos/sincronizacion").with(sesionDe(rol))
                            .contentType(MediaType.APPLICATION_JSON).content(UN_EVENTO))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Recepcionista y gerente pueden bajar la lista y sincronizar")
    void personal_retorna200() throws Exception {
        when(terminalSedeService.habilitados(any())).thenReturn(HabilitadosResponse.builder().idSede(1L).build());
        when(terminalSedeService.sincronizar(any())).thenReturn(SincronizacionResponse.builder().resultados(List.of()).build());

        for (String rol : new String[]{"RECEPCIONISTA", "GERENTE"}) {
            mockMvc.perform(get("/v1/accesos/terminal/habilitados").with(sesionDe(rol)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.idSede", is(1)));
            mockMvc.perform(post("/v1/accesos/sincronizacion").with(sesionDe(rol))
                            .contentType(MediaType.APPLICATION_JSON).content(UN_EVENTO))
                    .andExpect(status().isOk());
        }
    }

    @Test
    @DisplayName("Un evento sin token u hora responde 400 de validación")
    void eventoIncompleto_retorna400() throws Exception {
        mockMvc.perform(post("/v1/accesos/sincronizacion").with(sesionDe("RECEPCIONISTA"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"eventos\":[{\"tokenQr\":\"\",\"idSede\":1}]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("VALIDACION")));
    }
}
