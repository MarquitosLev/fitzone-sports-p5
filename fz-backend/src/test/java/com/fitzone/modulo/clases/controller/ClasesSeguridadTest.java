package com.fitzone.modulo.clases.controller;

import com.fitzone.core.config.SecurityConfig;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.modulo.clases.service.ClaseGrupalService;
import com.fitzone.modulo.clases.service.ListaEsperaService;
import com.fitzone.modulo.clases.service.ReservaClaseService;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A diferencia de los tests de controlador, corre con los filtros de seguridad activos
 * para verificar la matriz de permisos de M3 (SCRUM-91).
 */
@WebMvcTest({ClaseGrupalController.class, ReservaClaseController.class, ListaEsperaController.class})
@Import({WebConfig.class, GlobalExceptionHandler.class, SecurityConfig.class})
class ClasesSeguridadTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClaseGrupalService claseGrupalService;

    @MockitoBean
    private ReservaClaseService reservaClaseService;

    @MockitoBean
    private ListaEsperaService listaEsperaService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    private RequestPostProcessor sesionDe(String rol) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + rol));
    }

    @Test
    @DisplayName("Sin token las rutas de clases responden 401")
    void sinToken_retorna401() throws Exception {
        mockMvc.perform(get("/v1/clases").param("idSede", "1"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/v1/reservas-clase/1/cancelar"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/v1/lista-espera/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("La agenda responde 200 al socio y al personal, y 403 al externo")
    void agenda_porRol() throws Exception {
        for (String rol : new String[]{"SOCIO", "RECEPCIONISTA", "GERENTE"}) {
            mockMvc.perform(get("/v1/clases").param("idSede", "1").with(sesionDe(rol)))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(get("/v1/clases").param("idSede", "1").with(sesionDe("EXTERNO")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo", is("ACCESO_DENEGADO")));
    }

    @Test
    @DisplayName("Solo el gerente puede dar de baja una clase")
    void baja_soloGerente() throws Exception {
        mockMvc.perform(delete("/v1/clases/1").with(sesionDe("GERENTE")))
                .andExpect(status().isNoContent());

        for (String rol : new String[]{"SOCIO", "EXTERNO", "RECEPCIONISTA"}) {
            mockMvc.perform(delete("/v1/clases/1").with(sesionDe(rol)))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Solo el socio reserva, cancela y usa la lista de espera")
    void operacionesDelSocio_soloSocio() throws Exception {
        mockMvc.perform(post("/v1/clases/1/reservas").with(sesionDe("SOCIO")))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/v1/clases/1/lista-espera").with(sesionDe("SOCIO")))
                .andExpect(status().isCreated());
        mockMvc.perform(patch("/v1/reservas-clase/1/cancelar").with(sesionDe("SOCIO")))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/v1/lista-espera/1").with(sesionDe("SOCIO")))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/v1/clases/1/reservas").with(sesionDe("RECEPCIONISTA")))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/v1/clases/1/lista-espera").with(sesionDe("EXTERNO")))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/v1/reservas-clase/1/cancelar").with(sesionDe("GERENTE")))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/v1/lista-espera/1").with(sesionDe("RECEPCIONISTA")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Inscriptos y cola de espera son solo para el personal")
    void inscriptosYCola_soloPersonal() throws Exception {
        mockMvc.perform(get("/v1/clases/1/reservas").with(sesionDe("RECEPCIONISTA")))
                .andExpect(status().isOk());
        mockMvc.perform(get("/v1/clases/1/lista-espera").with(sesionDe("GERENTE")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/clases/1/reservas").with(sesionDe("SOCIO")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/v1/clases/1/lista-espera").with(sesionDe("SOCIO")))
                .andExpect(status().isForbidden());
    }
}
