package com.fitzone.modulo.pagos.pasarela;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PasarelaMockTest {

    private static final BigDecimal MONTO = new BigDecimal("15000");

    @Test
    @DisplayName("Con el rechazo forzado habilitado y pedido, el cobro se rechaza")
    void rechazoForzado_habilitado() {
        RespuestaPasarela r = new PasarelaMock(true).cobrar(MONTO, "Alta", true);

        assertThat(r.aprobado()).isFalse();
        assertThat(r.tokenTransaccion()).startsWith("tok_mock_rechazado_");
    }

    @Test
    @DisplayName("Con el rechazo forzado deshabilitado (dev y prod), pedirlo no tiene efecto y el cobro se aprueba")
    void rechazoForzado_deshabilitado_seIgnora() {
        RespuestaPasarela r = new PasarelaMock(false).cobrar(MONTO, "Alta", true);

        assertThat(r.aprobado()).isTrue();
        assertThat(r.tokenTransaccion()).startsWith("tok_mock_aprobado_");
    }

    @Test
    @DisplayName("Sin pedir el rechazo, el cobro se aprueba aunque esté habilitado")
    void sinPedirRechazo_aprueba() {
        assertThat(new PasarelaMock(true).cobrar(MONTO, "Alta", false).aprobado()).isTrue();
    }
}
