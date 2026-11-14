package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.EventoIngresoOffline;
import com.fitzone.modulo.gimnasio.models.HabilitadosResponse;
import com.fitzone.modulo.gimnasio.models.ResultadoSincronizacion;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.models.SincronizacionResponse;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TerminalSedeServiceTest {

    private static final Instant AHORA = Instant.parse("2026-11-15T15:00:00Z");

    @Mock
    private AccesoService accesoService;

    @Mock
    private AccesoRepository accesoRepository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    private TerminalSedeService terminalSedeService;

    @BeforeEach
    void setUp() {
        terminalSedeService = new TerminalSedeService(accesoService, accesoRepository, sedeRepository,
                membresiaRepository, Clock.fixed(AHORA, ZoneId.of("UTC")));
    }

    private EventoIngresoOffline evento(String token, Instant ocurrioEn) {
        return EventoIngresoOffline.builder().tokenQr(token).idSede(1L).ocurrioEn(ocurrioEn).build();
    }

    @Test
    @DisplayName("sincronizar registra cada evento por separado: un rechazo no impide registrar el resto")
    void sincronizar_unOkYUnRechazo_registraElOk() {
        Instant hace5Min = AHORA.minusSeconds(300);
        when(accesoRepository.findByTokenQr(anyString())).thenReturn(Optional.empty());
        when(accesoService.registrarIngreso("token-ok", 1L, hace5Min))
                .thenReturn(Acceso.builder().idAcceso(10L).build());
        when(accesoService.registrarIngreso("token-adentro", 1L, hace5Min))
                .thenThrow(new AccesoException(CodigoError.YA_INGRESADO, "El socio ya cuenta con un ingreso activo"));

        SincronizacionResponse respuesta = terminalSedeService.sincronizar(List.of(
                evento("token-ok", hace5Min), evento("token-adentro", hace5Min)));

        List<ResultadoSincronizacion> resultados = respuesta.getResultados();
        assertThat(resultados).hasSize(2);
        assertThat(resultados.get(0).isOk()).isTrue();
        assertThat(resultados.get(0).getIdAcceso()).isEqualTo(10L);
        assertThat(resultados.get(1).isOk()).isFalse();
        assertThat(resultados.get(1).getCodigo()).isEqualTo("YA_INGRESADO");
    }

    @Test
    @DisplayName("sincronizar un token ya registrado responde DUPLICADO sin volver a registrarlo")
    void sincronizar_tokenYaRegistrado_respondeDuplicado() {
        when(accesoRepository.findByTokenQr("token-repetido"))
                .thenReturn(Optional.of(Acceso.builder().idAcceso(7L).build()));

        SincronizacionResponse respuesta = terminalSedeService.sincronizar(List.of(
                evento("token-repetido", AHORA.minusSeconds(60))));

        ResultadoSincronizacion resultado = respuesta.getResultados().get(0);
        assertThat(resultado.isOk()).isTrue();
        assertThat(resultado.getCodigo()).isEqualTo(ResultadoSincronizacion.DUPLICADO);
        assertThat(resultado.getIdAcceso()).isEqualTo(7L);
        verify(accesoService, never()).registrarIngreso(anyString(), any(), any(Instant.class));
    }

    @Test
    @DisplayName("sincronizar con firma inválida devuelve QR_VENCIDO en el evento")
    void sincronizar_firmaInvalida_devuelveQrVencido() {
        Instant hace1Min = AHORA.minusSeconds(60);
        when(accesoRepository.findByTokenQr("token-falso")).thenReturn(Optional.empty());
        when(accesoService.registrarIngreso("token-falso", 1L, hace1Min))
                .thenThrow(new AccesoException(CodigoError.QR_VENCIDO, "Firma del código QR inválida"));

        ResultadoSincronizacion resultado = terminalSedeService.sincronizar(List.of(evento("token-falso", hace1Min)))
                .getResultados().get(0);

        assertThat(resultado.isOk()).isFalse();
        assertThat(resultado.getCodigo()).isEqualTo("QR_VENCIDO");
    }

    @Test
    @DisplayName("sincronizar rechaza un evento con hora en el futuro o con más de 24 horas, sin registrarlo")
    void sincronizar_horaFueraDeRango_rechazaSinRegistrar() {
        SincronizacionResponse respuesta = terminalSedeService.sincronizar(List.of(
                evento("token-futuro", AHORA.plusSeconds(600)),
                evento("token-viejo", AHORA.minusSeconds(25 * 3600))));

        assertThat(respuesta.getResultados()).allSatisfy(r -> {
            assertThat(r.isOk()).isFalse();
            assertThat(r.getCodigo()).isEqualTo("SOLICITUD_INVALIDA");
        });
        verify(accesoService, never()).registrarIngreso(anyString(), any(), any(Instant.class));
    }

    @Test
    @DisplayName("sincronizar sigue con el lote ante un error inesperado y lo informa como ERROR_INTERNO")
    void sincronizar_errorInesperado_siguieConElLote() {
        Instant hace1Min = AHORA.minusSeconds(60);
        when(accesoRepository.findByTokenQr(anyString())).thenReturn(Optional.empty());
        when(accesoService.registrarIngreso("token-roto", 1L, hace1Min)).thenThrow(new IllegalStateException("boom"));
        when(accesoService.registrarIngreso("token-ok", 1L, hace1Min)).thenReturn(Acceso.builder().idAcceso(3L).build());

        List<ResultadoSincronizacion> resultados = terminalSedeService.sincronizar(List.of(
                evento("token-roto", hace1Min), evento("token-ok", hace1Min))).getResultados();

        assertThat(resultados.get(0).getCodigo()).isEqualTo("ERROR_INTERNO");
        assertThat(resultados.get(1).isOk()).isTrue();
    }

    @Test
    @DisplayName("sincronizar rechaza un lote vacío o de más de 50 eventos")
    void sincronizar_loteInvalido_lanzaPeticionInvalida() {
        List<EventoIngresoOffline> lote51 = Collections.nCopies(51, evento("t", AHORA));

        assertThatThrownBy(() -> terminalSedeService.sincronizar(List.of()))
                .isInstanceOf(PeticionInvalidaException.class);
        assertThatThrownBy(() -> terminalSedeService.sincronizar(lote51))
                .isInstanceOf(PeticionInvalidaException.class);
    }

    @Test
    @DisplayName("habilitados arma la lista con socios vigentes, accesos abiertos de la sede y vigencia de 24 horas")
    void habilitados_armaListaLocal() {
        Usuario socio = Usuario.builder().idUsuario(5L).nombre("Martín").apellido("Socio").dni("00000003").build();
        Membresia membresia = Membresia.builder().usuario(socio).estado(EstadoMembresia.ACTIVO)
                .fechaVencimiento(LocalDate.of(2026, 12, 15)).build();
        Acceso abierto = Acceso.builder().idAcceso(9L).usuario(socio).tokenQr("token-abierto")
                .fechaHoraIngreso(LocalDateTime.of(2026, 11, 15, 11, 30)).build();

        when(accesoService.resolverYValidarSedeOperador(null)).thenReturn(1L);
        when(sedeRepository.findById(1L)).thenReturn(Optional.of(Sede.builder().idSede(1L).aforoMaximo(150).build()));
        when(membresiaRepository.findVigentesConUsuario(any(), any())).thenReturn(List.of(membresia));
        when(accesoRepository.findBySede_IdSedeAndFechaHoraEgresoIsNull(1L)).thenReturn(List.of(abierto));

        HabilitadosResponse lista = terminalSedeService.habilitados(null);

        assertThat(lista.getIdSede()).isEqualTo(1L);
        assertThat(lista.getAforoMaximo()).isEqualTo(150);
        assertThat(lista.getHoraServidor()).isEqualTo(AHORA);
        assertThat(lista.getValidaHasta()).isEqualTo(AHORA.plusSeconds(24 * 3600));
        assertThat(lista.getSocios()).singleElement().satisfies(s -> {
            assertThat(s.getIdUsuario()).isEqualTo(5L);
            assertThat(s.getVenceMembresia()).isEqualTo(LocalDate.of(2026, 12, 15));
        });
        assertThat(lista.getAdentro()).singleElement().satisfies(a -> {
            assertThat(a.getIdUsuario()).isEqualTo(5L);
            assertThat(a.getTokenQr()).isEqualTo("token-abierto");
        });
        verify(membresiaRepository).findVigentesConUsuario(EstadoMembresia.ACTIVO, LocalDate.ofInstant(AHORA, ZoneId.systemDefault()));
    }

    @Test
    @DisplayName("habilitados sin sede asignada ni idSede responde 400")
    void habilitados_sinSede_lanzaPeticionInvalida() {
        when(accesoService.resolverYValidarSedeOperador(null)).thenReturn(null);

        assertThatThrownBy(() -> terminalSedeService.habilitados(null))
                .isInstanceOf(PeticionInvalidaException.class);
    }
}
