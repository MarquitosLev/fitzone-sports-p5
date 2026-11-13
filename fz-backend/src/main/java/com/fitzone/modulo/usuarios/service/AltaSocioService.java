package com.fitzone.modulo.usuarios.service;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoNoAutorizadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.NegocioException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.SupabaseAuthClient;
import com.fitzone.core.security.SupabaseAuthClient.SesionSupabase;
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
import com.fitzone.modulo.usuarios.service.AltaSocioRegistro.AltaRegistrada;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Alta de socio online: la cuenta se crea solo con el pago de la suscripción aprobado.
 * Orden: validar, cobrar, registrar socio, membresía, transacción y comprobante (AltaSocioRegistro, una
 * transacción), crear la cuenta en Supabase e iniciar sesión. Si algo falla después del pago, el pago
 * ya quedó registrado y la cuenta se reintenta con el código de reintento.
 * No es @Transactional a propósito: el registro del pago tiene que confirmarse antes de llamar a Supabase.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AltaSocioService {

    private final PlanRepository planRepository;
    private final SedeRepository sedeRepository;
    private final PasarelaPago pasarelaPago;
    private final SupabaseAuthClient supabaseAuthClient;
    private final AltaSocioRegistro registro;

    /** DNIs con un alta en curso en esta instancia: evita cobrar dos veces si se envía el formulario dos veces a la vez. */
    private final Set<String> altasEnCurso = ConcurrentHashMap.newKeySet();

    public AltaSocioResponse darDeAlta(AltaSocioRequest request) {
        String dni = request.getDni().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (!altasEnCurso.add(dni)) {
            throw new ConflictoException("Ya hay un alta en curso con ese DNI. Esperá unos segundos y revisá si quedó registrada.");
        }
        try {
            return procesarAlta(request, dni, email);
        } finally {
            altasEnCurso.remove(dni);
        }
    }

    private AltaSocioResponse procesarAlta(AltaSocioRequest request, String dni, String email) {
        Plan plan = planRepository.findById(request.getIdPlan())
                .orElseThrow(() -> new RecursoNoEncontradoException("Plan", request.getIdPlan()));
        Sede sede = sedeRepository.findById(request.getIdSede())
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", request.getIdSede()));
        registro.validarDisponibles(dni, email);

        RespuestaPasarela respuesta = pasarelaPago.cobrar(plan.getPrecioBase(),
                "Alta de socio - " + plan.getNombre(), Boolean.TRUE.equals(request.getForzarRechazo()));
        if (!respuesta.aprobado()) {
            throw new ReglaNegocioException("El pago fue rechazado (" + respuesta.mensaje()
                    + "). No se creó la cuenta: podés reintentar con otro medio de pago.");
        }

        AltaRegistrada alta = registrarTrasCobro(request, dni, email, plan, sede, respuesta);

        try {
            return crearCuentaEIniciarSesion(alta, email, request.getPassword());
        } catch (RuntimeException ex) {
            String motivo = ex instanceof NegocioException ? ex.getMessage() : "error inesperado del sistema";
            log.error("Alta de socio #{}: pago registrado ({}) pero falló la cuenta de acceso: {}",
                    alta.socio().getIdUsuario(), alta.numeroFactura(), ex.toString());
            return respuesta(alta, alta.socio(), null, true, "Tu pago quedó registrado (comprobante "
                    + alta.numeroFactura() + "), pero no pudimos crear tu acceso: " + motivo);
        }
    }

    private AltaRegistrada registrarTrasCobro(AltaSocioRequest request, String dni, String email, Plan plan, Sede sede,
                                              RespuestaPasarela respuesta) {
        try {
            return registro.registrarSocio(request, dni, email, plan, sede, respuesta);
        } catch (RuntimeException ex) {
            log.error("Alta de socio: el cobro de la pasarela (token {}) quedó aprobado pero no se pudo registrar: {}",
                    respuesta.tokenTransaccion(), ex.toString());
            if (ex instanceof DataIntegrityViolationException) {
                throw new ConflictoException("Ya hay un alta registrada con ese DNI o email. Revisá si quedó creada.");
            }
            throw ex;
        }
    }

    public AltaSocioResponse reintentarCuenta(ReintentoCuentaRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        AltaRegistrada alta = registro.validarReintento(request, email);
        return crearCuentaEIniciarSesion(alta, email, request.getPassword());
    }

    private AltaSocioResponse crearCuentaEIniciarSesion(AltaRegistrada alta, String email, String password) {
        Usuario socio = alta.socio();
        Map<String, Object> metadatos = Map.of(
                "nombre", socio.getNombre(),
                "apellido", socio.getApellido(),
                "tipo_usuario", TipoUsuario.SOCIO.name());

        SesionSupabase sesion = null;
        UUID authId;
        boolean creadaAqui = true;
        try {
            authId = supabaseAuthClient.crearUsuarioConfirmado(email, password, metadatos);
        } catch (ConflictoException ex) {
            sesion = iniciarSesionEnCuentaExistente(email, password);
            authId = sesion.authId();
            creadaAqui = false;
        }

        Usuario vinculado;
        try {
            vinculado = registro.vincularCuenta(socio.getIdUsuario(), authId);
        } catch (RuntimeException ex) {
            if (creadaAqui) {
                eliminarCuentaCreada(authId);
            }
            throw ex;
        }

        String token = null;
        try {
            token = sesion != null ? sesion.accessToken() : supabaseAuthClient.iniciarSesion(email, password).accessToken();
        } catch (NegocioException ex) {
            log.warn("Alta de socio #{}: cuenta creada pero no se pudo iniciar sesión: {}", socio.getIdUsuario(), ex.getMessage());
        }
        String mensaje = token != null ? "¡Bienvenido a FitZone!" : "Tu cuenta está lista. Iniciá sesión con tu email y contraseña.";
        return respuesta(alta, vinculado, token, false, mensaje);
    }

    /** El email ya tiene cuenta en Supabase (un intento anterior que quedó a medias): se la reutiliza si la contraseña es la misma. */
    private SesionSupabase iniciarSesionEnCuentaExistente(String email, String password) {
        try {
            return supabaseAuthClient.iniciarSesion(email, password);
        } catch (AccesoNoAutorizadoException ex) {
            throw new ReglaNegocioException("Ese email ya tiene una cuenta de acceso con otra contraseña. "
                    + "Escribí la contraseña de esa cuenta o usá \"¿Olvidaste tu contraseña?\" en el inicio de sesión.");
        }
    }

    private void eliminarCuentaCreada(UUID authId) {
        try {
            supabaseAuthClient.eliminarUsuario(authId);
        } catch (RuntimeException ex) {
            log.error("No se pudo eliminar la cuenta de Supabase {} creada en un alta fallida: {}", authId, ex.toString());
        }
    }

    private AltaSocioResponse respuesta(AltaRegistrada alta, Usuario socio, String token, boolean cuentaPendiente, String mensaje) {
        UUID codigo = cuentaPendiente ? alta.codigoReintento() : null;
        return new AltaSocioResponse(token, socio, cuentaPendiente, mensaje, alta.idMembresia(),
                alta.fechaVencimiento(), alta.idComprobante(), alta.numeroFactura(), codigo);
    }
}
