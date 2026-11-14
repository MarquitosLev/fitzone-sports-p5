package com.fitzone.modulo.gimnasio.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Ingreso aprobado por el terminal sin conexión, pendiente de confirmar en el servidor.
 * {@code ocurrioEn} es un instante (ISO con zona) para que la hora del escaneo no dependa
 * de la zona horaria del navegador ni del servidor.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventoIngresoOffline {

    @NotBlank(message = "El token QR es obligatorio")
    @Size(max = 256, message = "El token QR no puede superar los 256 caracteres")
    private String tokenQr;

    @Positive(message = "El idSede debe ser positivo")
    private Long idSede;

    @NotNull(message = "La hora del escaneo es obligatoria")
    private Instant ocurrioEn;
}
