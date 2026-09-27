package com.fitzone.modulo.clases.models;

import com.fitzone.core.domain.common.BaseEntity;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fz_cls_clases")
@AttributeOverride(name = "id", column = @Column(name = "id_clase", nullable = false, updatable = false))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaseGrupal extends BaseEntity {

    @Column(name = "id_sede", nullable = false)
    private UUID idSede;

    @Column(name = "nombre_actividad", nullable = false, length = 100)
    private String nombreActividad;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracionMinutos;

    @Column(name = "cupo_maximo", nullable = false)
    private Integer cupoMaximo;

    @Column(name = "cupo_disponible", nullable = false)
    private Integer cupoDisponible;

    public UUID getIdClase() {
        return getId();
    }

    public void setIdClase(UUID idClase) {
        setId(idClase);
    }
}
