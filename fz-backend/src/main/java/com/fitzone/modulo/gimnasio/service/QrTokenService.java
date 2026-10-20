package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.modulo.gimnasio.models.QrTokenResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Slf4j
@Service
public class QrTokenService {

    private final String secretKey;
    private final Clock clock;

    @org.springframework.beans.factory.annotation.Autowired
    public QrTokenService(@Value("${fitzone.qr.secret:fitzone-sports-qr-secret-key-32bytes-secure!}") String secretKey) {
        this(secretKey, Clock.systemUTC());
    }

    public QrTokenService(String secretKey, Clock clock) {
        this.secretKey = secretKey;
        this.clock = clock;
    }

    public QrTokenResponse generarToken(Long idUsuario) {
        Instant now = clock.instant();
        long epochSecond = now.getEpochSecond();
        long ventana = epochSecond / 60;
        long segundosRestantes = 60 - (epochSecond % 60);

        String data = idUsuario + ":" + ventana;
        String hmac = calcularHmac(data);
        String rawToken = data + ":" + hmac;
        String tokenQr = Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken.getBytes(StandardCharsets.UTF_8));

        return QrTokenResponse.builder()
                .tokenQr(tokenQr)
                .segundosRestantes(segundosRestantes)
                .build();
    }

    public Long validarYObtenerUsuario(String tokenQr) {
        if (tokenQr == null || tokenQr.trim().isEmpty()) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "El token QR es obligatorio");
        }

        String rawToken;
        try {
            rawToken = new String(Base64.getUrlDecoder().decode(tokenQr.trim()), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "El formato del código QR es inválido");
        }

        String[] parts = rawToken.split(":");
        if (parts.length != 3) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "Estructura del token QR inválida");
        }

        Long idUsuario;
        long ventanaToken;
        String hmacRecibido = parts[2];
        try {
            idUsuario = Long.parseLong(parts[0]);
            ventanaToken = Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "Valores del token QR mal formados");
        }

        // Ventana actual y anterior (tolerancia de reloj de 60s)
        long epochSecond = clock.instant().getEpochSecond();
        long ventanaActual = epochSecond / 60;
        long ventanaAnterior = ventanaActual - 1;

        if (ventanaToken != ventanaActual && ventanaToken != ventanaAnterior) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "El código QR ha expirado");
        }

        // Recalcular HMAC para validar autenticidad
        String expectedHmac = calcularHmac(idUsuario + ":" + ventanaToken);
        if (!MessageDigest.isEqual(expectedHmac.getBytes(StandardCharsets.UTF_8), hmacRecibido.getBytes(StandardCharsets.UTF_8))) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "Firma del código QR inválida");
        }

        return idUsuario;
    }


    private String calcularHmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hmacBytes);
        } catch (Exception e) {
            log.error("Error al calcular HMAC-SHA256", e);
            throw new RuntimeException("Error en cálculo de firma criptográfica", e);
        }
    }
}
