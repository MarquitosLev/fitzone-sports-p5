package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.NegocioException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.exception.RequiereInicioSesionException;
import com.fitzone.core.security.SupabaseAuthClient;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.pagos.pasarela.PasarelaPago;
import com.fitzone.modulo.pagos.pasarela.RespuestaPasarela;
import com.fitzone.modulo.usuarios.models.AltaSocioRequest;
import com.fitzone.modulo.usuarios.models.AltaSocioResponse;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.ReintentoCuentaRequest;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.PlanRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import com.fitzone.modulo.usuarios.service.AltaSocioRegistro.AltaRegistrada;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Alta de socio online: la cuenta se crea solo con el pago de la suscripción aprobado.
 * Orden: validar, cobrar, registrar socio, membresía, transacción y comprobante (AltaSocioRegistro, una
 * transacción), crear la cuenta en Supabase e iniciar sesión. Si Supabase falla después del pago, el pago
 * ya quedó registrado y la cuenta se reintenta con el número de comprobante.
 * No es @Transactional a propósito: el registro del pago tiene que confirmarse antes de llamar a Supabase.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AltaSocioService {

    private final UsuarioRepository usuarioRepository;
    private final PlanRepository planRepository;
    private final SedeRepository sedeRepository;
    private final PasarelaPago pasarelaPago;
    private final SupabaseAuthClient supabaseAuthClient;
    private final AltaSocioRegistro registro;

    public AltaSocioResponse darDeAlta(AltaSocioRequest request) {
        String dni = request.getDni().trim();
        String email = request.getEmail().trim().toLowerCase();

        Plan plan = planRepository.findById(request.getIdPlan())
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan", request.getIdPlan()));
        Sede sede = sedeRepository.findById(request.getIdSede())
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", request.getIdSede()));
        validarDisponibles(dni, email);

        RespuestaPasarela respuesta = pasarelaPago.cobrar(plan.getPrecioBase(),
                "Alta de socio - " + plan.getNombre(), Boolean.TRUE.equals(request.getForzarRechazo()));
        if (!respuesta.aprobado()) {
            throw new ReglaNegocioException("El pago fue rechazado (" + respuesta.mensaje()
                    + "). No se creó la cuenta: podés reintentar con otro medio de pago.");
        }

        AltaRegistrada alta = registro.registrarSocio(request, dni, email, plan, sede, respuesta);

        try {
            return crearCuentaEIniciarSesion(alta, email, request.getPassword());
        } catch (NegocioException ex) {
            log.error("Alta de socio #{}: pago registrado ({}) pero falló la cuenta en Supabase: {}",
                    alta.socio().getIdUsuario(), alta.numeroFactura(), ex.getMessage());
            return respuesta(alta, alta.socio(), null, true, "Tu pago quedó registrado (comprobante "
                    + alta.numeroFactura() + "), pero no pudimos crear tu acceso: " + ex.getMessage());
        }
    }

    public AltaSocioResponse reintentarCuenta(ReintentoCuentaRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        AltaRegistrada alta = registro.validarReintento(request, email);
        return crearCuentaEIniciarSesion(alta, email, request.getPassword());
    }

    private void validarDisponibles(String dni, String email) {
        Optional<Usuario> porDni = usuarioRepository.findByDni(dni);
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

    private AltaSocioResponse crearCuentaEIniciarSesion(AltaRegistrada alta, String email, String password) {
        Usuario socio = alta.socio();
        Map<String, Object> metadatos = Map.of(
                "nombre", socio.getNombre(),
                "apellido", socio.getApellido(),
                "tipo_usuario", TipoUsuario.SOCIO.name());
        UUID authId = supabaseAuthClient.crearUsuarioConfirmado(email, password, metadatos);

        Usuario vinculado;
        try {
            vinculado = registro.vincularCuenta(socio.getIdUsuario(), authId);
        } catch (RuntimeException ex) {
            supabaseAuthClient.eliminarUsuario(authId);
            throw ex;
        }

        String token = null;
        try {
            token = supabaseAuthClient.iniciarSesion(email, password).accessToken();
        } catch (NegocioException ex) {
            log.warn("Alta de socio #{}: cuenta creada pero no se pudo iniciar sesión: {}", socio.getIdUsuario(), ex.getMessage());
        }
        String mensaje = token != null ? "¡Bienvenido a FitZone!" : "Tu cuenta está lista. Iniciá sesión con tu email y contraseña.";
        return respuesta(alta, vinculado, token, false, mensaje);
    }

    private AltaSocioResponse respuesta(AltaRegistrada alta, Usuario socio, String token, boolean cuentaPendiente, String mensaje) {
        return new AltaSocioResponse(token, socio, cuentaPendiente, mensaje, alta.idMembresia(),
                alta.fechaVencimiento(), alta.idComprobante(), alta.numeroFactura());
    }
}
