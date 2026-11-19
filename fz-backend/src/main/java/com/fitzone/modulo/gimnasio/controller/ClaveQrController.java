package com.fitzone.modulo.gimnasio.controller;

import com.fitzone.modulo.gimnasio.service.QrFirmadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/usuarios/me/clave-qr")
@RequiredArgsConstructor
@Tag(name = "Pase QR firmado", description = "Registro de la clave del dispositivo con la que el socio firma su QR sin conexión (RNF-01)")
public class ClaveQrController {

    private final QrFirmadoService qrFirmadoService;

    public record RegistroClaveRequest(
            @NotBlank(message = "La clave pública es obligatoria")
            @Size(max = 200, message = "La clave pública no puede superar los 200 caracteres")
            String clavePublica) {
    }

    /** horaServidor le permite al dispositivo corregir su reloj para firmar sin conexión. */
    public record RegistroClaveResponse(Instant horaServidor) {
    }

    @PutMapping
    @PreAuthorize("hasRole('SOCIO')")
    @Operation(summary = "Registra la clave pública ECDSA P-256 (SPKI base64) del dispositivo del socio en sesión")
    public RegistroClaveResponse registrar(@Valid @RequestBody RegistroClaveRequest request) {
        qrFirmadoService.registrarClave(request.clavePublica());
        return new RegistroClaveResponse(Instant.now());
    }
}
