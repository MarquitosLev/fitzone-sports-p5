package com.fitzone.modulo.usuarios.models;

import com.fitzone.core.domain.common.BaseEntity;
import com.fitzone.core.domain.enums.TipoUsuario;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "fz_usr_usuarios")
@AttributeOverride(name = "id", column = @Column(name = "id_usuario", nullable = false, updatable = false))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario extends BaseEntity {

    @Column(name = "auth_id", unique = true)
    private UUID authId;

    @Column(name = "dni", nullable = false, unique = true, length = 20)
    private String dni;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 100)
    private String apellido;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "telefono", length = 50)
    private String telefono;

    @Column(name = "foto_url")
    private String fotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_usuario", nullable = false, length = 30)
    private TipoUsuario tipoUsuario;

    @Column(name = "id_sede_asignada")
    private UUID idSedeAsignada;

    public UUID getIdUsuario() {
        return getId();
    }

    public void setIdUsuario(UUID idUsuario) {
        setId(idUsuario);
    }
}
