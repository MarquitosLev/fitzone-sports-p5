package com.fitzone.modulo.canchas.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FranjaDisponibilidad {

    private LocalDateTime horaInicio;
    private LocalDateTime horaFin;
    private EstadoFranja estado;
}
