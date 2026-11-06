package com.fitzone.modulo.canchas.strategy;

import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.usuarios.models.Usuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadorPrecioCanchaTest {

    private PrecioBaseEstrategia precioBaseEstrategia;
    private RecargoHorarioPicoEstrategia recargoHorarioPicoEstrategia;
    private DescuentoSocioEstrategia descuentoSocioEstrategia;
    private CalculadorPrecioCancha calculador;

    private Cancha cancha;

    @BeforeEach
    void setUp() {
        precioBaseEstrategia = new PrecioBaseEstrategia();
        recargoHorarioPicoEstrategia = new RecargoHorarioPicoEstrategia(new BigDecimal("0.20"));
        descuentoSocioEstrategia = new DescuentoSocioEstrategia();

        calculador = new CalculadorPrecioCancha(List.of(
                precioBaseEstrategia,
                recargoHorarioPicoEstrategia,
                descuentoSocioEstrategia
        ));

        cancha = Cancha.builder()
                .idCancha(1L)
                .nombre("Cancha Pádel 1")
                .precioBaseHora(new BigDecimal("10000.00"))
                .build();
    }

    @Test
    @DisplayName("Estrategia Base: Turno de 1 hora calcula tarifa base exacta")
    void testPrecioBaseUnaHora() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .inicio(fecha.atTime(10, 0))
                .fin(fecha.atTime(11, 0))
                .esSocioActivo(false)
                .build();

        precioBaseEstrategia.aplicar(contexto);

        assertThat(contexto.getPrecioBase()).isEqualByComparingTo("10000.00");
    }

    @Test
    @DisplayName("Estrategia Recargo Pico: Fuera de horario pico no aplica recargo")
    void testRecargoFueraDeHorarioPico() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .inicio(fecha.atTime(15, 0))
                .fin(fecha.atTime(17, 0))
                .build();

        contexto.setPrecioBase(new BigDecimal("20000.00"));
        recargoHorarioPicoEstrategia.aplicar(contexto);

        assertThat(contexto.getRecargo()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Estrategia Recargo Pico: Turno de 19:00 a 21:00 (2 hs pico) aplica 20% de recargo")
    void testRecargoHorarioPicoTotal() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .inicio(fecha.atTime(19, 0))
                .fin(fecha.atTime(21, 0))
                .build();

        // 2 horas pico a $10.000/h = $20.000 base -> recargo 20% = $4.000
        recargoHorarioPicoEstrategia.aplicar(contexto);

        assertThat(contexto.getRecargo()).isEqualByComparingTo("4000.00");
    }

    @Test
    @DisplayName("Estrategia Recargo Pico: Turno de 18:00 a 20:00 (1 h pico de 19 a 20) aplica recargo sobre 1 h")
    void testRecargoHorarioPicoParcial() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .inicio(fecha.atTime(18, 0))
                .fin(fecha.atTime(20, 0))
                .build();

        // 1 hora solapada en horario pico (19:00 a 20:00) a $10.000/h -> recargo 20% = $2.000
        recargoHorarioPicoEstrategia.aplicar(contexto);

        assertThat(contexto.getRecargo()).isEqualByComparingTo("2000.00");
    }

    @Test
    @DisplayName("Estrategia Descuento Socio: Socio activo recibe 15% de descuento sobre el precio base")
    void testDescuentoSocioActivo() {
        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .esSocioActivo(true)
                .build();
        contexto.setPrecioBase(new BigDecimal("20000.00"));

        descuentoSocioEstrategia.aplicar(contexto);

        // 15% de $20.000 = $3.000
        assertThat(contexto.getDescuento()).isEqualByComparingTo("3000.00");
    }

    @Test
    @DisplayName("Estrategia Descuento Socio: No socio o socio inactivo recibe $0 de descuento")
    void testDescuentoSocioInactivo() {
        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .esSocioActivo(false)
                .build();
        contexto.setPrecioBase(new BigDecimal("20000.00"));

        descuentoSocioEstrategia.aplicar(contexto);

        assertThat(contexto.getDescuento()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("Calculador en cadena: Invitado/Externo en horario normal paga tarifa estándar sin recargo ni descuento")
    void testCalculadorInvitadoHorarioNormal() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .inicio(fecha.atTime(10, 0))
                .fin(fecha.atTime(12, 0))
                .esSocioActivo(false)
                .build();

        CotizacionDTO cotizacion = calculador.calcular(contexto);

        assertThat(cotizacion.getPrecioBase()).isEqualByComparingTo("20000.00");
        assertThat(cotizacion.getDescuento()).isEqualByComparingTo("0.00");
        assertThat(cotizacion.getRecargo()).isEqualByComparingTo("0.00");
        assertThat(cotizacion.getPrecioFinal()).isEqualByComparingTo("20000.00");
    }

    @Test
    @DisplayName("Calculador en cadena: Socio con membresía activa en horario pico (combinación simultánea)")
    void testCalculadorSocioEnHorarioPico() {
        LocalDate fecha = LocalDate.now().plusDays(1);
        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .inicio(fecha.atTime(19, 0))
                .fin(fecha.atTime(21, 0))
                .esSocioActivo(true)
                .build();

        CotizacionDTO cotizacion = calculador.calcular(contexto);

        // Base 2 hs a $10.000 = $20.000
        assertThat(cotizacion.getPrecioBase()).isEqualByComparingTo("20000.00");
        // Descuento 15% de $20.000 = $3.000
        assertThat(cotizacion.getDescuento()).isEqualByComparingTo("3000.00");
        // Recargo pico 2 hs al 20% = $4.000
        assertThat(cotizacion.getRecargo()).isEqualByComparingTo("4000.00");
        // Precio final = 20.000 - 3.000 + 4.000 = 21.000
        assertThat(cotizacion.getPrecioFinal()).isEqualByComparingTo("21000.00");
    }
}
