package com.fitzone.modulo.pagos.pasarela;

import java.math.BigDecimal;

/**
 * Interfaz que desacopla la integración con pasarelas de pago externas (Adapter Pattern).
 */
public interface PasarelaPago {

    RespuestaPasarela cobrar(BigDecimal monto, String conceptoDescripcion, boolean forzarRechazo);
}
