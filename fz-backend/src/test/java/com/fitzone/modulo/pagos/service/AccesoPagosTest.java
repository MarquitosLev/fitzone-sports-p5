package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccesoPagosTest {

    @Mock
    private UsuarioActual usuarioActual;

    @InjectMocks
    private AccesoPagos accesoPagos;

    private Transaccion pagoDelSocio;

    @BeforeEach
    void setUp() {
        Usuario socio = Usuario.builder().idUsuario(1L).tipoUsuario(TipoUsuario.SOCIO).build();
        pagoDelSocio = Transaccion.builder()
                .idTransaccion(50L)
                .usuario(socio)
                .sede(Sede.builder().idSede(1L).build())
                .build();
    }

    @Test
    @DisplayName("El dueño del pago puede verlo")
    void duenio_puedeVer() {
        when(usuarioActual.obtener()).thenReturn(Usuario.builder().idUsuario(1L).tipoUsuario(TipoUsuario.SOCIO).build());

        assertThatCode(() -> accesoPagos.validarLectura(pagoDelSocio)).doesNotThrowAnyException();
        verify(usuarioActual, never()).validarSede(any(Usuario.class), anyLong());
    }

    @Test
    @DisplayName("Otro socio o externo recibe 403")
    void otroCliente_recibe403() {
        when(usuarioActual.obtener()).thenReturn(Usuario.builder().idUsuario(2L).tipoUsuario(TipoUsuario.EXTERNO).build());

        assertThatThrownBy(() -> accesoPagos.validarLectura(pagoDelSocio))
                .isInstanceOf(AccesoDenegadoException.class);
    }

    @Test
    @DisplayName("El personal de la sede del pago puede verlo")
    void personalDeLaSede_puedeVer() {
        Usuario recepcionista = Usuario.builder().idUsuario(3L).tipoUsuario(TipoUsuario.RECEPCIONISTA).idSede(1L).build();
        when(usuarioActual.obtener()).thenReturn(recepcionista);

        assertThatCode(() -> accesoPagos.validarLectura(pagoDelSocio)).doesNotThrowAnyException();
        verify(usuarioActual).validarSede(recepcionista, 1L);
    }

    @Test
    @DisplayName("El personal de otra sede recibe el 403 de validarSede")
    void personalDeOtraSede_recibe403() {
        Usuario gerente = Usuario.builder().idUsuario(4L).tipoUsuario(TipoUsuario.GERENTE).idSede(2L).build();
        when(usuarioActual.obtener()).thenReturn(gerente);
        doThrow(new AccesoDenegadoException("No tiene permisos para operar sobre una sede distinta a la asignada"))
                .when(usuarioActual).validarSede(gerente, 1L);

        assertThatThrownBy(() -> accesoPagos.validarLectura(pagoDelSocio))
                .isInstanceOf(AccesoDenegadoException.class);
    }
}
