package com.fitzone.modulo.gimnasio.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
    @Size(max = 256, message = "El token QR no puede superar los 256 caracteres")
    private String tokenQr;

    @Positive(message = "El idSede debe ser positivo")
    private Long idSede;
}
