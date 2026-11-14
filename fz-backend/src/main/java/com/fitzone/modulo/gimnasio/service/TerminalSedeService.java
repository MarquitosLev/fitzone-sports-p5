package com.fitzone.modulo.gimnasio.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.NegocioException;
import com.fitzone.core.exception.PeticionInvalidaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.modulo.gimnasio.models.Acceso;
import com.fitzone.modulo.gimnasio.models.EventoIngresoOffline;
import com.fitzone.modulo.gimnasio.models.HabilitadosResponse;
import com.fitzone.modulo.gimnasio.models.ResultadoSincronizacion;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.models.SincronizacionRequest;
import com.fitzone.modulo.gimnasio.models.SincronizacionResponse;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Soporte del terminal de sede para operar sin conexión (RNF-01): entrega la lista local de
 * socios habilitados y confirma los ingresos que el terminal aprobó offline.
 */
@Slf4j
@Service
public class TerminalSedeService {

    /** Cuánto tiempo puede usar el terminal la lista antes de rechazar todo en modo offline. */
    static final Duration VIGENCIA_LISTA = Duration.ofHours(24);
    /** Antigüedad máxima de un ingreso offline: más atrás, no se acepta la hora declarada. */
    static final Duration ANTIGUEDAD_MAXIMA = Duration.ofHours(24);
    /** Tolerancia hacia adelante por relojes desfasados entre el terminal y el servidor. */
    static final Duration ADELANTO_MAXIMO = Duration.ofMinutes(2);

    private final AccesoService accesoService;
    private final AccesoRepository accesoRepository;
    private final SedeRepository sedeRepository;
    private final MembresiaRepository membresiaRepository;
    private final Clock clock;

    @Autowired
    public TerminalSedeService(AccesoService accesoService, AccesoRepository accesoRepository,
                               SedeRepository sedeRepository, MembresiaRepository membresiaRepository) {
        this(accesoService, accesoRepository, sedeRepository, membresiaRepository, Clock.systemUTC());
    }

    TerminalSedeService(AccesoService accesoService, AccesoRepository accesoRepository,
                        SedeRepository sedeRepository, MembresiaRepository membresiaRepository, Clock clock) {
        this.accesoService = accesoService;
        this.accesoRepository = accesoRepository;
        this.sedeRepository = sedeRepository;
        this.membresiaRepository = membresiaRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public HabilitadosResponse habilitados(Long idSede) {
        Long idSedeEfectiva = accesoService.resolverYValidarSedeOperador(idSede);
        if (idSedeEfectiva == null) {
            throw new PeticionInvalidaException("El idSede es obligatorio cuando el operador no tiene sede asignada en sesión");
        }
        Sede sede = sedeRepository.findById(idSedeEfectiva)
                .orElseThrow(() -> new RecursoNoEncontradoException("Sede", idSedeEfectiva));

        Instant ahora = clock.instant();
        LocalDate hoy = LocalDate.ofInstant(ahora, ZoneId.systemDefault());

        // Toda la cadena: por RF-03 un socio de cualquier sede puede entrar a esta
        List<HabilitadosResponse.SocioHabilitado> socios = membresiaRepository
                .findVigentesConUsuario(EstadoMembresia.ACTIVO, hoy).stream()
                .map(this::aSocioHabilitado)
                .toList();

        List<HabilitadosResponse.AccesoAbierto> adentro = accesoRepository
                .findBySede_IdSedeAndFechaHoraEgresoIsNull(idSedeEfectiva).stream()
                .map(this::aAccesoAbierto)
                .toList();

        return HabilitadosResponse.builder()
                .horaServidor(ahora)
                .validaHasta(ahora.plus(VIGENCIA_LISTA))
                .idSede(idSedeEfectiva)
                .aforoMaximo(sede.getAforoMaximo())
                .socios(socios)
                .adentro(adentro)
                .build();
    }

    /**
     * Sin @Transactional a propósito: cada ingreso se registra en su propia transacción
     * (la de AccesoService), así un rechazo no deshace los demás del lote.
     */
    public SincronizacionResponse sincronizar(List<EventoIngresoOffline> eventos) {
        if (eventos == null || eventos.isEmpty()) {
            throw new PeticionInvalidaException("La lista de eventos no puede estar vacía");
        }
        if (eventos.size() > SincronizacionRequest.MAX_EVENTOS) {
            throw new PeticionInvalidaException(
                    "Se pueden sincronizar como máximo " + SincronizacionRequest.MAX_EVENTOS + " eventos por vez");
        }

        List<ResultadoSincronizacion> resultados = new ArrayList<>(eventos.size());
        for (EventoIngresoOffline evento : eventos) {
            resultados.add(sincronizarEvento(evento));
        }
        return SincronizacionResponse.builder().resultados(resultados).build();
    }

    private ResultadoSincronizacion sincronizarEvento(EventoIngresoOffline evento) {
        String token = evento.getTokenQr();
        try {
            validarHoraDelEscaneo(evento.getOcurrioEn());

            // Idempotencia: el token lleva nonce, así que identifica un único ingreso
            Optional<Acceso> previo = accesoRepository.findByTokenQr(token);
            if (previo.isPresent()) {
                return ResultadoSincronizacion.builder()
                        .tokenQr(token)
                        .ok(true)
                        .codigo(ResultadoSincronizacion.DUPLICADO)
                        .idAcceso(previo.get().getIdAcceso())
                        .build();
            }

            Acceso acceso = accesoService.registrarIngreso(token, evento.getIdSede(), evento.getOcurrioEn());
            return ResultadoSincronizacion.builder()
                    .tokenQr(token)
                    .ok(true)
                    .idAcceso(acceso.getIdAcceso())
                    .build();
        } catch (NegocioException e) {
            return ResultadoSincronizacion.builder()
                    .tokenQr(token)
                    .ok(false)
                    .codigo(e.getCodigo().name())
                    .mensaje(e.getMessage())
                    .build();
        } catch (RuntimeException e) {
            log.error("Error inesperado al sincronizar un ingreso offline", e);
            return ResultadoSincronizacion.builder()
                    .tokenQr(token)
                    .ok(false)
                    .codigo(CodigoError.ERROR_INTERNO.name())
                    .mensaje("No se pudo registrar el ingreso; reintentá la sincronización")
                    .build();
        }
    }

    private void validarHoraDelEscaneo(Instant ocurrioEn) {
        Instant ahora = clock.instant();
        if (ocurrioEn.isAfter(ahora.plus(ADELANTO_MAXIMO))) {
            throw new PeticionInvalidaException("La hora del escaneo está en el futuro");
        }
        if (ocurrioEn.isBefore(ahora.minus(ANTIGUEDAD_MAXIMA))) {
            throw new PeticionInvalidaException("El ingreso tiene más de 24 horas y ya no se puede sincronizar");
        }
    }

    private HabilitadosResponse.SocioHabilitado aSocioHabilitado(Membresia membresia) {
        Usuario usuario = membresia.getUsuario();
        return HabilitadosResponse.SocioHabilitado.builder()
                .idUsuario(usuario.getIdUsuario())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .dni(usuario.getDni())
                .venceMembresia(membresia.getFechaVencimiento())
                .build();
    }

    private HabilitadosResponse.AccesoAbierto aAccesoAbierto(Acceso acceso) {
        return HabilitadosResponse.AccesoAbierto.builder()
                .idAcceso(acceso.getIdAcceso())
                .idUsuario(acceso.getUsuario() != null ? acceso.getUsuario().getIdUsuario() : null)
                .tokenQr(acceso.getTokenQr())
                .fechaHoraIngreso(acceso.getFechaHoraIngreso())
                .build();
    }
}
