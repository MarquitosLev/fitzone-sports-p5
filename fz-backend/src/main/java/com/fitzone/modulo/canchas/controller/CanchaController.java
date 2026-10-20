package com.fitzone.modulo.canchas.controller;

import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.service.CanchaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/canchas")
@RequiredArgsConstructor
@Tag(name = "Canchas", description = "Endpoints de gestión de canchas y mantenimiento")
public class CanchaController {

    private final CanchaService canchaService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Alta de una nueva cancha")
    public Cancha crear(@Valid @RequestBody Cancha cancha) {
        return canchaService.crear(cancha);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edición de una cancha")
    public Cancha actualizar(@PathVariable @Positive Long id, @Valid @RequestBody Cancha cancha) {
        return canchaService.actualizar(id, cancha);
    }

    @GetMapping
    @Operation(summary = "Listado de canchas de la sede (aislamiento por sede)")
    public List<Cancha> listar(
            @RequestParam @NotNull(message = "El idSede es obligatorio") @Positive Long idSede,
            @RequestParam(required = false) String tipo) {
        return canchaService.listar(idSede, tipo);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de una cancha por ID")
    public Cancha obtenerPorId(@PathVariable @Positive Long id) {
        return canchaService.obtenerPorId(id);
    }

    @PatchMapping("/{id}/mantenimiento")
    @Operation(summary = "Inhabilitar o habilitar una cancha por mantenimiento")
    public Cancha cambiarMantenimiento(@PathVariable @Positive Long id, @RequestBody Map<String, Boolean> body) {
        boolean enMantenimiento = body.getOrDefault("enMantenimiento", false);
        return canchaService.cambiarMantenimiento(id, enMantenimiento);
    }

    @GetMapping("/{id}/cotizacion")
    @Operation(summary = "Cotización y desglose dinámico del precio de un turno")
    public CotizacionDTO cotizar(
            @PathVariable @Positive Long id,
            @RequestParam(required = false) Long idUsuario,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return canchaService.cotizar(id, idUsuario, inicio, fin);
    }
}
