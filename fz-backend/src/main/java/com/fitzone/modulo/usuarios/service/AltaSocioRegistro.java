package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.pagos.models.Comprobante;
import com.fitzone.modulo.pagos.models.Transaccion;
import com.fitzone.modulo.pagos.pasarela.RespuestaPasarela;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
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
import java.util.UUID;

/** Pasos de base de datos del alta de socio; cada uno es una transacción propia que AltaSocioService orquesta. */
@Service
@RequiredArgsConstructor
public class AltaSocioRegistro {

    public record AltaRegistrada(Usuario socio, Long idMembresia, LocalDate fechaVencimiento,
                                 Long idComprobante, String numeroFactura) {}

    private final UsuarioRepository usuarioRepository;
    private final MembresiaService membresiaService;
    private final PagoService pagoService;
    private final ComprobanteRepository comprobanteRepository;

    /** Un invitado previo (EXTERNO) con ese DNI se reutiliza y pasa a SOCIO; la cuenta se vincula después. */
    @Transactional
    public AltaRegistrada registrarSocio(AltaSocioRequest request, String dni, String email, Plan plan, Sede sede,
                                         RespuestaPasarela respuesta) {
        Usuario socio = usuarioRepository.findByDni(dni).orElseGet(() -> Usuario.builder().dni(dni).build());
        socio.setNombre(request.getNombre().trim());
        socio.setApellido(request.getApellido().trim());
        socio.setEmail(email);
        socio.setTelefono(request.getTelefono().trim());
        socio.setTipoUsuario(TipoUsuario.SOCIO);
        socio.setIdSede(null);
        socio.setAuthId(null);
        socio = usuarioRepository.saveAndFlush(socio);

        Membresia membresia = membresiaService.crear(Membresia.builder().usuario(socio).plan(plan).build());
        Transaccion transaccion = pagoService.registrarCobro(socio, sede, membresia, null,
                TipoOrigenTransaccion.MEMBRESIA, plan.getPrecioBase(), respuesta);
        Comprobante comprobante = comprobanteRepository.findByTransaccion_IdTransaccion(transaccion.getIdTransaccion())
                .orElseThrow(() -> new IllegalStateException("El pago confirmado no generó comprobante"));
        return new AltaRegistrada(socio, membresia.getIdMembresia(), membresia.getFechaVencimiento(),
                comprobante.getIdComprobante(), comprobante.getNumeroFactura());
    }

    @Transactional
    public Usuario vincularCuenta(Long idUsuario, UUID authId) {
        Usuario socio = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", idUsuario));
        socio.setAuthId(authId);
        return usuarioRepository.save(socio);
    }

    @Transactional(readOnly = true)
    public AltaRegistrada validarReintento(ReintentoCuentaRequest request, String email) {
        Comprobante comprobante = comprobanteRepository.findByNumeroFactura(request.getNumeroFactura().trim())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un comprobante con ese número"));
        Transaccion transaccion = comprobante.getTransaccion();
        Usuario socio = transaccion.getUsuario();
        Membresia membresia = transaccion.getMembresia();
        boolean coincide = membresia != null
                && socio.getTipoUsuario() == TipoUsuario.SOCIO
                && socio.getDni().equals(request.getDni().trim())
                && socio.getEmail().equalsIgnoreCase(email);
        if (!coincide) {
            throw new AccesoDenegadoException("Los datos no coinciden con el comprobante del alta");
        }
        if (socio.getAuthId() != null) {
            throw new ConflictoException("Tu cuenta ya está creada. Iniciá sesión.");
        }
        return new AltaRegistrada(socio, membresia.getIdMembresia(), membresia.getFechaVencimiento(),
                comprobante.getIdComprobante(), comprobante.getNumeroFactura());
    }
}
