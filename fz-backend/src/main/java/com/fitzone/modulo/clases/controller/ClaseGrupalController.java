package com.fitzone.modulo.clases.controller;

import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.service.ClaseGrupalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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

@RestController
@RequestMapping("/clases")
@RequiredArgsConstructor
@Tag(name = "Clases Grupales", description = "Endpoints de gestión y consulta de agenda de clases grupales")
public class ClaseGrupalController {

    private final ClaseGrupalService claseGrupalService;
    private final com.fitzone.modulo.clases.service.ReservaClaseService reservaClaseService;
    private final com.fitzone.modulo.clases.service.ListaEsperaService listaEsperaService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Alta de una nueva clase grupal")
    public ClaseGrupal crear(@Valid @RequestBody ClaseGrupal clase) {
        return claseGrupalService.crear(clase);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edición de una clase grupal")
    public ClaseGrupal actualizar(@PathVariable @Positive Long id, @Valid @RequestBody ClaseGrupal clase) {
        return claseGrupalService.actualizar(id, clase);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Baja de una clase grupal (no permitida si tiene reservas confirmadas)")
    public void eliminar(@PathVariable @Positive Long id) {
        claseGrupalService.eliminar(id);
    }

    @GetMapping
    @Operation(summary = "Agenda de clases grupales de una sede con cupo disponible calculado")
    public List<ClaseGrupal> listar(
            @RequestParam @NotNull(message = "El idSede es obligatorio") @Positive Long idSede,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {
        return claseGrupalService.listar(idSede, desde, hasta);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de una clase grupal con cupo disponible calculado")
    public ClaseGrupal obtenerPorId(@PathVariable @Positive Long id) {
        return claseGrupalService.obtenerPorId(id);
    }

    @PostMapping("/{id}/reservas")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Reserva de cupo en una clase grupal para un socio")
    public com.fitzone.modulo.clases.models.ReservaClase reservar(
            @PathVariable @Positive Long id,
            @Valid @RequestBody com.fitzone.modulo.clases.models.ReservaClaseRequest request) {
        return reservaClaseService.reservar(id, request.getIdUsuario());
    }

    @GetMapping("/{id}/reservas")
    @Operation(summary = "Lista de socios inscriptos con reserva confirmada en una clase grupal")
    public List<com.fitzone.modulo.clases.models.ReservaClase> listarInscriptos(@PathVariable @Positive Long id) {
        return reservaClaseService.listarInscriptos(id);
    }

    @PostMapping("/{id}/lista-espera")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Anotarse en la lista de espera de una clase completa")
    public com.fitzone.modulo.clases.models.ListaEspera anotarseEnListaEspera(
            @PathVariable @Positive Long id,
            @Valid @RequestBody com.fitzone.modulo.clases.models.ReservaClaseRequest request) {
        return listaEsperaService.anotarse(id, request.getIdUsuario());
    }

    @GetMapping("/{id}/lista-espera")
    @Operation(summary = "Obtiene la cola de espera ordenada por turno (FIFO) de una clase grupal")
    public List<com.fitzone.modulo.clases.models.ListaEspera> listarListaEspera(@PathVariable @Positive Long id) {
        return listaEsperaService.listarPorClase(id);
    }
}
