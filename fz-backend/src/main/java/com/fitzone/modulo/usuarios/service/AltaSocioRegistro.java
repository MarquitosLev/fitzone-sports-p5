package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.RequiereInicioSesionException;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.pasarela.RespuestaPasarela;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.pagos.service.PagoService;
import com.fitzone.modulo.usuarios.models.AltaSocioRequest;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.ReintentoCuentaRequest;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/** Pasos de base de datos del alta de socio; cada uno es una transacción propia que AltaSocioService orquesta. */
@Service
@RequiredArgsConstructor
public class AltaSocioRegistro {

    public record AltaRegistrada(Usuario socio, Long idMembresia, LocalDate fechaVencimiento,
                                 Long idComprobante, String numeroFactura, UUID codigoReintento) {}

    private final UsuarioRepository usuarioRepository;
    private final MembresiaService membresiaService;
    private final PagoService pagoService;
    private final ComprobanteRepository comprobanteRepository;
    private final TransaccionRepository transaccionRepository;

    /** Validación previa al cobro, sin bloquear. registrarSocio la repite con el DNI bloqueado. */
    @Transactional(readOnly = true)
    public void validarDisponibles(String dni, String email) {
        validar(usuarioRepository.findByDni(dni), dni, email);
    }

    private void validar(Optional<Usuario> porDni, String dni, String email) {
        if (porDni.isEmpty() && usuarioRepository.existsByDniIncluidosBajas(dni)) {
            throw new ConflictoException("Ese DNI figura dado de baja. Acercate a una sede para regularizarlo.");
        }
        if (porDni.map(u -> u.getTipoUsuario() != TipoUsuario.EXTERNO).orElse(false)) {
            throw new RequiereInicioSesionException("Ya existe una cuenta con ese DNI. Iniciá sesión para renovar tu membresía.");
        }
        if (usuarioRepository.existsByEmailIgnoreCaseAndTipoUsuarioNot(email, TipoUsuario.EXTERNO)) {
            throw new RequiereInicioSesionException("Ya existe una cuenta con ese email. Iniciá sesión.");
        }
    }

    /**
     * Un invitado previo (EXTERNO) con ese DNI se reutiliza y pasa a SOCIO; la cuenta se vincula después.
     * El DNI queda bloqueado mientras dura la transacción: una alta simultánea espera y, al entrar, ya ve un SOCIO.
     */
    @Transactional
    public AltaRegistrada registrarSocio(AltaSocioRequest request, String dni, String email, Plan plan, Sede sede,
                                         RespuestaPasarela respuesta) {
        Optional<Usuario> existente = usuarioRepository.findByDniForUpdate(dni);
        validar(existente, dni, email);
        Usuario socio = existente.orElseGet(() -> Usuario.builder().dni(dni).build());
        socio.setNombre(request.getNombre().trim());
        socio.setApellido(request.getApellido().trim());
        socio.setEmail(email);
        socio.setTelefono(request.getTelefono().trim());
        socio.setTipoUsuario(TipoUsuario.SOCIO);
        socio.setIdSede(null);
        socio = usuarioRepository.saveAndFlush(socio);

        Membresia membresia = membresiaService.crear(Membresia.builder().usuario(socio).plan(plan).build());
        Transaccion transaccion = pagoService.registrarCobro(socio, sede, membresia, null,
                TipoOrigenTransaccion.MEMBRESIA, plan.getPrecioBase(), respuesta);
        transaccion.setCodigoReintento(UUID.randomUUID());
        transaccionRepository.save(transaccion);
        Comprobante comprobante = comprobanteRepository.findByTransaccion_IdTransaccion(transaccion.getIdTransaccion())
                .orElseThrow(() -> new IllegalStateException("El pago confirmado no generó comprobante"));
        return new AltaRegistrada(socio, membresia.getIdMembresia(), membresia.getFechaVencimiento(),
                comprobante.getIdComprobante(), comprobante.getNumeroFactura(), transaccion.getCodigoReintento());
    }

    @Transactional
    public Usuario vincularCuenta(Long idUsuario, UUID authId) {
        Usuario socio = usuarioRepository.findByIdForUpdate(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", idUsuario));
        if (authId.equals(socio.getAuthId())) {
            return socio;
        }
        if (socio.getAuthId() != null) {
            throw new ConflictoException("Tu cuenta ya está creada. Iniciá sesión.");
        }
        usuarioRepository.findByAuthId(authId)
                .filter(otro -> !otro.getIdUsuario().equals(idUsuario))
                .ifPresent(otro -> {
                    throw new ConflictoException("Esa cuenta de acceso ya pertenece a otro usuario");
                });
        socio.setAuthId(authId);
        return usuarioRepository.save(socio);
    }

    @Transactional(readOnly = true)
    public AltaRegistrada validarReintento(ReintentoCuentaRequest request, String email) {
        Transaccion transaccion = transaccionRepository.findByCodigoReintento(request.getCodigoReintento())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un alta con ese código de reintento"));
        Usuario socio = transaccion.getUsuario();
        Membresia membresia = transaccion.getMembresia();
        boolean coincide = membresia != null
                && transaccion.getConcepto() == TipoOrigenTransaccion.MEMBRESIA
                && socio.getTipoUsuario() == TipoUsuario.SOCIO
                && socio.getDni().equals(request.getDni().trim())
                && socio.getEmail().equalsIgnoreCase(email);
        if (!coincide) {
            throw new AccesoDenegadoException("Los datos no coinciden con el alta");
        }
        if (socio.getAuthId() != null) {
            throw new ConflictoException("Tu cuenta ya está creada. Iniciá sesión.");
        }
        Comprobante comprobante = comprobanteRepository.findByTransaccion_IdTransaccion(transaccion.getIdTransaccion())
                .orElseThrow(() -> new IllegalStateException("El pago confirmado no generó comprobante"));
        return new AltaRegistrada(socio, membresia.getIdMembresia(), membresia.getFechaVencimiento(),
                comprobante.getIdComprobante(), comprobante.getNumeroFactura(), transaccion.getCodigoReintento());
    }
}
