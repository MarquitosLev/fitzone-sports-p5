package com.fitzone.modulo.usuarios.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.config.WebConfig;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.GlobalExceptionHandler;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.service.UsuarioService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UsuarioController.class)
@Import({WebConfig.class, GlobalExceptionHandler.class})
@AutoConfigureMockMvc(addFilters = false)
class UsuarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UsuarioService usuarioService;

    @MockitoBean
    private com.fitzone.modulo.usuarios.service.MembresiaService membresiaService;

    @MockitoBean
    private com.fitzone.modulo.clases.service.ReservaClaseService reservaClaseService;

    @MockitoBean
    private com.fitzone.modulo.gimnasio.service.AccesoService accesoService;

    @MockitoBean
    private com.fitzone.modulo.canchas.service.CanchaService canchaService;


    @Test
    @DisplayName("POST /v1/usuarios responde 201 Created cuando los datos son válidos")
    void crear_retorna201() throws Exception {
        Usuario nuevo = Usuario.builder()
                .dni("12345678")
                .nombre("Martin")
                .apellido("Perez")
                .email("martin@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        Usuario persistido = Usuario.builder()
                .idUsuario(1L)
                .dni("12345678")
                .nombre("Martin")
                .apellido("Perez")
                .email("martin@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioService.crear(any(Usuario.class), eq(2L))).thenReturn(persistido);

        mockMvc.perform(post("/v1/usuarios")
                        .param("idOperador", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nuevo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idUsuario", is(1)))
                .andExpect(jsonPath("$.dni", is("12345678")))
                .andExpect(jsonPath("$.email", is("martin@fitzone.com")));
    }

    @Test
    @DisplayName("POST /v1/usuarios sin idOperador (opcional) responde 201 Created")
    void crear_sinIdOperador_retorna201() throws Exception {
        Usuario nuevo = Usuario.builder()
                .dni("87654321")
                .nombre("Laura")
                .apellido("Gomez")
                .email("laura@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        Usuario persistido = Usuario.builder()
                .idUsuario(2L)
                .dni("87654321")
                .nombre("Laura")
                .apellido("Gomez")
                .email("laura@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioService.crear(any(Usuario.class), eq(null))).thenReturn(persistido);

        mockMvc.perform(post("/v1/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nuevo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idUsuario", is(2)))
                .andExpect(jsonPath("$.dni", is("87654321")));
    }

    @Test
    @DisplayName("POST /v1/usuarios sin DNI responde 400 con formato de validación")
    void crear_sinDni_retorna400() throws Exception {
        Usuario invalido = Usuario.builder()
                .nombre("Martin")
                .apellido("Perez")
                .email("martin@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        mockMvc.perform(post("/v1/usuarios")
                        .param("idOperador", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalido)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo", is("VALIDACION")))
                .andExpect(jsonPath("$.detalles[0].campo", is("dni")));
    }

    @Test
    @DisplayName("POST /v1/usuarios con DNI duplicado responde 409 CONFLICTO")
    void crear_dniDuplicado_retorna409() throws Exception {
        Usuario duplicado = Usuario.builder()
                .dni("12345678")
                .nombre("Martin")
                .apellido("Perez")
                .email("martin@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioService.crear(any(Usuario.class), eq(2L)))
                .thenThrow(new ConflictoException("Ya existe un usuario con el DNI 12345678"));

        mockMvc.perform(post("/v1/usuarios")
                        .param("idOperador", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicado)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo", is("CONFLICTO")))
                .andExpect(jsonPath("$.mensaje", is("Ya existe un usuario con el DNI 12345678")));
    }

    @Test
    @DisplayName("GET /v1/usuarios/{id} retorna 200 y el perfil del usuario")
    void obtenerPorId_retorna200() throws Exception {
        Usuario usuario = Usuario.builder()
                .idUsuario(5L)
                .dni("33445566")
                .nombre("Lucia")
                .apellido("Gomez")
                .email("lucia@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioService.obtenerPorId(5L)).thenReturn(usuario);

        mockMvc.perform(get("/v1/usuarios/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idUsuario", is(5)))
                .andExpect(jsonPath("$.nombre", is("Lucia")));
    }

    @Test
    @DisplayName("GET /v1/usuarios/{id} con usuario inexistente responde 404")
    void obtenerPorId_inexistente_retorna404() throws Exception {
        when(usuarioService.obtenerPorId(999L))
                .thenThrow(new RecursoNoEncontradoException("Usuario", 999L));

        mockMvc.perform(get("/v1/usuarios/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo", is("RECURSO_NO_ENCONTRADO")));
    }

    @Test
    @DisplayName("GET /v1/usuarios?dni=&tipo=&idSede= retorna lista filtrada")
    void buscar_retornaLista() throws Exception {
        Usuario u1 = Usuario.builder().idUsuario(1L).dni("1111").tipoUsuario(TipoUsuario.SOCIO).build();

        when(usuarioService.buscar("1111", TipoUsuario.SOCIO, 1L)).thenReturn(List.of(u1));

        mockMvc.perform(get("/v1/usuarios")
                        .param("dni", "1111")
                        .param("tipo", "SOCIO")
                        .param("idSede", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].dni", is("1111")));
    }

    @Test
    @DisplayName("PUT /v1/usuarios/{id} actualiza y retorna 200")
    void actualizar_retorna200() throws Exception {
        Usuario datos = Usuario.builder()
                .dni("12345678")
                .nombre("Martin Actualizado")
                .apellido("Perez")
                .email("martin.nuevo@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        Usuario actualizado = Usuario.builder()
                .idUsuario(1L)
                .dni("12345678")
                .nombre("Martin Actualizado")
                .apellido("Perez")
                .email("martin.nuevo@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioService.actualizar(eq(1L), any(Usuario.class), eq(2L))).thenReturn(actualizado);

        mockMvc.perform(put("/v1/usuarios/1")
                        .param("idOperador", "2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(datos)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre", is("Martin Actualizado")))
                .andExpect(jsonPath("$.email", is("martin.nuevo@fitzone.com")));
    }

    @Test
    @DisplayName("GET /v1/usuarios/{id}/membresia retorna 200 con la membresía activa")
    void obtenerMembresiaVigente_retorna200() throws Exception {
        com.fitzone.modulo.usuarios.models.Membresia membresia = com.fitzone.modulo.usuarios.models.Membresia.builder()
                .idMembresia(10L)
                .estado(com.fitzone.core.domain.enums.EstadoMembresia.ACTIVO)
                .fechaInicio(java.time.LocalDate.now())
                .fechaVencimiento(java.time.LocalDate.now().plusMonths(1))
                .build();

        when(membresiaService.obtenerVigentePorUsuario(1L)).thenReturn(membresia);

        mockMvc.perform(get("/v1/usuarios/1/membresia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMembresia", is(10)))
                .andExpect(jsonPath("$.estado", is("ACTIVO")));
    }
    @Test
    @DisplayName("GET /v1/usuarios/{id}/reservas-clase retorna 200 con la lista de reservas del socio")
    void obtenerMisReservas_retorna200() throws Exception {
        com.fitzone.modulo.clases.models.ReservaClase reserva = com.fitzone.modulo.clases.models.ReservaClase.builder()
                .idReservaClase(5L)
                .estado(com.fitzone.core.domain.enums.EstadoReservaClase.CONFIRMADA)
                .build();

        when(reservaClaseService.listarPorUsuario(1L)).thenReturn(List.of(reserva));

        mockMvc.perform(get("/v1/usuarios/1/reservas-clase"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].idReservaClase", is(5)))
                .andExpect(jsonPath("$[0].estado", is("CONFIRMADA")));
    }


    @Test
    @DisplayName("GET /v1/usuarios/{id}/qr retorna 200 con el token QR y segundos restantes")
    void obtenerQr_retorna200() throws Exception {
        com.fitzone.modulo.gimnasio.models.QrTokenResponse qrResponse = com.fitzone.modulo.gimnasio.models.QrTokenResponse.builder()
                .tokenQr("mock-qr-token-base64")
                .segundosRestantes(45L)
                .build();

        when(accesoService.generarQr(1L)).thenReturn(qrResponse);

        mockMvc.perform(get("/v1/usuarios/1/qr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenQr", is("mock-qr-token-base64")))
                .andExpect(jsonPath("$.segundosRestantes", is(45)));
    }
    @Test
    @DisplayName("GET /v1/usuarios/{id}/reservas-cancha retorna 200 con la lista de reservas")
    void listarReservasCancha_retorna200() throws Exception {
        com.fitzone.modulo.canchas.models.ReservaCancha reserva = com.fitzone.modulo.canchas.models.ReservaCancha.builder()
                .idReservaCancha(10L)
                .fechaHoraInicio(java.time.LocalDateTime.now().plusDays(1))
                .fechaHoraFin(java.time.LocalDateTime.now().plusDays(1).plusHours(1))
                .build();

        when(canchaService.listarReservasPorUsuario(1L)).thenReturn(java.util.List.of(reserva));

        mockMvc.perform(get("/v1/usuarios/1/reservas-cancha"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idReservaCancha", is(10)));
    }
}
