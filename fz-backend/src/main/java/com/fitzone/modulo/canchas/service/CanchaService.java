package com.fitzone.modulo.canchas.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.canchas.dto.CotizacionDTO;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.models.EstadoFranja;
import com.fitzone.modulo.canchas.models.FranjaDisponibilidad;
import com.fitzone.modulo.canchas.models.ReservaCancha;
import com.fitzone.modulo.canchas.repository.CanchaRepository;
import com.fitzone.modulo.canchas.repository.ReservaCanchaRepository;
import com.fitzone.modulo.canchas.strategy.CalculadorPrecioCancha;
import com.fitzone.modulo.canchas.strategy.ContextoPrecio;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CanchaService {

    public static final int HORA_APERTURA = 8;
    public static final int HORA_CIERRE = 23;

    private final CanchaRepository canchaRepository;
    private final ReservaCanchaRepository reservaCanchaRepository;
    private final SedeRepository sedeRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final CalculadorPrecioCancha calculadorPrecioCancha;
    private final UsuarioActual usuarioActual;

    @Transactional
    public Cancha crear(Cancha cancha) {
        Long idSede = cancha.getSede() != null ? cancha.getSede().getIdSede() : null;
        if (idSede == null) {
            throw new ReglaNegocioException("La sede es obligatoria");
        }
        usuarioActual.validarSede(idSede);
        Sede sede = sedeRepository.findById(idSede)
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", idSede));
        cancha.setSede(sede);

        if (cancha.getPrecioBaseHora() == null || cancha.getPrecioBaseHora().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException("El precio base por hora debe ser mayor a 0");
        }
        if (canchaRepository.existsBySede_IdSedeAndNombreIgnoreCase(idSede, cancha.getNombre())) {
            throw new ConflictoException("Ya existe una cancha con el nombre '" + cancha.getNombre() + "' en la sede seleccionada");
        }

        cancha.setIdCancha(null);
        return canchaRepository.save(cancha);
    }

    @Transactional
    public Cancha actualizar(Long id, Cancha datos) {
        Cancha existente = obtenerPorId(id);

        if (datos.getPrecioBaseHora() == null || datos.getPrecioBaseHora().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ReglaNegocioException("El precio base por hora debe ser mayor a 0");
        }

        Long idSedeActual = existente.getSede().getIdSede();
        Usuario operador = usuarioActual.obtener();
        usuarioActual.validarSede(operador, idSedeActual);
        Long nuevoIdSede = datos.getSede() != null ? datos.getSede().getIdSede() : null;
        if (nuevoIdSede != null && !nuevoIdSede.equals(idSedeActual)) {
            // Mover la cancha a otra sede exige poder operar también sobre la de destino
            usuarioActual.validarSede(operador, nuevoIdSede);
            Sede nuevaSede = sedeRepository.findById(nuevoIdSede)
                    .orElseThrow(() -> new RecursoNoEncontradoException("Sede", nuevoIdSede));
            existente.setSede(nuevaSede);
            idSedeActual = nuevoIdSede;
        }

        if (canchaRepository.existsBySede_IdSedeAndNombreIgnoreCaseAndIdCanchaNot(idSedeActual, datos.getNombre(), id)) {
            throw new ConflictoException("Ya existe otra cancha con el nombre '" + datos.getNombre() + "' en la sede");
        }

        existente.setNombre(datos.getNombre());
        existente.setTipo(datos.getTipo());
        existente.setPrecioBaseHora(datos.getPrecioBaseHora());
        return canchaRepository.save(existente);
    }

    @Transactional(readOnly = true)
    public Cancha obtenerPorId(Long id) {
        return canchaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cancha", id));
    }

    @Transactional(readOnly = true)
    public List<Cancha> listar(Long idSede, String tipo) {
        if (idSede == null) {
            throw new ReglaNegocioException("El parámetro idSede es obligatorio");
        }
        if (!sedeRepository.existsById(idSede)) {
            throw new RecursoNoEncontradoException("Sede", idSede);
        }
        if (tipo != null && !tipo.isBlank()) {
            return canchaRepository.findBySede_IdSedeAndTipoIgnoreCase(idSede, tipo.trim());
        }
        return canchaRepository.findBySede_IdSede(idSede);
    }

    @Transactional
    public Cancha cambiarMantenimiento(Long id, boolean enMantenimiento) {
        Cancha cancha = obtenerPorId(id);
        usuarioActual.validarSede(cancha.getSede().getIdSede());
        cancha.setEnMantenimiento(enMantenimiento);
        return canchaRepository.save(cancha);
    }

    /**
     * Endpoint público: sin sesión cotiza el precio sin descuento. Con sesión de un socio con
     * membresía vigente aplica el 15% (RN-03). El usuario sale del token, nunca del request.
     */
    @Transactional(readOnly = true)
    public CotizacionDTO cotizar(Long idCancha, LocalDateTime inicio, LocalDateTime fin) {
        return cotizarPara(idCancha, usuarioActual.obtenerOpcional().orElse(null), inicio, fin);
    }

    @Transactional(readOnly = true)
    public CotizacionDTO cotizarPara(Long idCancha, Usuario usuario, LocalDateTime inicio, LocalDateTime fin) {
        if (inicio == null || fin == null || !inicio.isBefore(fin)) {
            throw new ReglaNegocioException("La fecha y hora de inicio debe ser anterior a la de fin");
        }
        Cancha cancha = obtenerPorId(idCancha);

        boolean esSocioActivo = usuario != null
                && usuario.getTipoUsuario() == TipoUsuario.SOCIO
                && membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                        usuario.getIdUsuario(), List.of(EstadoMembresia.ACTIVO), LocalDate.now());

        ContextoPrecio contexto = ContextoPrecio.builder()
                .cancha(cancha)
                .usuario(usuario)
                .inicio(inicio)
                .fin(fin)
                .esSocioActivo(esSocioActivo)
                .build();
        return calculadorPrecioCancha.calcular(contexto);
    }

    @Transactional(readOnly = true)
    public List<FranjaDisponibilidad> obtenerDisponibilidad(Long idCancha, LocalDate fecha) {
        Cancha cancha = obtenerPorId(idCancha);
        LocalDate fechaConsulta = fecha != null ? fecha : LocalDate.now();

        LocalDateTime inicioDia = fechaConsulta.atTime(HORA_APERTURA, 0);
        LocalDateTime finDia = fechaConsulta.atTime(HORA_CIERRE, 0);
        List<ReservaCancha> reservasDelDia = reservaCanchaRepository
                .findByCancha_IdCanchaAndFechaHoraInicioBetween(idCancha, inicioDia, finDia);

        List<FranjaDisponibilidad> franjas = new ArrayList<>();
        for (int hora = HORA_APERTURA; hora < HORA_CIERRE; hora++) {
            LocalDateTime franjaInicio = fechaConsulta.atTime(hora, 0);
            LocalDateTime franjaFin = fechaConsulta.atTime(hora + 1, 0);

            boolean ocupada = reservasDelDia.stream().anyMatch(r ->
                    r.getFechaHoraInicio().isBefore(franjaFin) && r.getFechaHoraFin().isAfter(franjaInicio));

            EstadoFranja estado;
            if (ocupada) {
                estado = EstadoFranja.OCUPADO;
            } else if (cancha.isEnMantenimiento()) {
                estado = EstadoFranja.MANTENIMIENTO;
            } else {
                estado = EstadoFranja.LIBRE;
            }

            franjas.add(FranjaDisponibilidad.builder()
                    .horaInicio(franjaInicio)
                    .horaFin(franjaFin)
                    .estado(estado)
                    .build());
        }
        return franjas;
    }

    @Transactional
    public ReservaCancha reservar(Long idCancha, ReservaCancha reserva) {
        validarTurno(reserva);
        Usuario usuario = usuarioActual.obtener();
        if (usuario.getTipoUsuario() != TipoUsuario.SOCIO) {
            throw new ReglaNegocioException("Con sesión reservan solo los socios. Sin cuenta, reservá como invitado");
        }
        return guardarReserva(idCancha, usuario, reserva);
    }

    @Transactional
    public ReservaCancha reservarComoInvitado(Long idCancha, Usuario invitado, ReservaCancha reserva) {
        validarTurno(reserva);
        if (invitado.getTipoUsuario() != TipoUsuario.EXTERNO) {
            throw new ReglaNegocioException("El checkout de invitado es solo para usuarios sin cuenta");
        }
        return guardarReserva(idCancha, invitado, reserva);
    }

    private void validarTurno(ReservaCancha reserva) {
        if (reserva == null) {
            throw new ReglaNegocioException("Los datos de la reserva son obligatorios");
        }
        LocalDateTime inicio = reserva.getFechaHoraInicio();
        LocalDateTime fin = reserva.getFechaHoraFin();
        if (inicio == null || fin == null) {
            throw new ReglaNegocioException("Las fechas de inicio y fin son obligatorias");
        }
        if (!inicio.isBefore(fin)) {
            throw new ReglaNegocioException("La fecha y hora de inicio debe ser anterior a la de fin");
        }
        if (inicio.isBefore(LocalDateTime.now())) {
            throw new ReglaNegocioException("La reserva debe ser en una fecha y hora futura");
        }
        if (inicio.getMinute() != 0 || inicio.getSecond() != 0 || fin.getMinute() != 0 || fin.getSecond() != 0) {
            throw new ReglaNegocioException("Los turnos deben comenzar y finalizar en horas enteras");
        }
        if (inicio.getHour() < HORA_APERTURA || fin.getHour() > HORA_CIERRE || !inicio.toLocalDate().equals(fin.toLocalDate())) {
            throw new ReglaNegocioException("El turno debe estar dentro del horario de atención (08:00 a 23:00)");
        }
    }

    private ReservaCancha guardarReserva(Long idCancha, Usuario usuario, ReservaCancha reserva) {
        LocalDateTime inicio = reserva.getFechaHoraInicio();
        LocalDateTime fin = reserva.getFechaHoraFin();

        // Bloqueo pesimista sobre la cancha para garantizar concurrencia segura
        Cancha cancha = canchaRepository.findByIdForUpdate(idCancha)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cancha", idCancha));

        if (cancha.isEnMantenimiento()) {
            throw new ReglaNegocioException("La cancha se encuentra en mantenimiento");
        }

        if (reservaCanchaRepository.existsSolapamiento(idCancha, inicio, fin)) {
            throw new ConflictoException("La cancha ya se encuentra reservada en el horario solicitado");
        }

        CotizacionDTO cotizacion = cotizarPara(idCancha, usuario, inicio, fin);
        reserva.setPrecioFinal(cotizacion.getPrecioFinal());
        reserva.setCancha(cancha);
        reserva.setUsuario(usuario);
        reserva.setIdReservaCancha(null);
        reserva.setCodigoReserva(null);

        return reservaCanchaRepository.save(reserva);
    }

    @Transactional(readOnly = true)
    public List<ReservaCancha> listarReservasPorUsuario(Long idUsuario) {
        if (idUsuario == null) {
            throw new ReglaNegocioException("El idUsuario es obligatorio");
        }
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new RecursoNoEncontradoException("Usuario", idUsuario);
        }
        return reservaCanchaRepository.findByUsuario_IdUsuario(idUsuario);
    }

    @Transactional(readOnly = true)
    public List<ReservaCancha> listarMias() {
        return reservaCanchaRepository.findConCanchaYSedeByUsuario(usuarioActual.obtener().getIdUsuario());
    }
}
