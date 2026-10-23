package com.fitzone.modulo.gimnasio.controller;

import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.IngresoRequest;
import com.fitzone.modulo.gimnasio.service.AccesoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/accesos")
@RequiredArgsConstructor
@Tag(name = "Accesos", description = "Endpoints de control de acceso físico mediante QR dinámico y egresos")
public class AccesoController {

    private final AccesoService accesoService;

    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPCIONISTA', 'GERENTE')")
    @Operation(summary = "Historial de accesos físicos de una sede ordenado por fecha de ingreso descendente")
    public List<Acceso> listarPorSede(@RequestParam @Positive Long idSede) {
        return accesoService.listarPorSede(idSede);
    }

    @PostMapping("/ingreso")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('RECEPCIONISTA', 'GERENTE')")
    @Operation(summary = "Valida token QR dinámico, membresía activa y aforo, y registra el ingreso a la sede")
    public Acceso registrarIngreso(@Valid @RequestBody IngresoRequest request) {
        return accesoService.registrarIngreso(request.getTokenQr(), request.getIdSede());
    }

    @PostMapping("/{id}/egreso")
    @PreAuthorize("hasAnyRole('RECEPCIONISTA', 'GERENTE')")
    @Operation(summary = "Registra la salida física del socio liberando cupo de aforo")
    public Acceso registrarEgreso(@PathVariable @Positive Long id) {
        return accesoService.registrarEgreso(id);
    }
}
