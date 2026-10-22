package com.fitzone.modulo.clases.controller;

import com.fitzone.modulo.clases.service.ListaEsperaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/lista-espera")
@RequiredArgsConstructor
@Tag(name = "Lista de Espera", description = "Endpoints de gestión de lista de espera para clases completas")
public class ListaEsperaController {

    private final ListaEsperaService listaEsperaService;

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Salir de la lista de espera de una clase y reacomodar posiciones")
    public void salir(@PathVariable @Positive Long id) {
        listaEsperaService.salir(id);
    }
}
