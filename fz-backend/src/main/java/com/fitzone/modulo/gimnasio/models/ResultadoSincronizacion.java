package com.fitzone.modulo.gimnasio.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Resultado de un evento sincronizado. {@code ok} en true incluye el caso DUPLICADO (ya estaba
 * registrado). Con {@code ok} en false, {@code codigo} es el mismo CodigoError del ingreso online.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResultadoSincronizacion {

    public static final String DUPLICADO = "DUPLICADO";

    private String tokenQr;
    private boolean ok;
    private String codigo;
    private String mensaje;
    private Long idAcceso;
}
