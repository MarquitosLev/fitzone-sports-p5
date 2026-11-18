package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QrFirmadoServiceTest {

    /** Vector generado con WebCrypto (la misma API que usa el navegador del socio). */
    private static final String SPKI_WEBCRYPTO =
            "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEj20Hi7H4DapsoRwOTpmnTXzU+4Q/lzwEgc3RvLYiqLNLPDt+OUIm++lqG0Y9waBS3RWNWqQBmB+fsSJ9NCLWqg==";
    private static final String TOKEN_WEBCRYPTO =
            "F2.4.29915700.q7Zr3xY0Lmo.3a4wtF9RBG3ZfnDPD_6MXRSBrj3amPQfk8jev9OGp1hdXwGSZ2X12YBP3BRUMOHkBTwiS4uhs-k4KllutgG20Q";
    private static final Instant MOMENTO_WEBCRYPTO = Instant.ofEpochSecond(29_915_700L * 60 + 20);

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UsuarioActual usuarioActual;

    private QrFirmadoService servicio;

    @BeforeEach
    void setUp() {
        servicio = new QrFirmadoService(usuarioRepository, usuarioActual);
    }

    private static KeyPair nuevoPar() throws Exception {
        KeyPairGenerator generador = KeyPairGenerator.getInstance("EC");
        generador.initialize(new ECGenParameterSpec("secp256r1"));
        return generador.generateKeyPair();
    }

    private static String spki(KeyPair par) {
        return Base64.getEncoder().encodeToString(par.getPublic().getEncoded());
    }

    private static String firmar(KeyPair par, long idUsuario, long ventana) throws Exception {
        String nonce = "n0nce";
        Signature firmador = Signature.getInstance("SHA256withECDSAinP1363Format");
        firmador.initSign(par.getPrivate());
        firmador.update(("F2|" + idUsuario + "|" + ventana + "|" + nonce).getBytes(StandardCharsets.UTF_8));
        String firma = Base64.getUrlEncoder().withoutPadding().encodeToString(firmador.sign());
        return "F2." + idUsuario + "." + ventana + "." + nonce + "." + firma;
    }

    private void socioConClave(long idUsuario, String clave) {
        when(usuarioRepository.findById(idUsuario))
                .thenReturn(Optional.of(Usuario.builder().idUsuario(idUsuario).qrClavePublica(clave).build()));
    }

    private static void esperarQrVencido(org.assertj.core.api.ThrowableAssert.ThrowingCallable llamada) {
        assertThatThrownBy(llamada)
                .isInstanceOf(AccesoException.class)
                .satisfies(ex -> assertThat(((AccesoException) ex).getCodigo()).isEqualTo(CodigoError.QR_VENCIDO));
    }

    @Test
    @DisplayName("Verifica un QR firmado en el navegador con WebCrypto (contrato entre front y back)")
    void validar_tokenFirmadoConWebCrypto_devuelveElSocio() {
        socioConClave(4L, SPKI_WEBCRYPTO);

        assertThat(servicio.validar(TOKEN_WEBCRYPTO, MOMENTO_WEBCRYPTO)).isEqualTo(4L);
    }

    @Test
    @DisplayName("Acepta la ventana anterior y la siguiente, y rechaza un QR de hace 2 minutos")
    void validar_toleranciaDeUnaVentana() throws Exception {
        KeyPair par = nuevoPar();
        socioConClave(7L, spki(par));
        long ventana = 30_000_000L;
        String token = firmar(par, 7L, ventana);

        assertThat(servicio.validar(token, Instant.ofEpochSecond((ventana + 1) * 60))).isEqualTo(7L);
        assertThat(servicio.validar(token, Instant.ofEpochSecond((ventana - 1) * 60))).isEqualTo(7L);
        esperarQrVencido(() -> servicio.validar(token, Instant.ofEpochSecond((ventana + 2) * 60)));
    }

    @Test
    @DisplayName("Rechaza un QR firmado con otra clave: no se puede suplantar a un socio")
    void validar_firmaDeOtroDispositivo_lanzaQrVencido() throws Exception {
        socioConClave(7L, spki(nuevoPar()));
        long ventana = 30_000_000L;
        String tokenDeOtro = firmar(nuevoPar(), 7L, ventana);

        esperarQrVencido(() -> servicio.validar(tokenDeOtro, Instant.ofEpochSecond(ventana * 60)));
    }

    @Test
    @DisplayName("Rechaza un QR con el idUsuario cambiado aunque la firma sea de un socio real")
    void validar_idAlterado_lanzaQrVencido() throws Exception {
        KeyPair par = nuevoPar();
        socioConClave(8L, spki(par));
        long ventana = 30_000_000L;
        String alterado = firmar(par, 7L, ventana).replaceFirst("^F2\\.7\\.", "F2.8.");

        esperarQrVencido(() -> servicio.validar(alterado, Instant.ofEpochSecond(ventana * 60)));
    }

    @Test
    @DisplayName("Rechaza el QR de un socio que no registró dispositivo y los tokens mal formados")
    void validar_sinClaveOMalFormado_lanzaQrVencido() {
        when(usuarioRepository.findById(9L)).thenReturn(Optional.of(Usuario.builder().idUsuario(9L).build()));
        Instant ahora = Instant.ofEpochSecond(30_000_000L * 60);

        esperarQrVencido(() -> servicio.validar("F2.9.30000000.n.firma", ahora));
        esperarQrVencido(() -> servicio.validar("F2.9.30000000", ahora));
        esperarQrVencido(() -> servicio.validar("F2.x.y.n.firma", ahora));
    }

    @Test
    @DisplayName("registrarClave guarda la clave del socio en sesión")
    void registrarClave_socio_guardaLaClave() throws Exception {
        Usuario socio = Usuario.builder().idUsuario(4L).tipoUsuario(TipoUsuario.SOCIO).build();
        when(usuarioActual.obtener()).thenReturn(socio);
        String clave = spki(nuevoPar());

        servicio.registrarClave(clave);

        assertThat(socio.getQrClavePublica()).isEqualTo(clave);
        verify(usuarioRepository).save(socio);
    }

    @Test
    @DisplayName("registrarClave rechaza claves que no son EC P-256 y a quien no es socio")
    void registrarClave_invalida_rechaza() throws Exception {
        KeyPairGenerator rsa = KeyPairGenerator.getInstance("RSA");
        rsa.initialize(1024);
        String claveRsa = Base64.getEncoder().encodeToString(rsa.generateKeyPair().getPublic().getEncoded());
        KeyPairGenerator p384 = KeyPairGenerator.getInstance("EC");
        p384.initialize(new ECGenParameterSpec("secp384r1"));
        String claveP384 = Base64.getEncoder().encodeToString(p384.generateKeyPair().getPublic().getEncoded());

        assertThatThrownBy(() -> servicio.registrarClave("no-es-base64!")).isInstanceOf(PeticionInvalidaException.class);
        assertThatThrownBy(() -> servicio.registrarClave(claveRsa)).isInstanceOf(PeticionInvalidaException.class);
        assertThatThrownBy(() -> servicio.registrarClave(claveP384)).isInstanceOf(PeticionInvalidaException.class);

        when(usuarioActual.obtener()).thenReturn(Usuario.builder().tipoUsuario(TipoUsuario.RECEPCIONISTA).build());
        assertThatThrownBy(() -> servicio.registrarClave(spki(nuevoPar()))).isInstanceOf(ReglaNegocioException.class);
        verify(usuarioRepository, never()).save(any());
    }
}
