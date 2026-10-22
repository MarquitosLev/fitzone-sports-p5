package com.fitzone.modulo.pagos.controller;

import com.fitzone.modulo.pagos.models.PagoRequest;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.service.PagoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/pagos")
@RequiredArgsConstructor
@Tag(name = "Pagos", description = "Endpoints de procesamiento de pagos y consulta de transacciones")
public class PagoController {

    private final PagoService pagoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Procesamiento de un pago simulado a través de la pasarela")
    public Transaccion procesarPago(@Valid @RequestBody PagoRequest request) {
        return pagoService.procesarPago(request);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta del estado y detalle de una transacción por su ID")
    public Transaccion obtenerPorId(@PathVariable @Positive Long id) {
        return pagoService.obtenerPorId(id);
    }
}
