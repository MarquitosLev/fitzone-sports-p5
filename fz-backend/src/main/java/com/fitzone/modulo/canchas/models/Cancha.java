package com.fitzone.modulo.canchas.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Sede sede;

    @NotBlank(message = "El nombre de la cancha es obligatorio")
    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "tipo", length = 50)
    private String tipo;

    @NotNull(message = "El precio base por hora es obligatorio")
    @Positive(message = "El precio base por hora debe ser mayor a 0")
    @Column(name = "precio_base_hora", nullable = false)
    private BigDecimal precioBaseHora;

    @Column(name = "en_mantenimiento", nullable = false)
    @Builder.Default
    private boolean enMantenimiento = false;

    @JsonProperty("idSede")
    public void setIdSede(Long idSede) {
        if (idSede != null) {
            if (this.sede == null) {
                this.sede = Sede.builder().idSede(idSede).build();
            } else {
                this.sede.setIdSede(idSede);
            }
        }
    }
}
