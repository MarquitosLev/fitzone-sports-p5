package com.fitzone.modulo.usuarios.controller;

import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.service.MembresiaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/planes")
@RequiredArgsConstructor
@Tag(name = "Planes", description = "Endpoints de catálogo de planes de membresía")
public class PlanController {

    private final MembresiaService membresiaService;

    @GetMapping
    @Operation(summary = "Listado de todos los planes de membresía disponibles")
    public List<Plan> listar() {
        return membresiaService.listarPlanes();
    }
}
