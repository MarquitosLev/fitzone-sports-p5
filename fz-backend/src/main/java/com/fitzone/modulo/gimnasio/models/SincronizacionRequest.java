package com.fitzone.modulo.gimnasio.models;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SincronizacionRequest {

    public static final int MAX_EVENTOS = 50;

    @NotEmpty(message = "La lista de eventos no puede estar vacía")
    @Size(max = MAX_EVENTOS, message = "Se pueden sincronizar como máximo " + MAX_EVENTOS + " eventos por vez")
    private List<@Valid EventoIngresoOffline> eventos;
}
