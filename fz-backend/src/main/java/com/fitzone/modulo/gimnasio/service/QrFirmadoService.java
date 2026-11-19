package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;

/**
 * QR firmado por el dispositivo del socio (RNF-01: el QR se genera y se valida sin conexión).
 *
 * Cada socio tiene en su navegador un par de claves ECDSA P-256. La privada no sale del dispositivo;
 * la pública se registra acá y viaja en la lista de habilitados del terminal de sede. Así el
 * celular firma el QR de cada minuto sin servidor, y el terminal y el servidor lo verifican.
 *
 * Formato: {@code F2.<idUsuario>.<ventana>.<nonce>.<firma>}, donde la firma (base64url, formato
 * IEEE P1363 de 64 bytes, el que produce WebCrypto) cubre {@code F2|<idUsuario>|<ventana>|<nonce>}.
 */
@Service
@RequiredArgsConstructor
public class QrFirmadoService {

    public static final String PREFIJO = "F2.";
    private static final int MAX_TOKEN_LENGTH = 256;
    private static final String ALGORITMO_FIRMA = "SHA256withECDSAinP1363Format";
    private static final BigInteger ORDEN_P256 = ordenP256();

    private final UsuarioRepository usuarioRepository;
    private final UsuarioActual usuarioActual;

    public static boolean esTokenFirmado(String token) {
        return token != null && token.trim().startsWith(PREFIJO);
    }

    /**
     * Guarda la clave pública del dispositivo del socio en sesión. Reemplaza la anterior: el último
     * dispositivo que se registra es el que puede generar QR válidos.
     */
    @Transactional
    public void registrarClave(String clavePublicaBase64) {
        leerClavePublica(clavePublicaBase64);
        Usuario socio = usuarioActual.obtener();
        if (socio.getTipoUsuario() != TipoUsuario.SOCIO) {
            throw new ReglaNegocioException("Solo los socios pueden registrar una clave para el pase QR");
        }
        socio.setQrClavePublica(clavePublicaBase64.trim());
        usuarioRepository.save(socio);
    }

    /** Verifica un token {@code F2.} contra la ventana de {@code momento} y devuelve el idUsuario. */
    @Transactional(readOnly = true)
    public Long validar(String token, Instant momento) {
        if (token == null || token.length() > MAX_TOKEN_LENGTH) {
            throw qrInvalido("El token QR es obligatorio y no debe superar " + MAX_TOKEN_LENGTH + " caracteres");
        }
        String[] partes = token.trim().split("\\.");
        if (partes.length != 5 || !"F2".equals(partes[0])) {
            throw qrInvalido("Estructura del token QR firmado inválida");
        }

        long idUsuario;
        long ventana;
        try {
            idUsuario = Long.parseLong(partes[1]);
            ventana = Long.parseLong(partes[2]);
        } catch (NumberFormatException e) {
            throw qrInvalido("Valores del token QR mal formados");
        }

        long ventanaActual = momento.getEpochSecond() / 60;
        if (ventana < ventanaActual - 1 || ventana > ventanaActual + 1) {
            throw qrInvalido("El código QR ha expirado");
        }

        String clave = usuarioRepository.findById(idUsuario)
                .map(Usuario::getQrClavePublica)
                .orElse(null);
        if (clave == null) {
            throw qrInvalido("El socio no tiene un dispositivo registrado para el pase QR");
        }

        String datos = "F2|" + idUsuario + "|" + ventana + "|" + partes[3];
        if (!firmaValida(clave, datos, partes[4])) {
            throw qrInvalido("Firma del código QR inválida");
        }
        return idUsuario;
    }

    /** Lee y valida una clave pública EC P-256 en SPKI base64. */
    public PublicKey leerClavePublica(String clavePublicaBase64) {
        if (clavePublicaBase64 == null || clavePublicaBase64.isBlank() || clavePublicaBase64.length() > 200) {
            throw new PeticionInvalidaException("La clave pública es obligatoria y no debe superar 200 caracteres");
        }
        try {
            byte[] der = Base64.getDecoder().decode(clavePublicaBase64.trim());
            PublicKey clave = KeyFactory.getInstance("EC").generatePublic(new X509EncodedKeySpec(der));
            if (!(clave instanceof ECPublicKey ec) || !ORDEN_P256.equals(ec.getParams().getOrder())) {
                throw new PeticionInvalidaException("La clave pública debe ser ECDSA P-256");
            }
            return clave;
        } catch (IllegalArgumentException | GeneralSecurityException e) {
            throw new PeticionInvalidaException("La clave pública no tiene un formato SPKI válido");
        }
    }

    private boolean firmaValida(String clavePublicaBase64, String datos, String firmaBase64Url) {
        try {
            Signature verificador = Signature.getInstance(ALGORITMO_FIRMA);
            verificador.initVerify(leerClavePublica(clavePublicaBase64));
            verificador.update(datos.getBytes(StandardCharsets.UTF_8));
            return verificador.verify(Base64.getUrlDecoder().decode(firmaBase64Url));
        } catch (IllegalArgumentException | GeneralSecurityException | PeticionInvalidaException e) {
            return false;
        }
    }

    private static AccesoException qrInvalido(String mensaje) {
        return new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO, mensaje);
    }

    private static BigInteger ordenP256() {
        try {
            AlgorithmParameters parametros = AlgorithmParameters.getInstance("EC");
            parametros.init(new ECGenParameterSpec("secp256r1"));
            return parametros.getParameterSpec(ECParameterSpec.class).getOrder();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("La JVM no soporta la curva P-256", e);
        }
    }
}
