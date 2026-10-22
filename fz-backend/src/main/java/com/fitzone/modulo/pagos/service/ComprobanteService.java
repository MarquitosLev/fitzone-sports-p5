package com.fitzone.modulo.pagos.service;

import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComprobanteService {

    private final ComprobanteRepository comprobanteRepository;
    private final TransaccionRepository transaccionRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Transactional
    public synchronized Comprobante generarComprobante(Transaccion transaccion) {
        if (transaccion.getEstadoPago() != EstadoPago.CONFIRMADO) {
            throw new ReglaNegocioException("El comprobante solo puede generarse para transacciones con estado CONFIRMADO");
        }

        Optional<Comprobante> comprobanteExistente = comprobanteRepository
                .findByTransaccion_IdTransaccion(transaccion.getIdTransaccion());
        if (comprobanteExistente.isPresent()) {
            return comprobanteExistente.get();
        }

        String numeroFactura = generarSiguienteNumeroFactura();

        Comprobante nuevoComprobante = Comprobante.builder()
                .transaccion(transaccion)
                .numeroFactura(numeroFactura)
                .build();

        Comprobante guardado = comprobanteRepository.save(nuevoComprobante);
        log.info("Comprobante generado exitosamente: id={}, numeroFactura={}, idTransaccion={}",
                guardado.getIdComprobante(), guardado.getNumeroFactura(), transaccion.getIdTransaccion());

        return guardado;
    }

    @Transactional(readOnly = true)
    public Comprobante obtenerPorId(Long idComprobante) {
        return comprobanteRepository.findById(idComprobante)
                .orElseThrow(() -> new RecursoNoEncontradoException("Comprobante", idComprobante));
    }

    @Transactional(readOnly = true)
    public Comprobante obtenerPorIdTransaccion(Long idTransaccion) {
        Transaccion transaccion = transaccionRepository.findById(idTransaccion)
                .orElseThrow(() -> new RecursoNoEncontradoException("Transacción", idTransaccion));

        if (transaccion.getEstadoPago() != EstadoPago.CONFIRMADO) {
            throw new ReglaNegocioException("La transacción no se encuentra confirmada y no posee comprobante");
        }

        return comprobanteRepository.findByTransaccion_IdTransaccion(idTransaccion)
                .orElseThrow(() -> new RecursoNoEncontradoException("Comprobante para la transacción", idTransaccion));
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long idComprobante) {
        Comprobante comprobante = obtenerPorId(idComprobante);
        Transaccion transaccion = comprobante.getTransaccion();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(document, out);
            document.open();

            Font fontTitulo = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(15, 23, 42));
            Font fontSubtitulo = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(71, 85, 105));
            Font fontHeader = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
            Font fontBody = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(51, 65, 85));
            Font fontBodyBold = new Font(Font.HELVETICA, 10, Font.BOLD, new Color(15, 23, 42));
            Font fontFooter = new Font(Font.HELVETICA, 8, Font.ITALIC, new Color(148, 163, 184));

            // Encabezado
            Paragraph marca = new Paragraph("FITZONE SPORTS CLUB", fontTitulo);
            marca.setAlignment(Element.ALIGN_CENTER);
            document.add(marca);

            Paragraph comprobanteHeader = new Paragraph("COMPROBANTE OFICIAL DE PAGO", fontSubtitulo);
            comprobanteHeader.setAlignment(Element.ALIGN_CENTER);
            comprobanteHeader.setSpacingAfter(15);
            document.add(comprobanteHeader);

            // Tabla de datos generales
            PdfPTable tablaDatos = new PdfPTable(2);
            tablaDatos.setWidthPercentage(100);
            tablaDatos.setSpacingAfter(20);

            Usuario usuario = transaccion.getUsuario();
            String nombreSocio = (usuario != null)
                    ? (usuario.getNombre() + " " + usuario.getApellido())
                    : "Socio no especificado";
            String dniSocio = (usuario != null && usuario.getDni() != null) ? usuario.getDni() : "-";
            String sedeNombre = (transaccion.getSede() != null) ? transaccion.getSede().getNombre() : "-";
            String fechaEmision = (transaccion.getFechaHoraConfirmacion() != null)
                    ? transaccion.getFechaHoraConfirmacion().format(DATE_TIME_FORMATTER)
                    : "-";

            agregarCeldaDato(tablaDatos, "Número de Factura:", comprobante.getNumeroFactura(), fontBodyBold, fontBody);
            agregarCeldaDato(tablaDatos, "Fecha de Emisión:", fechaEmision, fontBodyBold, fontBody);
            agregarCeldaDato(tablaDatos, "Socio / Cliente:", nombreSocio, fontBodyBold, fontBody);
            agregarCeldaDato(tablaDatos, "DNI:", dniSocio, fontBodyBold, fontBody);
            agregarCeldaDato(tablaDatos, "Sede:", sedeNombre, fontBodyBold, fontBody);
            agregarCeldaDato(tablaDatos, "Estado:", transaccion.getEstadoPago().name(), fontBodyBold, fontBody);
            document.add(tablaDatos);

            // Tabla de detalle del concepto
            if (transaccion.getConcepto() == TipoOrigenTransaccion.RESERVA_CANCHA) {
                document.add(construirTablaReservaCancha(transaccion, fontHeader, fontBody));
            } else if (transaccion.getConcepto() == TipoOrigenTransaccion.MEMBRESIA) {
                document.add(construirTablaMembresia(transaccion, fontHeader, fontBody));
            }

            // Resumen de total
            PdfPTable tablaTotal = new PdfPTable(2);
            tablaTotal.setWidthPercentage(100);
            tablaTotal.setWidths(new float[]{75, 25});
            tablaTotal.setSpacingBefore(15);

            PdfPCell celdaTotalLabel = new PdfPCell(new Phrase("TOTAL PAGADO:", fontBodyBold));
            celdaTotalLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
            celdaTotalLabel.setBorder(PdfPCell.TOP | PdfPCell.BOTTOM);
            celdaTotalLabel.setPadding(8);

            PdfPCell celdaTotalValor = new PdfPCell(new Phrase("$" + transaccion.getMonto(), fontBodyBold));
            celdaTotalValor.setHorizontalAlignment(Element.ALIGN_RIGHT);
            celdaTotalValor.setBorder(PdfPCell.TOP | PdfPCell.BOTTOM);
            celdaTotalValor.setPadding(8);

            tablaTotal.addCell(celdaTotalLabel);
            tablaTotal.addCell(celdaTotalValor);
            document.add(tablaTotal);

            // Pie de página
            Paragraph pie = new Paragraph("\nEste documento es comprobante de pago electrónico de FitZone Sports Club.\nConservá este comprobante como respaldo de tu reserva o suscripción.", fontFooter);
            pie.setAlignment(Element.ALIGN_CENTER);
            pie.setSpacingBefore(30);
            document.add(pie);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Error al generar PDF del comprobante id={}: {}", idComprobante, e.getMessage(), e);
            throw new ReglaNegocioException("Error al generar el documento PDF del comprobante: " + e.getMessage());
        }
    }

    private PdfPTable construirTablaReservaCancha(Transaccion transaccion, Font fontHeader, Font fontBody) {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{30, 25, 25, 20});

        agregarCeldaHeader(table, "Cancha", fontHeader);
        agregarCeldaHeader(table, "Fecha", fontHeader);
        agregarCeldaHeader(table, "Horario", fontHeader);
        agregarCeldaHeader(table, "Subtotal", fontHeader);

        ReservaCancha reserva = transaccion.getReservaCancha();
        String canchaNombre = (reserva != null && reserva.getCancha() != null)
                ? reserva.getCancha().getNombre()
                : "Cancha";
        String fecha = (reserva != null && reserva.getFechaHoraInicio() != null)
                ? reserva.getFechaHoraInicio().format(DATE_FORMATTER)
                : "-";
        String horario = (reserva != null && reserva.getFechaHoraInicio() != null && reserva.getFechaHoraFin() != null)
                ? reserva.getFechaHoraInicio().format(TIME_FORMATTER) + " - " + reserva.getFechaHoraFin().format(TIME_FORMATTER)
                : "-";
        String subtotal = "$" + transaccion.getMonto();

        agregarCeldaContenido(table, canchaNombre, fontBody, Element.ALIGN_LEFT);
        agregarCeldaContenido(table, fecha, fontBody, Element.ALIGN_CENTER);
        agregarCeldaContenido(table, horario, fontBody, Element.ALIGN_CENTER);
        agregarCeldaContenido(table, subtotal, fontBody, Element.ALIGN_RIGHT);

        return table;
    }

    private PdfPTable construirTablaMembresia(Transaccion transaccion, Font fontHeader, Font fontBody) {
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{45, 30, 25});

        agregarCeldaHeader(table, "Plan", fontHeader);
        agregarCeldaHeader(table, "Nuevo Vencimiento", fontHeader);
        agregarCeldaHeader(table, "Subtotal", fontHeader);

        Membresia membresia = transaccion.getMembresia();
        String planNombre = (membresia != null && membresia.getPlan() != null)
                ? membresia.getPlan().getNombre()
                : "Plan Membresía";
        String vencimiento = (membresia != null && membresia.getFechaVencimiento() != null)
                ? membresia.getFechaVencimiento().format(DATE_FORMATTER)
                : "-";
        String subtotal = "$" + transaccion.getMonto();

        agregarCeldaContenido(table, planNombre, fontBody, Element.ALIGN_LEFT);
        agregarCeldaContenido(table, vencimiento, fontBody, Element.ALIGN_CENTER);
        agregarCeldaContenido(table, subtotal, fontBody, Element.ALIGN_RIGHT);

        return table;
    }

    private void agregarCeldaHeader(PdfPTable table, String texto, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setBackgroundColor(new Color(30, 41, 59));
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void agregarCeldaContenido(PdfPTable table, String texto, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setPadding(6);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private void agregarCeldaDato(PdfPTable table, String label, String valor, Font fontLabel, Font fontValor) {
        PdfPCell cellLabel = new PdfPCell(new Phrase(label, fontLabel));
        cellLabel.setBorder(PdfPCell.NO_BORDER);
        cellLabel.setPadding(3);
        table.addCell(cellLabel);

        PdfPCell cellValor = new PdfPCell(new Phrase(valor, fontValor));
        cellValor.setBorder(PdfPCell.NO_BORDER);
        cellValor.setPadding(3);
        table.addCell(cellValor);
    }

    private String generarSiguienteNumeroFactura() {
        Optional<Comprobante> ultimo = comprobanteRepository.findTopByOrderByIdComprobanteDesc();
        long siguienteSecuencia = 1L;

        if (ultimo.isPresent() && ultimo.get().getNumeroFactura() != null) {
            String anterior = ultimo.get().getNumeroFactura();
            String[] partes = anterior.split("-");
            if (partes.length == 2) {
                try {
                    siguienteSecuencia = Long.parseLong(partes[1]) + 1;
                } catch (NumberFormatException ignored) {
                    siguienteSecuencia = ultimo.get().getIdComprobante() + 1;
                }
            }
        }

        return String.format("%04d-%08d", 1, siguienteSecuencia);
    }
}
