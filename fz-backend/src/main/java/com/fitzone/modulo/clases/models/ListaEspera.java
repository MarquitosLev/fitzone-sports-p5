package com.fitzone.modulo.clases.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fitzone.core.domain.common.BaseEntity;
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

@Entity
@Table(name = "fz_cls_lista_espera")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListaEspera extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_espera", updatable = false, nullable = false)
    private Long idEspera;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_clase", nullable = false, foreignKey = @ForeignKey(name = "fk_cls_lista_espera_clases"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ClaseGrupal clase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false,  foreignKey = @ForeignKey(name = "fk_cls_lista_espera_usuarios"))
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario usuario;

    @Column(name = "orden_posicion", nullable = false)
    private Integer ordenPosicion;
}
