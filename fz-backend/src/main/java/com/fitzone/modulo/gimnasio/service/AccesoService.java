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
import java.util.Optional;

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

        LocalDate hoy = LocalDate.now();
        boolean tieneMembresiaActiva = membresiaRepository
                .existsByUsuario_IdUsuarioAndEstadoAndFechaInicioLessThanEqualAndFechaVencimientoGreaterThanEqual(
                        idUsuario, EstadoMembresia.ACTIVO, hoy, hoy);
        if (!tieneMembresiaActiva) {
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.MEMBRESIA_INACTIVA,
                    "El socio no posee una membresía activa y vigente");
        }

        return qrTokenService.generarToken(idUsuario);
    }

    @Transactional
    public Acceso registrarIngreso(String tokenQr, Long idSede) {
        Long idUsuario = qrTokenService.validarYObtenerUsuario(tokenQr);

        // Control de un solo uso e idempotencia ante reintentos de red
        Optional<Acceso> accesoExistente = accesoRepository.findByTokenQr(tokenQr);
        if (accesoExistente.isPresent()) {
            Acceso previo = accesoExistente.get();
            if (previo.getFechaHoraEgreso() == null) {
                return previo;
            }
            throw new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.QR_VENCIDO,
                    "El código QR ya fue utilizado");
        }

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", idUsuario));

        LocalDate hoy = LocalDate.now();
        // Bloqueo pesimista sobre la membresía para coordinar con cancelaciones y sincronizar ingresos del socio
        membresiaRepository.findMembresiaActivaParaIngreso(idUsuario, EstadoMembresia.ACTIVO, hoy)
                .orElseThrow(() -> new AccesoException(HttpStatus.UNPROCESSABLE_ENTITY, CodigoError.MEMBRESIA_INACTIVA,
                        "El socio no posee una membresía activa y vigente para ingresar"));

        if (accesoRepository.findByUsuario_IdUsuarioAndFechaHoraEgresoIsNull(idUsuario).isPresent()) {
            throw new AccesoException(HttpStatus.CONFLICT, CodigoError.YA_INGRESADO,
                    "El socio ya cuenta con un ingreso activo sin egreso registrado");
        }

        // Bloqueo pesimista sobre la sede para coordinar cálculo de aforo con cambios concurrentes de capacidad
        Sede sede = sedeRepository.findByIdWithLock(idSede)
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", idSede));

        long aforoActual = accesoRepository.countBySede_IdSedeAndFechaHoraEgresoIsNull(idSede);
        if (aforoActual >= sede.getAforoMaximo()) {
            throw new AccesoException(HttpStatus.CONFLICT, CodigoError.AFORO_COMPLETO,
                    "La sede ha alcanzado su aforo máximo permitido (" + sede.getAforoMaximo() + ")");
        }

        Acceso nuevoAcceso = Acceso.builder()
                .usuario(usuario)
                .sede(sede)
                .tokenQr(tokenQr)
                .fechaHoraIngreso(LocalDateTime.now())
                .fechaHoraEgreso(null)
                .build();

        return accesoRepository.save(nuevoAcceso);
    }

    @Transactional
    public Acceso registrarEgreso(Long idAcceso) {
        // Bloqueo pesimista para hacer atómica la verificación de egreso y su registro
        Acceso acceso = accesoRepository.findByIdWithLock(idAcceso)
                .orElseThrow(() -> new RecursoNoEncontradoException("Acceso", idAcceso));

        if (acceso.getFechaHoraEgreso() != null) {
            throw new ReglaNegocioException("El acceso ya tiene registrada su fecha y hora de egreso");
        }

        acceso.setFechaHoraEgreso(LocalDateTime.now());
        return accesoRepository.save(acceso);
    }

    @Transactional(readOnly = true)
    public List<Acceso> listarPorSede(Long idSede) {
        if (!sedeRepository.existsById(idSede)) {
            throw new RecursoNoEncontradoException("Sede", idSede);
        }
        return accesoRepository.findBySede_IdSedeOrderByFechaHoraIngresoDesc(idSede);
    }
}
