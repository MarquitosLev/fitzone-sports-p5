package com.fitzone.modulo.gimnasio.models;

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
public class AforoSede {

    private Integer aforoActual;
    private Integer aforoMaximo;
    private Double porcentaje;
}
