package com.fitzone.core.controller;

import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.exception.RespuestaError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de ejemplo para ver y probar el formato común de error. No se registran con el perfil prod.
 */
@Profile("!prod")
@Tag(name = "Prueba de errores", description = "Ejemplos del formato común de error (no disponibles en prod)")
@RestController
@RequestMapping("/prueba")
public class PruebaErroresController {

    public record PruebaValidacionRequest(
            @NotBlank String nombre,
            @NotBlank @Email String email,
            @NotNull @Min(1) @Max(50) Integer cupo) {
    }

    public record PruebaValidacionResponse(String mensaje) {
    }

    @Operation(summary = "400 si el body no cumple las validaciones")
    @ApiResponse(responseCode = "400", description = "Campos inválidos",
            content = @Content(schema = @Schema(implementation = RespuestaError.class)))
    @PostMapping("/validacion")
    public PruebaValidacionResponse validarBody(@Valid @RequestBody PruebaValidacionRequest request) {
        return new PruebaValidacionResponse("Datos válidos para " + request.nombre());
    }

    @Operation(summary = "400 si el parámetro falta, no es numérico o no es positivo")
    @ApiResponse(responseCode = "400", description = "Parámetro inválido",
            content = @Content(schema = @Schema(implementation = RespuestaError.class)))
    @GetMapping("/parametros")
    public PruebaValidacionResponse validarParametro(@RequestParam @Positive Long idSede) {
        return new PruebaValidacionResponse("Sede " + idSede + " válida");
    }

    @Operation(summary = "Siempre responde 404")
    @ApiResponse(responseCode = "404", description = "Recurso inexistente",
            content = @Content(schema = @Schema(implementation = RespuestaError.class)))
    @GetMapping("/no-encontrado/{id}")
    public void noEncontrado(@PathVariable Long id) {
        throw new RecursoNoEncontradoException("Sede", id);
    }

    @Operation(summary = "Siempre responde 409")
    @ApiResponse(responseCode = "409", description = "Conflicto con el estado actual",
            content = @Content(schema = @Schema(implementation = RespuestaError.class)))
    @GetMapping("/conflicto")
    public void conflicto() {
        throw new ConflictoException("La cancha ya tiene una reserva en ese horario");
    }

    @Operation(summary = "Siempre responde 422")
    @ApiResponse(responseCode = "422", description = "Regla de negocio incumplida",
            content = @Content(schema = @Schema(implementation = RespuestaError.class)))
    @GetMapping("/regla-negocio")
    public void reglaNegocio() {
        throw new ReglaNegocioException("La membresía del socio está vencida: no puede reservar clases");
    }
}
