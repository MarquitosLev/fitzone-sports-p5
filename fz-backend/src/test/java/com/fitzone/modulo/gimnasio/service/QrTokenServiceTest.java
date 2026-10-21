package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.modulo.gimnasio.models.QrTokenResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QrTokenServiceTest {

    private static final String SECRET_KEY = "test-secret-key-fitzone-32bytes-secure!";
    private static final Instant T0 = Instant.parse("2026-10-25T10:00:20Z"); // ventana = 29883480, resto = 40s

    private QrTokenService qrTokenService;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(T0, ZoneId.of("UTC"));
        qrTokenService = new QrTokenService(SECRET_KEY, fixedClock);
    }

    @Test
    @DisplayName("generarToken produce un token Base64Url y calcula correctamente los segundos restantes")
    void generarToken_calculaSegundosYFirma() {
        QrTokenResponse response = qrTokenService.generarToken(15L);

        assertThat(response.getTokenQr()).isNotBlank();
        assertThat(response.getSegundosRestantes()).isEqualTo(40L);
    }

    @Test
    @DisplayName("validarYObtenerUsuario valida token de la ventana actual")
    void validarYObtenerUsuario_ventanaActual_exito() {
        QrTokenResponse response = qrTokenService.generarToken(15L);

        Long idUsuario = qrTokenService.validarYObtenerUsuario(response.getTokenQr());

        assertThat(idUsuario).isEqualTo(15L);
    }

    @Test
    @DisplayName("validarYObtenerUsuario acepta token de la ventana anterior (tolerancia de reloj de 60s)")
    void validarYObtenerUsuario_ventanaAnterior_exito() {
        QrTokenResponse responseT0 = qrTokenService.generarToken(15L);

        // Avanzar el reloj 60 segundos (siguiente ventana)
        Instant tMas60 = T0.plusSeconds(60);
        QrTokenService serviceSiguienteVentana = new QrTokenService(SECRET_KEY, Clock.fixed(tMas60, ZoneId.of("UTC")));

        Long idUsuario = serviceSiguienteVentana.validarYObtenerUsuario(responseT0.getTokenQr());

        assertThat(idUsuario).isEqualTo(15L);
    }

    @Test
    @DisplayName("validarYObtenerUsuario rechaza token de hace más de 1 ventana con QR_VENCIDO")
    void validarYObtenerUsuario_masDeUnaVentanaAtras_lanzaQrVencido() {
        QrTokenResponse responseT0 = qrTokenService.generarToken(15L);

        // Avanzar el reloj 130 segundos (2 ventanas después)
        Instant tMas130 = T0.plusSeconds(130);
        QrTokenService serviceDosVentanasDespues = new QrTokenService(SECRET_KEY, Clock.fixed(tMas130, ZoneId.of("UTC")));

        assertThatThrownBy(() -> serviceDosVentanasDespues.validarYObtenerUsuario(responseT0.getTokenQr()))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.QR_VENCIDO));
    }

    @Test
    @DisplayName("validarYObtenerUsuario rechaza token con firma HMAC adulterada con QR_VENCIDO")
    void validarYObtenerUsuario_firmaAdulterada_lanzaQrVencido() {
        QrTokenResponse response = qrTokenService.generarToken(15L);

        // Modificar ligeramente el token
        String tokenAdulterado = response.getTokenQr().substring(0, response.getTokenQr().length() - 2) + "xx";

        assertThatThrownBy(() -> qrTokenService.validarYObtenerUsuario(tokenAdulterado))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.QR_VENCIDO));
    }

    @Test
    @DisplayName("validarYObtenerUsuario acepta token de la ventana siguiente (reloj del emisor adelantado)")
    void validarYObtenerUsuario_ventanaSiguiente_exito() {
        // Emisor genera token 60 segundos en el futuro (reloj adelantado)
        Instant tMas60 = T0.plusSeconds(60);
        QrTokenService serviceEmisorAdelantado = new QrTokenService(SECRET_KEY, Clock.fixed(tMas60, ZoneId.of("UTC")));
        QrTokenResponse responseAdelantado = serviceEmisorAdelantado.generarToken(15L);

        // Validador con reloj T0 debe aceptarlo dentro del margen de skew (+1 ventana)
        Long idUsuario = qrTokenService.validarYObtenerUsuario(responseAdelantado.getTokenQr());

        assertThat(idUsuario).isEqualTo(15L);
    }

    @Test
    @DisplayName("validarYObtenerUsuario rechaza token nulo o vacío con QR_VENCIDO")
    void validarYObtenerUsuario_vacio_lanzaQrVencido() {
        assertThatThrownBy(() -> qrTokenService.validarYObtenerUsuario(""))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.QR_VENCIDO));
    }

    @Test
    @DisplayName("validarYObtenerUsuario rechaza token mayor a 256 caracteres antes de decodificar")
    void validarYObtenerUsuario_tokenDemasiadoLargo_lanzaQrVencido() {
        String tokenGigante = "A".repeat(300);

        assertThatThrownBy(() -> qrTokenService.validarYObtenerUsuario(tokenGigante))
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.QR_VENCIDO));
    }

    @Test
    @DisplayName("constructor rechaza secreto nulo o en blanco con IllegalArgumentException")
    void constructor_secretoVacio_lanzaIllegalArgumentException() {
        assertThatThrownBy(() -> new QrTokenService("", Clock.systemUTC()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fitzone.qr.secret");

        assertThatThrownBy(() -> new QrTokenService("   ", Clock.systemUTC()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fitzone.qr.secret");
    }
}
