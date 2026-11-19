package com.fitzone.modulo.canchas.models;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class ReservaCanchaTest {

    private ReservaCancha creadaHace(int minutos) {
        ReservaCancha reserva = new ReservaCancha();
        reserva.setCreatedAt(LocalDateTime.now().minusMinutes(minutos));
        return reserva;
    }

    @Test
    @DisplayName("Dentro de los 5 minutos la reserva sin pagar sigue reteniendo el turno")
    void retencionVigente() {
        assertThat(creadaHace(4).retencionVencida()).isFalse();
    }

    @Test
    @DisplayName("Pasados los 5 minutos la retención vence")
    void retencionVencida() {
        assertThat(creadaHace(6).retencionVencida()).isTrue();
    }

    @Test
    @DisplayName("Sin fecha de creación se la considera vigente, igual que en las consultas")
    void sinFechaDeCreacion() {
        assertThat(new ReservaCancha().retencionVencida()).isFalse();
    }

    @Test
    @DisplayName("El JSON de la reserva expone retencionVencida para que el front no compare fechas")
    void retencionVencidaEnElJson() throws Exception {
        String json = new ObjectMapper().registerModule(new JavaTimeModule()).writeValueAsString(creadaHace(6));
        assertThat(json).contains("\"retencionVencida\":true");
    }
}
