package com.fitzone.modulo.canchas.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fitzone.core.domain.common.BaseEntity;
import com.fitzone.modulo.usuarios.models.Usuario;
import jakarta.validation.constraints.NotNull;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
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
@Table(name = "fz_cch_reservas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservaCancha extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva_cancha", updatable = false, nullable = false)
    private Long idReservaCancha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cancha", nullable = false, foreignKey = @ForeignKey(name = "fk_cch_reservas_canchas"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Cancha cancha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false, foreignKey = @ForeignKey(name = "fk_cch_reservas_usuarios"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    @NotNull(message = "La fecha y hora de inicio es obligatoria")
    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;

    @NotNull(message = "La fecha y hora de fin es obligatoria")
    @Column(name = "fecha_hora_fin", nullable = false)
    private LocalDateTime fechaHoraFin;

    @Column(name = "precio_final", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioFinal;

    @JsonProperty("idCancha")
    public void setIdCancha(Long idCancha) {
        if (idCancha != null) {
            if (this.cancha == null) {
                this.cancha = Cancha.builder().idCancha(idCancha).build();
            } else {
                this.cancha.setIdCancha(idCancha);
            }
        }
    }

    @JsonProperty("idUsuario")
    public void setIdUsuario(Long idUsuario) {
        if (idUsuario != null) {
            if (this.usuario == null) {
                this.usuario = Usuario.builder().idUsuario(idUsuario).build();
            } else {
                this.usuario.setIdUsuario(idUsuario);
            }
        }
    }
}
