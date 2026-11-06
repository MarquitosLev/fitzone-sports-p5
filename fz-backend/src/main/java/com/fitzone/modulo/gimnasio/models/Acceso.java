package com.fitzone.modulo.gimnasio.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fitzone.core.domain.common.BaseEntity;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.clases.models.ReservaClase;
import com.fitzone.modulo.usuarios.models.Usuario;
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
import org.hibernate.annotations.Check;

import java.time.LocalDateTime;

@Entity
@Table(name = "fz_gym_accesos")
// Un ingreso se asocia como mucho a una reserva: de clase o de cancha, nunca a las dos.
@Check(name = "ck_gym_accesos_una_reserva",
        constraints = "id_reserva_clase IS NULL OR id_reserva_cancha IS NULL")
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
    @JoinColumn(name = "id_usuario", nullable = false, foreignKey = @ForeignKey(name = "fk_gym_accesos_usuarios"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_sede", nullable = false, foreignKey = @ForeignKey(name = "fk_gym_accesos_sedes"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Sede sede;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva_clase", foreignKey = @ForeignKey(name = "fk_gym_accesos_reservas_clase"))
    @JsonIgnore
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ReservaClase reservaClase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva_cancha", foreignKey = @ForeignKey(name = "fk_gym_accesos_reservas_cancha"))
    @JsonIgnore
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ReservaCancha reservaCancha;

    @Column(name = "fecha_hora_ingreso", nullable = false)
    private LocalDateTime fechaHoraIngreso;

    @Column(name = "fecha_hora_egreso")
    private LocalDateTime fechaHoraEgreso;

    @Column(name = "token_qr", length = 500)
    private String tokenQr;
}
