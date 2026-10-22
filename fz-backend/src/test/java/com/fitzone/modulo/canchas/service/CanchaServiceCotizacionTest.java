package com.fitzone.modulo.canchas.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.repository.CanchaRepository;
import com.fitzone.modulo.canchas.repository.ReservaCanchaRepository;
import com.fitzone.modulo.canchas.strategy.CalculadorPrecioCancha;
import com.fitzone.modulo.canchas.strategy.DescuentoSocioEstrategia;
import com.fitzone.modulo.canchas.strategy.PrecioBaseEstrategia;
import com.fitzone.modulo.canchas.strategy.RecargoHorarioPicoEstrategia;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CanchaServiceCotizacionTest {

    @Mock
    private CanchaRepository canchaRepository;

    @Mock
    private ReservaCanchaRepository reservaCanchaRepository;

    @Mock
    private SedeRepository sedeRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    private CanchaService canchaService;
    private Cancha cancha;
    private LocalDateTime inicio;
    private LocalDateTime fin;

    @BeforeEach
    void setUp() {
        CalculadorPrecioCancha calculador = new CalculadorPrecioCancha(List.of(
                new PrecioBaseEstrategia(),
                new RecargoHorarioPicoEstrategia(new BigDecimal("0.20")),
                new DescuentoSocioEstrategia()
        ));

        canchaService = new CanchaService(
                canchaRepository,
                reservaCanchaRepository,
                sedeRepository,
                usuarioRepository,
                membresiaRepository,
                calculador
        );

        cancha = Cancha.builder()
                .idCancha(1L)
                .nombre("Cancha Tenis")
                .precioBaseHora(new BigDecimal("10000.00"))
                .build();

        // Mañana de 10:00 a 12:00 (2 hs fuera de horario pico)
        inicio = LocalDate.now().plusDays(1).atTime(10, 0);
        fin = inicio.plusHours(2);
    }

    @Test
    @DisplayName("Cotizar: lanza ReglaNegocioException si inicio es posterior o igual a fin")
    void testCotizarFechasInvalidas() {
        assertThatThrownBy(() -> canchaService.cotizar(1L, null, fin, inicio))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("anterior a la de fin");
    }

    @Test
    @DisplayName("Cotizar: usuario externo (idUsuario null) en horario normal cotiza base sin descuento")
    void testCotizarUsuarioExterno() {
        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));

        CotizacionDTO resultado = canchaService.cotizar(1L, null, inicio, fin);

        assertThat(resultado.getPrecioBase()).isEqualByComparingTo("20000.00");
        assertThat(resultado.getDescuento()).isEqualByComparingTo("0.00");
        assertThat(resultado.getRecargo()).isEqualByComparingTo("0.00");
        assertThat(resultado.getPrecioFinal()).isEqualByComparingTo("20000.00");
    }

    @Test
    @DisplayName("Cotizar: socio con membresía activa recibe 15% de descuento en el total")
    void testCotizarSocioActivo() {
        Usuario usuario = Usuario.builder()
                .idUsuario(10L)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(usuario));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                10L, List.of(EstadoMembresia.ACTIVO), LocalDate.now())).thenReturn(true);

        CotizacionDTO resultado = canchaService.cotizar(1L, 10L, inicio, fin);

        // 2 hs a $10.000 = $20.000 base -> 15% desc ($3.000) -> final $17.000
        assertThat(resultado.getPrecioBase()).isEqualByComparingTo("20000.00");
        assertThat(resultado.getDescuento()).isEqualByComparingTo("3000.00");
        assertThat(resultado.getRecargo()).isEqualByComparingTo("0.00");
        assertThat(resultado.getPrecioFinal()).isEqualByComparingTo("17000.00");
    }

    @Test
    @DisplayName("Cotizar: socio con membresía vencida no recibe descuento")
    void testCotizarSocioVencido() {
        Usuario usuario = Usuario.builder()
                .idUsuario(10L)
                .tipoUsuario(TipoUsuario.SOCIO)
                .build();

        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(usuario));
        when(membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                10L, List.of(EstadoMembresia.ACTIVO), LocalDate.now())).thenReturn(false);

        CotizacionDTO resultado = canchaService.cotizar(1L, 10L, inicio, fin);

        assertThat(resultado.getPrecioBase()).isEqualByComparingTo("20000.00");
        assertThat(resultado.getDescuento()).isEqualByComparingTo("0.00");
        assertThat(resultado.getPrecioFinal()).isEqualByComparingTo("20000.00");
    }

    @Test
    @DisplayName("Cotizar: usuario inexistente lanza RecursoNoEncontradoException")
    void testCotizarUsuarioInexistente() {
        when(canchaRepository.findById(1L)).thenReturn(Optional.of(cancha));
        when(usuarioRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> canchaService.cotizar(1L, 999L, inicio, fin))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }
}
