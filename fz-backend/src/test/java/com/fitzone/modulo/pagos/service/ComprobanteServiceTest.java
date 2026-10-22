package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComprobanteServiceTest {

    @Mock
    private ComprobanteRepository comprobanteRepository;

    @Mock
    private TransaccionRepository transaccionRepository;

    @InjectMocks
    private ComprobanteService comprobanteService;

    private Usuario socio;
    private Sede sedeCentral;
    private Transaccion transaccionCancha;
    private Transaccion transaccionMembresia;
    private ReservaCancha reservaCancha;
    private Membresia membresia;

    @BeforeEach
    void setUp() {
        socio = Usuario.builder()
                .idUsuario(1L)
                .dni("12345678")
                .nombre("Martin")
                .apellido("Palermo")
                .email("martin@fitzone.com")
                .build();

        sedeCentral = Sede.builder()
                .idSede(1L)
                .nombre("Sede Central")
                .aforoMaximo(100)
                .build();

        Cancha canchaPadel = Cancha.builder()
                .idCancha(10L)
                .nombre("Cancha Pádel 1")
                .tipo("Pádel Cristal")
                .sede(sedeCentral)
                .build();

        reservaCancha = ReservaCancha.builder()
                .idReservaCancha(100L)
                .cancha(canchaPadel)
                .usuario(socio)
                .fechaHoraInicio(LocalDateTime.of(2026, 11, 10, 18, 0))
                .fechaHoraFin(LocalDateTime.of(2026, 11, 10, 19, 30))
                .precioFinal(new BigDecimal("15000.00"))
                .build();

        transaccionCancha = Transaccion.builder()
                .idTransaccion(500L)
                .usuario(socio)
                .sede(sedeCentral)
                .reservaCancha(reservaCancha)
                .concepto(TipoOrigenTransaccion.RESERVA_CANCHA)
                .monto(new BigDecimal("15000.00"))
                .estadoPago(EstadoPago.CONFIRMADO)
                .tokenTransaccionPasarela("tok_cancha_ok")
                .fechaHoraCreacion(LocalDateTime.now().minusMinutes(5))
                .fechaHoraConfirmacion(LocalDateTime.now())
                .build();

        Plan planFull = Plan.builder()
                .idPlan(1)
                .nombre("Plan Pase Libre Mensual")
                .precioBase(new BigDecimal("35000.00"))
                .build();

        membresia = Membresia.builder()
                .idMembresia(200L)
                .usuario(socio)
                .plan(planFull)
                .fechaInicio(LocalDate.now())
                .fechaVencimiento(LocalDate.now().plusMonths(1))
                .build();

        transaccionMembresia = Transaccion.builder()
                .idTransaccion(600L)
                .usuario(socio)
                .sede(sedeCentral)
                .membresia(membresia)
                .concepto(TipoOrigenTransaccion.MEMBRESIA)
                .monto(new BigDecimal("35000.00"))
                .estadoPago(EstadoPago.CONFIRMADO)
                .tokenTransaccionPasarela("tok_membresia_ok")
                .fechaHoraCreacion(LocalDateTime.now().minusMinutes(3))
                .fechaHoraConfirmacion(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("generarComprobante para primer pago confirmado asigna 0001-00000001")
    void generarComprobante_primeraFactura_generaNumeroInicial() {
        when(comprobanteRepository.findByTransaccion_IdTransaccion(500L)).thenReturn(Optional.empty());
        when(comprobanteRepository.findTopByOrderByIdComprobanteDesc()).thenReturn(Optional.empty());
        when(comprobanteRepository.save(any(Comprobante.class))).thenAnswer(inv -> {
            Comprobante c = inv.getArgument(0);
            c.setIdComprobante(1L);
            return c;
        });

        Comprobante resultado = comprobanteService.generarComprobante(transaccionCancha);

        assertThat(resultado.getNumeroFactura()).isEqualTo("0001-00000001");
        assertThat(resultado.getTransaccion()).isEqualTo(transaccionCancha);
        verify(comprobanteRepository).save(any(Comprobante.class));
    }

    @Test
    @DisplayName("generarComprobante con comprobante previo incrementa correlativo")
    void generarComprobante_conFacturaPrevia_incrementaCorrelativo() {
        Comprobante anterior = Comprobante.builder()
                .idComprobante(15L)
                .numeroFactura("0001-00000015")
                .build();

        when(comprobanteRepository.findByTransaccion_IdTransaccion(500L)).thenReturn(Optional.empty());
        when(comprobanteRepository.findTopByOrderByIdComprobanteDesc()).thenReturn(Optional.of(anterior));
        when(comprobanteRepository.save(any(Comprobante.class))).thenAnswer(inv -> {
            Comprobante c = inv.getArgument(0);
            c.setIdComprobante(16L);
            return c;
        });

        Comprobante resultado = comprobanteService.generarComprobante(transaccionCancha);

        assertThat(resultado.getNumeroFactura()).isEqualTo("0001-00000016");
        verify(comprobanteRepository).save(any(Comprobante.class));
    }

    @Test
    @DisplayName("generarComprobante para transacción ya existente es idempotente y devuelve el existente")
    void generarComprobante_existente_devuelveExistente() {
        Comprobante existente = Comprobante.builder()
                .idComprobante(5L)
                .transaccion(transaccionCancha)
                .numeroFactura("0001-00000005")
                .build();

        when(comprobanteRepository.findByTransaccion_IdTransaccion(500L)).thenReturn(Optional.of(existente));

        Comprobante resultado = comprobanteService.generarComprobante(transaccionCancha);

        assertThat(resultado.getIdComprobante()).isEqualTo(5L);
        assertThat(resultado.getNumeroFactura()).isEqualTo("0001-00000005");
        verify(comprobanteRepository, never()).save(any());
    }

    @Test
    @DisplayName("generarComprobante para transacción RECHAZADO lanza ReglaNegocioException (422)")
    void generarComprobante_transaccionRechazada_lanza422() {
        transaccionCancha.setEstadoPago(EstadoPago.RECHAZADO);

        assertThatThrownBy(() -> comprobanteService.generarComprobante(transaccionCancha))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("solo puede generarse para transacciones con estado CONFIRMADO");

        verify(comprobanteRepository, never()).save(any());
    }

    @Test
    @DisplayName("generarComprobante para transacción PENDIENTE lanza ReglaNegocioException (422)")
    void generarComprobante_transaccionPendiente_lanza422() {
        transaccionCancha.setEstadoPago(EstadoPago.PENDIENTE);

        assertThatThrownBy(() -> comprobanteService.generarComprobante(transaccionCancha))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("solo puede generarse para transacciones con estado CONFIRMADO");

        verify(comprobanteRepository, never()).save(any());
    }

    @Test
    @DisplayName("obtenerPorIdTransaccion con transacción confirmada devuelve el comprobante")
    void obtenerPorIdTransaccion_exito() {
        Comprobante comprobante = Comprobante.builder()
                .idComprobante(1L)
                .transaccion(transaccionCancha)
                .numeroFactura("0001-00000001")
                .build();

        when(transaccionRepository.findById(500L)).thenReturn(Optional.of(transaccionCancha));
        when(comprobanteRepository.findByTransaccion_IdTransaccion(500L)).thenReturn(Optional.of(comprobante));

        Comprobante resultado = comprobanteService.obtenerPorIdTransaccion(500L);

        assertThat(resultado.getIdComprobante()).isEqualTo(1L);
        assertThat(resultado.getNumeroFactura()).isEqualTo("0001-00000001");
    }

    @Test
    @DisplayName("obtenerPorIdTransaccion con transacción rechazada lanza ReglaNegocioException")
    void obtenerPorIdTransaccion_rechazada_lanzaReglaNegocio() {
        transaccionCancha.setEstadoPago(EstadoPago.RECHAZADO);

        when(transaccionRepository.findById(500L)).thenReturn(Optional.of(transaccionCancha));

        assertThatThrownBy(() -> comprobanteService.obtenerPorIdTransaccion(500L))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("no se encuentra confirmada");
    }

    @Test
    @DisplayName("obtenerPorIdTransaccion inexistente lanza RecursoNoEncontradoException (404)")
    void obtenerPorIdTransaccion_inexistente_lanza404() {
        when(transaccionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> comprobanteService.obtenerPorIdTransaccion(999L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    @DisplayName("generarPdf para pago de reserva de cancha produce un archivo PDF válido")
    void generarPdf_reservaCancha_producePdfValido() {
        Comprobante comprobante = Comprobante.builder()
                .idComprobante(1L)
                .transaccion(transaccionCancha)
                .numeroFactura("0001-00000001")
                .build();

        when(comprobanteRepository.findById(1L)).thenReturn(Optional.of(comprobante));

        byte[] pdfBytes = comprobanteService.generarPdf(1L);

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(100);
        // Validar firma mágica de archivo PDF (%PDF)
        String cabecera = new String(pdfBytes, 0, 4);
        assertThat(cabecera).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("generarPdf para pago de membresía produce un archivo PDF válido")
    void generarPdf_membresia_producePdfValido() {
        Comprobante comprobante = Comprobante.builder()
                .idComprobante(2L)
                .transaccion(transaccionMembresia)
                .numeroFactura("0001-00000002")
                .build();

        when(comprobanteRepository.findById(2L)).thenReturn(Optional.of(comprobante));

        byte[] pdfBytes = comprobanteService.generarPdf(2L);

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(100);
        String cabecera = new String(pdfBytes, 0, 4);
        assertThat(cabecera).isEqualTo("%PDF");
    }
}
