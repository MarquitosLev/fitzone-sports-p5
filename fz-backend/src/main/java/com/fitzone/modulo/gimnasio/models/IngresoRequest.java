package com.fitzone.modulo.gimnasio.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngresoRequest {

    @NotBlank(message = "El token QR es obligatorio")
    private String tokenQr;

    @NotNull(message = "El idSede es obligatorio")
    @Positive(message = "El idSede debe ser positivo")
    private Long idSede;
}
