package com.fitzone.modulo.pagos.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fitzone.core.domain.common.BaseEntity;
import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fz_pag_transacciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaccion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_transaccion", updatable = false, nullable = false)
    private Long idTransaccion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_sede", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Sede sede;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_membresia")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Membresia membresia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva_cancha")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ReservaCancha reservaCancha;

    @Enumerated(EnumType.STRING)
    @Column(name = "concepto", nullable = false)
    private TipoOrigenTransaccion concepto;

    @Column(name = "monto", nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_pago", nullable = false)
    private EstadoPago estadoPago;

    @Column(name = "token_transaccion_pasarela")
    private String tokenTransaccionPasarela;

    @Column(name = "fecha_hora_creacion", nullable = false)
    private LocalDateTime fechaHoraCreacion;

    @Column(name = "fecha_hora_confirmacion")
    private LocalDateTime fechaHoraConfirmacion;
}
