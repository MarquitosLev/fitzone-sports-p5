package com.fitzone.modulo.gimnasio.controller;

import com.fitzone.core.config.SecurityConfig;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.modulo.gimnasio.service.QrFirmadoService;
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

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ClaveQrController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class, SecurityConfig.class})
class ClaveQrSeguridadTest {

    private static final String CUERPO = "{\"clavePublica\":\"MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private QrFirmadoService qrFirmadoService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    private RequestPostProcessor sesionDe(String rol) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + rol));
    }

    @Test
    @DisplayName("Solo el socio puede registrar la clave de su dispositivo")
    void registrar_porRol() throws Exception {
        mockMvc.perform(put("/v1/usuarios/me/clave-qr").contentType(MediaType.APPLICATION_JSON).content(CUERPO))
                .andExpect(status().isUnauthorized());

        for (String rol : new String[]{"RECEPCIONISTA", "GERENTE", "EXTERNO"}) {
            mockMvc.perform(put("/v1/usuarios/me/clave-qr").with(sesionDe(rol))
                            .contentType(MediaType.APPLICATION_JSON).content(CUERPO))
                    .andExpect(status().isForbidden());
        }

        mockMvc.perform(put("/v1/usuarios/me/clave-qr").with(sesionDe("SOCIO"))
                        .contentType(MediaType.APPLICATION_JSON).content(CUERPO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.horaServidor", notNullValue()));
        verify(qrFirmadoService).registrarClave("MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE");
    }

    @Test
    @DisplayName("Una clave vacía o inválida responde 400")
    void registrar_claveInvalida_retorna400() throws Exception {
        mockMvc.perform(put("/v1/usuarios/me/clave-qr").with(sesionDe("SOCIO"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"clavePublica\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("VALIDACION")));

        doThrow(new PeticionInvalidaException("La clave pública debe ser ECDSA P-256"))
                .when(qrFirmadoService).registrarClave("rsa");
        mockMvc.perform(put("/v1/usuarios/me/clave-qr").with(sesionDe("SOCIO"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"clavePublica\":\"rsa\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("SOLICITUD_INVALIDA")));
    }
}
