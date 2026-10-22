package com.fitzone.modulo.clases.controller;

import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.clases.service.ReservaClaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reservas-clase")
@RequiredArgsConstructor
@Tag(name = "Reservas de Clases", description = "Endpoints de gestión y cancelación de reservas de clases grupales")
public class ReservaClaseController {

    private final ReservaClaseService reservaClaseService;

    @PatchMapping("/{id}/cancelar")
    @Operation(summary = "Cancelación de reserva de clase grupal liberando cupo para la lista de espera")
    public ReservaClase cancelar(@PathVariable @Positive Long id) {
        return reservaClaseService.cancelar(id);
    }
}
