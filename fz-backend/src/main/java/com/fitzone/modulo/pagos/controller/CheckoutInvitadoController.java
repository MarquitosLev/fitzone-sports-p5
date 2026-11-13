package com.fitzone.modulo.pagos.controller;

import com.fitzone.modulo.pagos.models.PagoInvitadoRequest;
import com.fitzone.modulo.pagos.models.PagoInvitadoResponse;
import com.fitzone.modulo.pagos.models.ReservaInvitadoRequest;
import com.fitzone.modulo.pagos.models.ReservaInvitadoResponse;
import com.fitzone.modulo.pagos.service.CheckoutInvitadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/invitados/reservas")
@RequiredArgsConstructor
@Tag(name = "Checkout de invitado", description = "Reserva, pago y comprobante de una cancha sin cuenta; el código de la reserva da el acceso")
public class CheckoutInvitadoController {

    private final CheckoutInvitadoService checkoutInvitadoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Reserva de un turno como invitado; devuelve el código para pagar y descargar el comprobante")
    public ReservaInvitadoResponse reservar(@Valid @RequestBody ReservaInvitadoRequest request) {
        return checkoutInvitadoService.reservar(request);
    }

    @GetMapping("/{codigo}")
    @Operation(summary = "Detalle de la reserva de invitado por su código")
    public ReservaInvitadoResponse obtener(@PathVariable UUID codigo) {
        return checkoutInvitadoService.obtener(codigo);
    }

    @PostMapping("/{codigo}/pago")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Pago simulado de la reserva de invitado, siempre sin descuento")
    public PagoInvitadoResponse pagar(@PathVariable UUID codigo,
                                      @RequestBody(required = false) PagoInvitadoRequest request) {
        boolean forzarRechazo = request != null && Boolean.TRUE.equals(request.getForzarRechazo());
        return checkoutInvitadoService.pagar(codigo, forzarRechazo);
    }

    @GetMapping(value = "/{codigo}/comprobante/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Descarga del comprobante en PDF de la reserva de invitado")
    public ResponseEntity<byte[]> descargarComprobante(@PathVariable UUID codigo) {
        CheckoutInvitadoService.ComprobantePdf pdf = checkoutInvitadoService.comprobantePdf(codigo);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"comprobante-" + pdf.numeroFactura() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.contenido().length)
                .body(pdf.contenido());
    }
}
