package com.fitzone.modulo.usuarios.controller;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.service.MembresiaService;
import com.fitzone.modulo.usuarios.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuarios", description = "Endpoints de registro, perfil, búsqueda y edición de usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final MembresiaService membresiaService;
    private final com.fitzone.modulo.clases.service.ReservaClaseService reservaClaseService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Alta de un nuevo usuario (socio, externo, recepcionista o gerente)")
    public Usuario crear(
            @Valid @RequestBody Usuario usuario,
            @Parameter(description = "ID del usuario que realiza el alta (opcional en fase inicial, por defecto operador sistema)")
            @RequestParam(required = false) @Positive Long idOperador) {
        return usuarioService.crear(usuario, idOperador);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle del perfil de un usuario por su ID interno")
    public Usuario obtenerPorId(@PathVariable @Positive Long id) {
        return usuarioService.obtenerPorId(id);
    }

    @GetMapping("/{id}/membresia")
    @Operation(summary = "Obtiene la membresía vigente (activa o suspendida) de un usuario")
    public Membresia obtenerMembresiaVigente(@PathVariable @Positive Long id) {
        return membresiaService.obtenerVigentePorUsuario(id);
    }

    @GetMapping("/{id}/reservas-clase")
    @Operation(summary = "Obtiene las reservas de clases grupales de un socio")
    public List<com.fitzone.modulo.clases.models.ReservaClase> obtenerMisReservas(@PathVariable @Positive Long id) {
        return reservaClaseService.listarPorUsuario(id);
    }

    @GetMapping
    @Operation(summary = "Búsqueda y listado de usuarios con filtros opcionales por DNI, tipo y/o sede")
    public List<Usuario> buscar(
            @Parameter(description = "DNI para filtrar usuarios de forma exacta")
            @RequestParam(required = false) String dni,
            @Parameter(description = "Tipo de usuario (SOCIO, EXTERNO, RECEPCIONISTA, GERENTE)")
            @RequestParam(required = false) TipoUsuario tipo,
            @Parameter(description = "ID de sede para filtrar usuarios")
            @RequestParam(required = false) @Positive Long idSede) {
        return usuarioService.buscar(dni, tipo, idSede);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edición de datos de perfil de un usuario")
    public Usuario actualizar(
            @PathVariable @Positive Long id,
            @Valid @RequestBody Usuario usuario,
            @Parameter(description = "ID del usuario que realiza la modificación (opcional en fase inicial, por defecto operador sistema)")
            @RequestParam(required = false) @Positive Long idOperador) {
        return usuarioService.actualizar(id, usuario, idOperador);
    }
}

