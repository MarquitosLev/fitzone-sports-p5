package com.fitzone.modulo.usuarios.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fitzone.core.domain.common.BaseEntity;
import com.fitzone.core.domain.enums.TipoUsuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "fz_usr_usuarios")
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario", updatable = false, nullable = false)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long idUsuario;

    @Column(name = "auth_id", unique = true)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private UUID authId;

    @NotBlank(message = "El DNI es obligatorio")
    @Size(max = 20, message = "El DNI no puede superar los 20 caracteres")
    @Column(name = "dni", nullable = false, unique = true, length = 20, updatable = false)
    private String dni;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 100, message = "El apellido no puede superar los 100 caracteres")
    @Column(name = "apellido", nullable = false, length = 100)
    private String apellido;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener un formato válido")
    @Size(max = 255, message = "El email no puede superar los 255 caracteres")
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Size(max = 50, message = "El teléfono no puede superar los 50 caracteres")
    @Column(name = "telefono", length = 50)
    private String telefono;

    @Column(name = "foto_url")
    private String fotoUrl;

    @NotNull(message = "El tipo de usuario es obligatorio")
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_usuario", nullable = false, length = 30)
    private TipoUsuario tipoUsuario;

    @Column(name = "id_sede")
    private Long idSede;

    /**
     * Contraseña inicial usada exclusivamente cuando fitzone.supabase.alta-por-email=false.
     * Es transitoria, nunca se persiste en la BD ni se serializa en respuestas JSON.
     */
    @Transient
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
}
