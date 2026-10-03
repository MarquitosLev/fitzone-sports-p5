package com.fitzone.modulo.gimnasio.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fitzone.core.domain.common.BaseEntity;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.usuarios.models.Usuario;
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

import java.time.LocalDateTime;

@Entity
@Table(name = "fz_gym_accesos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Acceso extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_acceso", updatable = false, nullable = false)
    private Long idAcceso;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_sede", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Sede sede;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva_clase")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ReservaClase reservaClase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva_cancha")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ReservaCancha reservaCancha;

    @Column(name = "fecha_hora_ingreso", nullable = false)
    private LocalDateTime fechaHoraIngreso;

    @Column(name = "fecha_hora_egreso")
    private LocalDateTime fechaHoraEgreso;
}
