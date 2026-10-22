package com.fitzone.modulo.pagos.controller;

import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.service.ComprobanteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/comprobantes")
@RequiredArgsConstructor
@Tag(name = "Comprobantes", description = "Endpoints de descarga y visualización de comprobantes oficiales de pago en PDF")
public class ComprobanteController {

    private final ComprobanteService comprobanteService;

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Descarga o visualización del comprobante de pago en formato PDF")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable @Positive Long id) {
        Comprobante comprobante = comprobanteService.obtenerPorId(id);
        byte[] pdfBytes = comprobanteService.generarPdf(id);

        String filename = "comprobante-" + comprobante.getNumeroFactura() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }
}
