package com.fitzone.modulo.clases.models;

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
public class ReservaClaseRequest {

    @NotNull(message = "El idUsuario es obligatorio")
    @Positive(message = "El idUsuario debe ser positivo")
    private Long idUsuario;
}
