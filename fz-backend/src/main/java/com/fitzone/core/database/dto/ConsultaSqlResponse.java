package com.fitzone.core.database.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaSqlResponse {

    private String sql;
    private int cantidadFilas;
    private long tiempoEjecucionMs;
    private List<String> columnas;
    private List<Map<String, Object>> filas;
}
