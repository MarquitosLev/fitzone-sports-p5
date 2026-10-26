package com.fitzone.modulo.gimnasio.controller;

import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.AforoSede;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.service.SedeService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/sedes")
@RequiredArgsConstructor
@Tag(name = "Sedes", description = "Endpoints de gestión de sedes y aforo en tiempo real")
public class SedeController {

    private final SedeService sedeService;

    @GetMapping
    @Operation(summary = "Listado de sedes")
    public List<Sede> listar() {
        return sedeService.listar();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de una sede por ID")
    public Sede obtenerPorId(@PathVariable @Positive Long id) {
        return sedeService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Alta de una nueva sede")
    public Sede crear(@Valid @RequestBody Sede sede) {
        return sedeService.crear(sede);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GERENTE')")
    @Operation(summary = "Edición de una sede (nombre y aforo máximo)")
    public Sede actualizar(@PathVariable @Positive Long id, @Valid @RequestBody Sede sede) {
        return sedeService.actualizar(id, sede);
    }

    @GetMapping("/{id}/aforo")
    @Operation(summary = "Consulta de aforo actual, máximo y porcentaje de ocupación en tiempo real")
    public AforoSede obtenerAforo(@PathVariable @Positive Long id) {
        return sedeService.obtenerAforo(id);
    }

    @GetMapping("/{id}/accesos/activos")
    @Operation(summary = "Listado de personas que están adentro de la sede ahora (accesos activos)")
    public List<Acceso> listarAccesosActivos(@PathVariable @Positive Long id) {
        return sedeService.listarAccesosActivos(id);
    }
}
