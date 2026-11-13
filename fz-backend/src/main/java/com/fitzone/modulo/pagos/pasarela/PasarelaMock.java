package com.fitzone.modulo.pagos.pasarela;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Implementación simulada de la pasarela de pagos (Mercado Pago / MODO) para entornos de prueba.
 */
@Slf4j
@Component
public class PasarelaMock implements PasarelaPago {

    private final boolean rechazoForzadoHabilitado;

    public PasarelaMock(@Value("${fitzone.pagos.rechazo-forzado-habilitado:false}") boolean rechazoForzadoHabilitado) {
        this.rechazoForzadoHabilitado = rechazoForzadoHabilitado;
    }

    @Override
    public RespuestaPasarela cobrar(BigDecimal monto, String conceptoDescripcion, boolean forzarRechazoSolicitado) {
        boolean forzarRechazo = forzarRechazoSolicitado && rechazoForzadoHabilitado;
        if (forzarRechazoSolicitado && !rechazoForzadoHabilitado) {
            log.warn("[PASARELA-MOCK] Se pidió forzar un rechazo pero fitzone.pagos.rechazo-forzado-habilitado está desactivado: se ignora");
        }
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
