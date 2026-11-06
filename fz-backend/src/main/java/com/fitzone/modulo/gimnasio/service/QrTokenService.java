package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.modulo.gimnasio.models.QrTokenResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.UUID;

@Slf4j
@Service
public class QrTokenService {

    private static final int MAX_TOKEN_LENGTH = 256;

    private final String secretKey;
    private final Clock clock;

    @Autowired
    public QrTokenService(@Value("${fitzone.qr.secret:fitzone-sports-qr-secret-key-32bytes-secure!}") String secretKey) {
        this(secretKey, Clock.systemUTC());
    }

    public QrTokenService(String secretKey, Clock clock) {
        if (secretKey == null || secretKey.trim().isEmpty()) {
            throw new IllegalArgumentException("La clave secreta para QR (fitzone.qr.secret) no puede estar vacía");
        }
        this.secretKey = secretKey;
        this.clock = clock;
    }

    public QrTokenResponse generarToken(Long idUsuario) {
        Instant now = clock.instant();
        long epochSecond = now.getEpochSecond();
        long ventana = epochSecond / 60;
        long segundosRestantes = 60 - (epochSecond % 60);

        String nonce = UUID.randomUUID().toString().replace("-", "");
        String data = idUsuario + ":" + ventana + ":" + nonce;
        String hmac = calcularHmac(data);
        String rawToken = data + ":" + hmac;
        String tokenQr = Base64.getUrlEncoder().withoutPadding().encodeToString(rawToken.getBytes(StandardCharsets.UTF_8));

        return QrTokenResponse.builder()
                .tokenQr(tokenQr)
                .segundosRestantes(segundosRestantes)
                .build();
    }

    public Long validarYObtenerUsuario(String tokenQr) {
        if (tokenQr == null || tokenQr.trim().isEmpty() || tokenQr.length() > MAX_TOKEN_LENGTH) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "El token QR es obligatorio y no debe superar " + MAX_TOKEN_LENGTH + " caracteres");
        }

        String rawToken;
        try {
            rawToken = new String(Base64.getUrlDecoder().decode(tokenQr.trim()), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "El formato del código QR es inválido");
        }

        String[] parts = rawToken.split(":");
        if (parts.length != 4) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "Estructura del token QR inválida");
        }

        Long idUsuario;
        long ventanaToken;
        String nonce = parts[2];
        String hmacRecibido = parts[3];
        try {
            idUsuario = Long.parseLong(parts[0]);
            ventanaToken = Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "Valores del token QR mal formados");
        }

        // Tolerancia de reloj en ambas direcciones (ventana anterior, actual y siguiente)
        long epochSecond = clock.instant().getEpochSecond();
        long ventanaActual = epochSecond / 60;

        if (ventanaToken < ventanaActual - 1 || ventanaToken > ventanaActual + 1) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "El código QR ha expirado");
        }

        // Recalcular HMAC para validar autenticidad
        String expectedHmac = calcularHmac(idUsuario + ":" + ventanaToken + ":" + nonce);
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
