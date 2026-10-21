package com.fitzone.core.security;

import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Servicio encargado de validar el acceso administrativo mediante una Root Key privada.
 * La clave no es pública y se configura a través de la variable de entorno ROOT_API_KEY.
 */
@Slf4j
@Service
public class RootKeySecurityService {

    private static final String BEARER_PREFIX = "Bearer ";

    private final String rootKey;

    public RootKeySecurityService(@Value("${fitzone.security.root-key:}") String rootKey) {
        this.rootKey = rootKey != null ? rootKey.trim() : "";
    }

    /**
     * Valida el encabezado Authorization con esquema Bearer frente a la Root Key configurada.
     *
     * @param authorizationHeader valor del header Authorization recibido (ej: "Bearer mi-root-key")
     * @throws AccesoDenegadoException si el servidor no tiene configurada una Root Key
     * @throws AccesoNoAutorizadoException si el header falta, no es Bearer o la clave es incorrecta
     */
    public void validarRootKey(String authorizationHeader) {
        if (!StringUtils.hasText(rootKey)) {
            log.warn("Intento de acceso con Root Key pero la clave no está configurada en las propiedades del servidor");
            throw new AccesoDenegadoException("El acceso administrativo mediante Root Key no está habilitado en este servidor.");
        }

        if (!StringUtils.hasText(authorizationHeader)) {
            throw new AccesoNoAutorizadoException("Se requiere el encabezado 'Authorization: Bearer <root_key>' para acceder a este recurso.");
        }

        if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
            throw new AccesoNoAutorizadoException("El formato del encabezado Authorization debe ser 'Bearer <root_key>'.");
        }

        String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        if (token.isEmpty()) {
            throw new AccesoNoAutorizadoException("El token proporcionado en el encabezado Authorization no puede estar vacío.");
        }

        // Comparación en tiempo constante para evitar ataques de temporización (timing attacks)
        byte[] tokenBytes = token.getBytes(StandardCharsets.UTF_8);
        byte[] rootKeyBytes = rootKey.getBytes(StandardCharsets.UTF_8);

        boolean esValida = MessageDigest.isEqual(tokenBytes, rootKeyBytes);
        if (!esValida) {
            log.warn("Intento de acceso administrativo con Root Key inválida");
            throw new AccesoNoAutorizadoException("Root Key inválida o no autorizada.");
        }
    }
}
