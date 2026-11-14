package com.fitzone.modulo.gimnasio.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Copia local que el terminal de sede usa para validar ingresos sin conexión.
 * Solo lleva datos que se pueden mostrar: ningún secreto del QR.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabilitadosResponse {

    private Instant horaServidor;
    private Instant validaHasta;
    private Long idSede;
    private Integer aforoMaximo;
    private List<SocioHabilitado> socios;
    private List<AccesoAbierto> adentro;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SocioHabilitado {
        private Long idUsuario;
        private String nombre;
        private String apellido;
        private String dni;
        private LocalDate venceMembresia;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AccesoAbierto {
        private Long idAcceso;
        private Long idUsuario;
        private String tokenQr;
        private LocalDateTime fechaHoraIngreso;
    }
}
