package com.fitzone.modulo.usuarios.controller;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.service.MembresiaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/membresias")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECEPCIONISTA', 'GERENTE')")
@Tag(name = "Membresías", description = "Endpoints de gestión de membresías de socios")
public class MembresiaController {

    private final MembresiaService membresiaService;

    @GetMapping
    @Operation(summary = "Listado general de todas las membresías registradas")
    public List<Membresia> listar() {
        return membresiaService.listarTodas();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtiene el detalle de una membresía por su ID")
    public Membresia obtenerPorId(@PathVariable @Positive Long id) {
        return membresiaService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Alta de una nueva membresía para un socio")
    public Membresia crear(@RequestBody Membresia membresia) {
        membresia.setIdMembresia(null);
        return membresiaService.crear(membresia);
    }

    @PostMapping("/{id}/renovar")
    @Operation(summary = "Renovación manual de una membresía existente")
    public Membresia renovar(
            @PathVariable @Positive Long id,
            @RequestBody(required = false) Map<String, Integer> body) {
        Integer idPlan = body != null ? body.get("idPlan") : null;
        return membresiaService.renovar(id, idPlan);
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Cambio de estado de una membresía (suspender, reactivar o cancelar)")
    public Membresia cambiarEstado(
            @PathVariable @Positive Long id,
            @RequestBody Map<String, String> body) {
        String estadoStr = body != null ? body.get("estado") : null;
        if (estadoStr == null || estadoStr.trim().isEmpty()) {
            throw new ReglaNegocioException("Debe indicar el campo 'estado' en el cuerpo de la solicitud");
        }

        EstadoMembresia nuevoEstado;
        try {
            nuevoEstado = EstadoMembresia.valueOf(estadoStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ReglaNegocioException("Estado inválido. Los estados permitidos son: ACTIVO, SUSPENDIDO, CANCELADO");
        }

        return membresiaService.cambiarEstado(id, nuevoEstado);
    }
}
