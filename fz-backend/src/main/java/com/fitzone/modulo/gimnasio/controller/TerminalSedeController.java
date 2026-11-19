package com.fitzone.modulo.gimnasio.controller;

import com.fitzone.modulo.gimnasio.models.HabilitadosResponse;
import com.fitzone.modulo.gimnasio.models.SincronizacionRequest;
import com.fitzone.modulo.gimnasio.models.SincronizacionResponse;
import com.fitzone.modulo.gimnasio.service.TerminalSedeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/accesos")
@RequiredArgsConstructor
@Tag(name = "Terminal de sede", description = "Operación del control de acceso sin conexión con el servidor central (RNF-01)")
public class TerminalSedeController {

    private final TerminalSedeService terminalSedeService;

    @GetMapping("/terminal/habilitados")
    @PreAuthorize("hasAnyRole('RECEPCIONISTA', 'GERENTE')")
    @Operation(summary = "Lista local para validar sin conexión: socios con membresía vigente, accesos abiertos de la sede y aforo")
    public HabilitadosResponse habilitados(@RequestParam(required = false) @Positive Long idSede) {
        return terminalSedeService.habilitados(idSede);
    }

    @PostMapping("/sincronizacion")
    @PreAuthorize("hasAnyRole('RECEPCIONISTA', 'GERENTE')")
    @Operation(summary = "Confirma los ingresos aprobados sin conexión. Responde 200 con el resultado de cada evento")
    public SincronizacionResponse sincronizar(@Valid @RequestBody SincronizacionRequest request) {
        return terminalSedeService.sincronizar(request.getEventos());
    }
}
