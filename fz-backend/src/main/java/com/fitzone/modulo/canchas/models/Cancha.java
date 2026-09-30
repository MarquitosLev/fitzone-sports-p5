package com.fitzone.modulo.canchas.models;

import com.fitzone.core.domain.common.BaseEntity;
import com.fitzone.modulo.gimnasio.models.Sede;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(name = "fz_cch_canchas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cancha extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cancha", updatable = false, nullable = false)
    private Long idCancha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_sede", nullable = false)
    private Sede sede;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "precio_base_hora", nullable = false)
    private BigDecimal precioBaseHora;

    @Column(name = "en_mantenimiento", nullable = false)
    @Builder.Default
    private boolean enMantenimiento = false;
}
