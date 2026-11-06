package com.fitzone.core.database.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaSqlRequest {

    @NotBlank(message = "La consulta SQL es obligatoria")
    private String query;

    @Min(value = 1, message = "El límite de filas debe ser al menos 1")
    @Max(value = 1000, message = "El límite máximo de filas permitido es 1000")
    private Integer maxFilas;
}
