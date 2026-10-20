package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.SupabaseAuthClient;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private SupabaseAuthClient supabaseAuthClient;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario operadorRecepcionista;
    private Usuario operadorGerente;
    private Usuario operadorSocio;

    @BeforeEach
    void setUp() {
        operadorRecepcionista = Usuario.builder()
                .idUsuario(1L)
                .dni("11111111")
                .nombre("Ana")
                .apellido("Recep")
                .email("ana@fitzone.com")
                .tipoUsuario(TipoUsuario.RECEPCIONISTA)
                .idSede(1L)
                .build();

        operadorGerente = Usuario.builder()
                .idUsuario(2L)
                .dni("22222222")
                .nombre("Carlos")
                .apellido("Gerente")
                .email("carlos@fitzone.com")
                .tipoUsuario(TipoUsuario.GERENTE)
                .idSede(1L)
                .build();

        operadorSocio = Usuario.builder()
                .idUsuario(3L)
                .dni("33333333")
                .nombre("Juan")
                .apellido("Socio")
                .email("juan@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();
    }

    @Test
    @DisplayName("Alta de SOCIO con invitación por email exitosa")
    void crearSocio_conEmail_exitoso() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(operadorRecepcionista));
        when(usuarioRepository.existsByDni("44444444")).thenReturn(false);
        when(supabaseAuthClient.isAltaPorEmail()).thenReturn(true);
        UUID authId = UUID.randomUUID();
        when(supabaseAuthClient.invitarUsuario(eq("nuevo@fitzone.com"), anyMap())).thenReturn(authId);

        Usuario nuevo = Usuario.builder()
                .dni("44444444")
                .nombre("Pedro")
                .apellido("Gomez")
                .email("nuevo@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioRepository.saveAndFlush(any(Usuario.class))).thenAnswer(i -> {
            Usuario u = i.getArgument(0);
            u.setIdUsuario(10L);
            return u;
        });

        Usuario creado = usuarioService.crear(nuevo, 1L);

        assertThat(creado.getIdUsuario()).isEqualTo(10L);
        assertThat(creado.getAuthId()).isEqualTo(authId);
        verify(supabaseAuthClient).invitarUsuario(eq("nuevo@fitzone.com"), anyMap());
    }

    @Test
    @DisplayName("Alta de EXTERNO no genera cuenta en Supabase Auth y authId queda en null")
    void crearExterno_sinSupabase() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(operadorRecepcionista));
        when(usuarioRepository.existsByDni("55555555")).thenReturn(false);

        Usuario externo = Usuario.builder()
                .dni("55555555")
                .nombre("Martin")
                .apellido("Invitado")
                .email("martin@gmail.com")
                .tipoUsuario(TipoUsuario.EXTERNO)
                .build();

        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> {
            Usuario u = i.getArgument(0);
            u.setIdUsuario(20L);
            return u;
        });

        Usuario creado = usuarioService.crear(externo, 1L);

        assertThat(creado.getIdUsuario()).isEqualTo(20L);
        assertThat(creado.getAuthId()).isNull();
        verify(supabaseAuthClient, never()).invitarUsuario(any(), any());
        verify(supabaseAuthClient, never()).crearUsuarioConfirmado(any(), any(), any());
    }

    @Test
    @DisplayName("Alta rechazada con 409 si el DNI ya existe")
    void crear_dniDuplicado_lanzaConflicto() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(operadorRecepcionista));
        when(usuarioRepository.existsByDni("11111111")).thenReturn(true);

        Usuario nuevo = Usuario.builder()
                .dni("11111111")
                .nombre("Test")
                .apellido("Test")
                .email("test@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        assertThatThrownBy(() -> usuarioService.crear(nuevo, 1L))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("Ya existe un usuario con el DNI 11111111");
    }

    @Test
    @DisplayName("SOCIO con sede enviada por el front: se sanitiza a null y se da de alta correctamente")
    void crear_socioConSede_seSanitizaANull() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(operadorRecepcionista));
        when(usuarioRepository.existsByDni("66666666")).thenReturn(false);
        when(supabaseAuthClient.isAltaPorEmail()).thenReturn(true);
        when(supabaseAuthClient.invitarUsuario(eq("test@fitzone.com"), anyMap())).thenReturn(UUID.randomUUID());

        Usuario socioConSede = Usuario.builder()
                .dni("66666666")
                .nombre("Test")
                .apellido("Test")
                .email("test@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .idSede(1L)
                .build();

        when(usuarioRepository.saveAndFlush(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        Usuario creado = usuarioService.crear(socioConSede, 1L);

        assertThat(creado.getIdSede()).isNull();
        assertThat(creado.isDeleted()).isFalse();
        assertThat(creado.getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("Alta con idOperador nulo: realiza fallback al operador del sistema (1L)")
    void crear_idOperadorNulo_usaOperadorPorDefecto() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(operadorRecepcionista));
        when(usuarioRepository.existsByDni("66666667")).thenReturn(false);
        when(supabaseAuthClient.isAltaPorEmail()).thenReturn(true);
        when(supabaseAuthClient.invitarUsuario(eq("test2@fitzone.com"), anyMap())).thenReturn(UUID.randomUUID());

        Usuario socio = Usuario.builder()
                .dni("66666667")
                .nombre("Test2")
                .apellido("Test2")
                .email("test2@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioRepository.saveAndFlush(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        Usuario creado = usuarioService.crear(socio, null);

        assertThat(creado).isNotNull();
        verify(usuarioRepository).findById(1L);
    }

    @Test
    @DisplayName("RECEPCIONISTA sin sede asignada lanza ReglaNegocioException (422)")
    void crear_recepcionistaSinSede_lanzaReglaNegocio() {
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(operadorGerente));
        when(usuarioRepository.existsByDni("77777777")).thenReturn(false);

        Usuario recepSinSede = Usuario.builder()
                .dni("77777777")
                .nombre("Test")
                .apellido("Test")
                .email("test@fitzone.com")
                .tipoUsuario(TipoUsuario.RECEPCIONISTA)
                .build();

        assertThatThrownBy(() -> usuarioService.crear(recepSinSede, 2L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("deben tener una sede asignada");
    }

    @Test
    @DisplayName("RECEPCIONISTA con sede inexistente lanza RecursoNoEncontradoException (404)")
    void crear_recepcionistaSedeInexistente_lanza404() {
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(operadorGerente));
        when(usuarioRepository.existsByDni("77777777")).thenReturn(false);
        when(sedeRepository.existsById(99L)).thenReturn(false);

        Usuario recep = Usuario.builder()
                .dni("77777777")
                .nombre("Test")
                .apellido("Test")
                .email("test@fitzone.com")
                .tipoUsuario(TipoUsuario.RECEPCIONISTA)
                .idSede(99L)
                .build();

        assertThatThrownBy(() -> usuarioService.crear(recep, 2L))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessageContaining("Sede con id 99 no existe");
    }

    @Test
    @DisplayName("Operador SOCIO no puede dar de alta usuarios (403)")
    void crear_operadorSocio_lanza403() {
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(operadorSocio));

        Usuario nuevo = Usuario.builder()
                .dni("88888888")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        assertThatThrownBy(() -> usuarioService.crear(nuevo, 3L))
                .isInstanceOf(AccesoDenegadoException.class)
                .hasMessageContaining("Solo recepcionistas o gerentes pueden dar de alta usuarios");
    }

    @Test
    @DisplayName("Operador RECEPCIONISTA intentando dar de alta a un GERENTE lanza 403")
    void crear_recepcionistaCreandoGerente_lanza403() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(operadorRecepcionista));

        Usuario nuevoGerente = Usuario.builder()
                .dni("88888888")
                .tipoUsuario(TipoUsuario.GERENTE)
                .idSede(1L)
                .build();

        assertThatThrownBy(() -> usuarioService.crear(nuevoGerente, 1L))
                .isInstanceOf(AccesoDenegadoException.class)
                .hasMessageContaining("Solo un gerente puede dar de alta personal");
    }

    @Test
    @DisplayName("Compensación: si falla la BD luego de crear cuenta en Supabase, se borra la cuenta en Supabase")
    void crear_compensacionAlFallarBD() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(operadorRecepcionista));
        when(usuarioRepository.existsByDni("99999999")).thenReturn(false);
        when(supabaseAuthClient.isAltaPorEmail()).thenReturn(true);
        UUID authId = UUID.randomUUID();
        when(supabaseAuthClient.invitarUsuario(any(), anyMap())).thenReturn(authId);
        when(usuarioRepository.saveAndFlush(any())).thenThrow(new RuntimeException("Error simulado de conexión a BD"));

        Usuario nuevo = Usuario.builder()
                .dni("99999999")
                .nombre("Error")
                .apellido("DB")
                .email("error@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        assertThatThrownBy(() -> usuarioService.crear(nuevo, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Error simulado");

        verify(supabaseAuthClient).eliminarUsuario(authId);
    }

    @Test
    @DisplayName("Actualizar: el DNI se preserva, se actualizan datos y sincroniza cambio de email con Supabase")
    void actualizar_exitosoConCambioEmail() {
        UUID authId = UUID.randomUUID();
        Usuario existente = Usuario.builder()
                .idUsuario(15L)
                .dni("12345678")
                .nombre("Original")
                .apellido("User")
                .email("original@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .authId(authId)
                .build();

        when(usuarioRepository.findById(15L)).thenReturn(Optional.of(existente));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(operadorRecepcionista));

        Usuario datosNuevos = Usuario.builder()
                .dni("99999999") // Intento de cambio de DNI que debe ignorarse
                .nombre("NombreModificado")
                .apellido("ApellidoModificado")
                .email("modificado@fitzone.com")
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(usuarioRepository.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));

        Usuario actualizado = usuarioService.actualizar(15L, datosNuevos, 1L);

        assertThat(actualizado.getDni()).isEqualTo("12345678");
        assertThat(actualizado.getNombre()).isEqualTo("NombreModificado");
        assertThat(actualizado.getEmail()).isEqualTo("modificado@fitzone.com");
        verify(supabaseAuthClient).actualizarEmail(authId, "modificado@fitzone.com");
    }

    @Test
    @DisplayName("Cambio de rol: degradar usuario con cuenta a EXTERNO lanza ReglaNegocioException (422)")
    void actualizar_degradarAExterno_lanza422() {
        Usuario existente = Usuario.builder()
                .idUsuario(15L)
                .dni("12345678")
                .tipoUsuario(TipoUsuario.SOCIO)
                .authId(UUID.randomUUID())
                .email("socio@fitzone.com")
                .build();

        when(usuarioRepository.findById(15L)).thenReturn(Optional.of(existente));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(operadorGerente));

        Usuario datosNuevos = Usuario.builder()
                .email("socio@fitzone.com")
                .tipoUsuario(TipoUsuario.EXTERNO)
                .build();

        assertThatThrownBy(() -> usuarioService.actualizar(15L, datosNuevos, 2L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("No se permite degradar un usuario con cuenta registrada a tipo EXTERNO");
    }
}
