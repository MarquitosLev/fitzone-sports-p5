package com.fitzone.core.config;

import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.modulo.canchas.controller.CanchaController;
import com.fitzone.modulo.canchas.service.CanchaService;
import com.fitzone.modulo.pagos.controller.CheckoutInvitadoController;
import com.fitzone.modulo.pagos.controller.ComprobanteController;
import com.fitzone.modulo.pagos.controller.PagoController;
import com.fitzone.modulo.pagos.service.CheckoutInvitadoService;
import com.fitzone.modulo.pagos.service.ComprobanteService;
import com.fitzone.modulo.pagos.service.PagoService;
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
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Corre con los filtros de seguridad activos para verificar la matriz de permisos
 * de Canchas (M4) y Pagos (M5) definida en SCRUM-91.
 */
@WebMvcTest({CanchaController.class, PagoController.class, ComprobanteController.class,
        CheckoutInvitadoController.class})
@Import({WebConfig.class, GlobalExceptionHandler.class, SecurityConfig.class})
class SeguridadCanchasPagosTest {

    private static final String CANCHA_JSON = """
            {"idSede":1,"nombre":"Cancha Paddle 2","tipo":"PADDLE","precioBaseHora":15000,"enMantenimiento":false}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CanchaService canchaService;

    @MockitoBean
    private PagoService pagoService;

    @MockitoBean
    private ComprobanteService comprobanteService;

    @MockitoBean
    private CheckoutInvitadoService checkoutInvitadoService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    private RequestPostProcessor sesionDe(String rol) {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_" + rol));
    }

    @Test
    @DisplayName("Catálogo, disponibilidad y cotización de canchas son públicos")
    void lecturasDeCanchas_sinToken_responden200() throws Exception {
        mockMvc.perform(get("/v1/canchas").param("idSede", "1"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/v1/canchas/1"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/v1/canchas/1/disponibilidad"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/v1/canchas/1/cotizacion")
                        .param("inicio", "2026-12-01T18:00:00")
                        .param("fin", "2026-12-01T19:00:00"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sin token, administrar canchas, reservar y pagar responden 401 con el formato común")
    void operacionesProtegidas_sinToken_responden401() throws Exception {
        mockMvc.perform(post("/v1/canchas").contentType(MediaType.APPLICATION_JSON).content(CANCHA_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo", is("ACCESO_DENEGADO")))
                .andExpect(jsonPath("$.mensaje", not(is(""))));
        mockMvc.perform(post("/v1/canchas/1/reservas").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/v1/pagos").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/v1/pagos/1"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/v1/comprobantes/1/pdf"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Un token inválido responde 401")
    void tokenInvalido_responde401() throws Exception {
        mockMvc.perform(get("/v1/pagos/1").header("Authorization", "Bearer token-invalido"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo", is("ACCESO_DENEGADO")));
    }

    @Test
    @DisplayName("Solo el gerente da de alta, edita y pone en mantenimiento canchas")
    void administrarCanchas_soloGerente() throws Exception {
        mockMvc.perform(post("/v1/canchas").with(sesionDe("GERENTE"))
                        .contentType(MediaType.APPLICATION_JSON).content(CANCHA_JSON))
                .andExpect(status().isCreated());
        mockMvc.perform(put("/v1/canchas/1").with(sesionDe("GERENTE"))
                        .contentType(MediaType.APPLICATION_JSON).content(CANCHA_JSON))
                .andExpect(status().isOk());
        mockMvc.perform(patch("/v1/canchas/1/mantenimiento").with(sesionDe("GERENTE"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enMantenimiento\":true}"))
                .andExpect(status().isOk());

        for (String rol : new String[]{"SOCIO", "EXTERNO", "RECEPCIONISTA"}) {
            mockMvc.perform(post("/v1/canchas").with(sesionDe(rol))
                            .contentType(MediaType.APPLICATION_JSON).content(CANCHA_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.codigo", is("ACCESO_DENEGADO")));
            // SCRUM-131: Sin permiso debe recibir 403 aun con body vacío o inválido (no 400)
            mockMvc.perform(post("/v1/canchas").with(sesionDe(rol))
                            .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.codigo", is("ACCESO_DENEGADO")));
            mockMvc.perform(patch("/v1/canchas/1/mantenimiento").with(sesionDe(rol))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"enMantenimiento\":true}"))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Con sesión reservan solo los socios; externo y personal reciben 403")
    void reservarTurno_soloSocio() throws Exception {
        String reserva = "{\"fechaHoraInicio\":\"2026-12-01T10:00:00\",\"fechaHoraFin\":\"2026-12-01T11:00:00\"}";
        mockMvc.perform(post("/v1/canchas/1/reservas").with(sesionDe("SOCIO"))
                        .contentType(MediaType.APPLICATION_JSON).content(reserva))
                .andExpect(status().isCreated());
        for (String rol : new String[]{"EXTERNO", "RECEPCIONISTA", "GERENTE"}) {
            mockMvc.perform(post("/v1/canchas/1/reservas").with(sesionDe(rol))
                            .contentType(MediaType.APPLICATION_JSON).content(reserva))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Con sesión paga solo el socio; externo y personal reciben 403")
    void pagar_soloSocio() throws Exception {
        String pago = "{\"concepto\":\"RESERVA_CANCHA\",\"idReservaCancha\":1}";
        mockMvc.perform(post("/v1/pagos").with(sesionDe("SOCIO"))
                        .contentType(MediaType.APPLICATION_JSON).content(pago))
                .andExpect(status().isCreated());
        for (String rol : new String[]{"EXTERNO", "RECEPCIONISTA", "GERENTE"}) {
            mockMvc.perform(post("/v1/pagos").with(sesionDe(rol))
                            .contentType(MediaType.APPLICATION_JSON).content(pago))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Pagos y comprobantes exigen un rol del sistema")
    void pagos_conRol_respondenYSinRolDan403() throws Exception {
        for (String rol : new String[]{"SOCIO", "RECEPCIONISTA", "GERENTE"}) {
            mockMvc.perform(get("/v1/pagos/1").with(sesionDe(rol)))
                    .andExpect(status().isOk());
        }
        mockMvc.perform(get("/v1/pagos/1").with(sesionDe("EXTERNO")))
                .andExpect(status().isForbidden());

        // Token válido de Supabase pero sin usuario en fz_usr_usuarios: el converter no asigna rol
        mockMvc.perform(get("/v1/pagos/1").with(jwt()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/v1/comprobantes/1/pdf").with(jwt()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("El checkout de invitado responde sin token")
    void checkoutInvitado_sinToken() throws Exception {
        String codigo = "3f0c5a52-1d1f-4c7e-9b1a-2f4a8f6a9c10";
        String reserva = """
                {"idCancha":1,"fechaHoraInicio":"2026-12-01T10:00:00","fechaHoraFin":"2026-12-01T11:00:00",
                 "nombre":"Ana","apellido":"Pérez","dni":"30111222","email":"ana@mail.com","telefono":"1155550000"}
                """;
        mockMvc.perform(post("/v1/invitados/reservas").contentType(MediaType.APPLICATION_JSON).content(reserva))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/v1/invitados/reservas/" + codigo))
                .andExpect(status().isOk());
        mockMvc.perform(post("/v1/invitados/reservas/" + codigo + "/pago"))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Reserva de invitado con DNI o email inválidos: 400 de validación")
    void checkoutInvitado_validaDatos() throws Exception {
        String reserva = """
                {"idCancha":1,"fechaHoraInicio":"2026-12-01T10:00:00","fechaHoraFin":"2026-12-01T11:00:00",
                 "nombre":"Ana","apellido":"Pérez","dni":"30.111.222","email":"no-es-email","telefono":"1155550000"}
                """;
        mockMvc.perform(post("/v1/invitados/reservas").contentType(MediaType.APPLICATION_JSON).content(reserva))
                .andExpect(status().isBadRequest());
    }
}
