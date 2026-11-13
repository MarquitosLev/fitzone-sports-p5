package com.fitzone.modulo.usuarios.models;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** El código de reintento (se entrega solo al pagar y no es el número de factura) prueba que quien reintenta es quien pagó el alta. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReintentoCuentaRequest {

    @NotBlank(message = "El DNI es obligatorio")
    private String dni;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener un formato válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres")
    private String password;

    @NotNull(message = "El código de reintento es obligatorio")
    private UUID codigoReintento;
}
