package com.fitzone.modulo.pagos.pasarela;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Implementación simulada de la pasarela de pagos (Mercado Pago / MODO) para entornos de prueba.
 */
@Slf4j
@Component
public class PasarelaMock implements PasarelaPago {

    @Override
    public RespuestaPasarela cobrar(BigDecimal monto, String conceptoDescripcion, boolean forzarRechazo) {
        log.info("[PASARELA-MOCK] Procesando cobro de ${} - Concepto: {} - Forzar rechazo: {}",
                monto, conceptoDescripcion, forzarRechazo);

        if (forzarRechazo) {
            String tokenRechazo = "tok_mock_rechazado_" + UUID.randomUUID();
            log.warn("[PASARELA-MOCK] Cobro RECHAZADO de forma determinística. Token: {}", tokenRechazo);
            return RespuestaPasarela.builder()
                    .aprobado(false)
                    .tokenTransaccion(tokenRechazo)
                    .mensaje("Pago rechazado: Fondos insuficientes o rechazo simulado para pruebas")
                    .build();
        }

        String tokenAprobado = "tok_mock_aprobado_" + UUID.randomUUID();
        log.info("[PASARELA-MOCK] Cobro APROBADO exitosamente. Token: {}", tokenAprobado);
        return RespuestaPasarela.builder()
                .aprobado(true)
                .tokenTransaccion(tokenAprobado)
                .mensaje("Pago aprobado exitosamente")
                .build();
    }
}
