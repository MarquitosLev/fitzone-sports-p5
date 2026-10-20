package com.fitzone.core.security;

import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RootKeySecurityServiceTest {

    private static final String CLAVE_CORRECTA = "clave-secreta-super-segura-123";

    @Test
    @DisplayName("Permite acceso cuando el Bearer token coincide exactamente con la Root Key")
    void permiteAccesoConBearerCorrecto() {
        RootKeySecurityService service = new RootKeySecurityService(CLAVE_CORRECTA);

        assertDoesNotThrow(() -> service.validarRootKey("Bearer " + CLAVE_CORRECTA));
    }

    @Test
    @DisplayName("Rechaza con 401 si el header Authorization es nulo o vacío")
    void rechazaHeaderVacioONulo() {
        RootKeySecurityService service = new RootKeySecurityService(CLAVE_CORRECTA);

        assertThrows(AccesoNoAutorizadoException.class, () -> service.validarRootKey(null));
        assertThrows(AccesoNoAutorizadoException.class, () -> service.validarRootKey(""));
        assertThrows(AccesoNoAutorizadoException.class, () -> service.validarRootKey("   "));
    }

    @Test
    @DisplayName("Rechaza con 401 si el header no tiene el prefijo 'Bearer '")
    void rechazaHeaderSinPrefijoBearer() {
        RootKeySecurityService service = new RootKeySecurityService(CLAVE_CORRECTA);

        assertThrows(AccesoNoAutorizadoException.class, () -> service.validarRootKey(CLAVE_CORRECTA));
        assertThrows(AccesoNoAutorizadoException.class, () -> service.validarRootKey("Basic " + CLAVE_CORRECTA));
    }

    @Test
    @DisplayName("Rechaza con 401 si el Bearer token es incorrecto")
    void rechazaClaveInvalida() {
        RootKeySecurityService service = new RootKeySecurityService(CLAVE_CORRECTA);

        assertThrows(AccesoNoAutorizadoException.class, () -> service.validarRootKey("Bearer clave-equivocada"));
    }

    @Test
    @DisplayName("Rechaza con 403 si el servidor no tiene configurada ninguna Root Key")
    void rechazaSiServidorNoTieneRootKeyConfigurada() {
        RootKeySecurityService serviceVacio = new RootKeySecurityService("");
        RootKeySecurityService serviceNulo = new RootKeySecurityService(null);

        assertThrows(AccesoDenegadoException.class, () -> serviceVacio.validarRootKey("Bearer " + CLAVE_CORRECTA));
        assertThrows(AccesoDenegadoException.class, () -> serviceNulo.validarRootKey("Bearer " + CLAVE_CORRECTA));
    }
}
