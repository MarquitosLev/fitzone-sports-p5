package com.fitzone.modulo.usuarios.models;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** El número de comprobante prueba que quien reintenta es quien pagó el alta. */
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

    @NotBlank(message = "El número de comprobante es obligatorio")
    private String numeroFactura;
}
