package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoException;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.QrTokenResponse;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccesoService {

    private final AccesoRepository accesoRepository;
    private final SedeRepository sedeRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final QrTokenService qrTokenService;

    @Transactional(readOnly = true)
    public QrTokenResponse generarQr(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", idUsuario));

        if (usuario.getTipoUsuario() != TipoUsuario.SOCIO) {
            throw new ReglaNegocioException("Solo los socios pueden generar un código QR de acceso");
        }

        // Verifica membresía activa y no vencida
        boolean tieneMembresiaActiva = membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                idUsuario, List.of(EstadoMembresia.ACTIVO), LocalDate.now());
        if (!tieneMembresiaActiva) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.MEMBRESIA_INACTIVA,
                    "El socio no posee una membresía activa y vigente");
        }

        return qrTokenService.generarToken(idUsuario);
    }

    @Transactional
    public Acceso registrarIngreso(String tokenQr, Long idSede) {
        // Valida token HMAC y ventana temporal (lanza QR_VENCIDO si expiró o es inválido)
        Long idUsuario = qrTokenService.validarYObtenerUsuario(tokenQr);

        Sede sede = sedeRepository.findById(idSede)
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", idSede));

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", idUsuario));

        // Valida que la membresía esté activa y no vencida
        boolean tieneMembresiaActiva = membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                idUsuario, List.of(EstadoMembresia.ACTIVO), LocalDate.now());
        if (!tieneMembresiaActiva) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.MEMBRESIA_INACTIVA,
                    "El socio no posee una membresía activa y vigente para ingresar");
        }

        // Acceso único simultáneo: no puede ingresar si ya tiene un acceso abierto
        if (accesoRepository.findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(idUsuario).isPresent()) {
            throw new AccesoException(HttpStatus.CONFLICT, CodigoError.YA_INGRESADO,
                    "El socio ya cuenta con un ingreso activo sin egreso registrado");
        }

        // Control de aforo en tiempo real: verificar que la sede no esté completa
        long aforoActual = accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(idSede);
        if (aforoActual >= sede.getAforoMaximo()) {
            throw new AccesoException(HttpStatus.CONFLICT, CodigoError.AFORO_COMPLETO,
                    "La sede ha alcanzado su aforo máximo permitido (" + sede.getAforoMaximo() + ")");
        }

        Acceso nuevoAcceso = Acceso.builder()
                .usuario(usuario)
                .sede(sede)
                .fechaHoraIngreso(LocalDateTime.now())
                .fechaHoraEgreso(null)
                .build();

        return accesoRepository.save(nuevoAcceso);
    }

    @Transactional
    public Acceso registrarEgreso(Long idAcceso) {
        Acceso acceso = accesoRepository.findById(idAcceso)
                .orElseThrow(() -> new RecursoNoEncontradoException("Acceso", idAcceso));

        if (acceso.getFechaHoraEgreso() != null) {
            throw new ReglaNegocioException("El acceso ya tiene registrada su fecha y hora de egreso");
        }

        acceso.setFechaHoraEgreso(LocalDateTime.now());
        return accesoRepository.save(acceso);
    }
}
