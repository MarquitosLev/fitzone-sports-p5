package com.fitzone.modulo.clases.service;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.EstadoReservaClase;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.core.exception.AccesoDenegadoException;
import com.fitzone.core.exception.ConflictoException;
import com.fitzone.core.exception.MembresiaInactivaException;
import com.fitzone.core.exception.RecursoNoEncontradoException;
import com.fitzone.core.exception.ReglaNegocioException;
import com.fitzone.core.security.UsuarioActual;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.models.ListaEspera;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.clases.repository.ListaEsperaRepository;
import com.fitzone.modulo.clases.repository.ReservaClaseRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ListaEsperaService {

    private final ListaEsperaRepository listaEsperaRepository;
    private final ClaseGrupalRepository claseGrupalRepository;
    private final ReservaClaseRepository reservaClaseRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioActual usuarioActual;

    @Transactional
    public ListaEspera anotarse(Long idClase) {
        // El bloqueo evita que dos pedidos simultáneos dupliquen al socio o repitan la posición
        ClaseGrupal clase = claseGrupalRepository.findByIdWithLock(idClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", idClase));

        Usuario usuario = usuarioActual.obtener();
        Long idUsuario = usuario.getIdUsuario();

        if (usuario.getTipoUsuario() != TipoUsuario.SOCIO) {
            throw new ReglaNegocioException("Solo los socios pueden anotarse en la lista de espera");
        }

        boolean tieneMembresiaActiva = membresiaRepository.existsByUsuario_IdUsuarioAndEstadoInAndFechaVencimientoGreaterThanEqual(
                idUsuario, List.of(EstadoMembresia.ACTIVO), LocalDate.now());
        if (!tieneMembresiaActiva) {
            throw new MembresiaInactivaException("El socio no posee una membresía activa y vigente");
        }

        LocalDateTime ahora = LocalDateTime.now();
        if (ahora.isAfter(clase.getFechaHoraInicio())) {
            throw new ReglaNegocioException("No se puede ingresar a la lista de espera de una clase que ya comenzó o finalizó");
        }

        long reservasConfirmadas = reservaClaseRepository.countByClase_IdClaseAndEstado(idClase, EstadoReservaClase.CONFIRMADA);
        if (reservasConfirmadas < clase.getCupoMaximo()) {
            throw new ReglaNegocioException("La clase aún posee cupos disponibles. Realice la reserva directa.");
        }

        if (reservaClaseRepository.existsByClase_IdClaseAndUsuario_IdUsuarioAndEstado(idClase, idUsuario, EstadoReservaClase.CONFIRMADA)) {
            throw new ConflictoException("El socio ya posee una reserva confirmada para esta clase");
        }

        if (listaEsperaRepository.existsByClase_IdClaseAndUsuario_IdUsuario(idClase, idUsuario)) {
            throw new ConflictoException("El socio ya se encuentra en la lista de espera de esta clase");
        }

        List<ListaEspera> colaActual = listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(idClase);
        int nuevaPosicion = colaActual.isEmpty() ? 1 : colaActual.get(colaActual.size() - 1).getOrdenPosicion() + 1;

        ListaEspera nuevaEntrada = ListaEspera.builder()
                .clase(clase)
                .usuario(usuario)
                .ordenPosicion(nuevaPosicion)
                .build();

        log.info("Socio {} anotado en lista de espera de clase {} con posición {}", idUsuario, idClase, nuevaPosicion);
        return listaEsperaRepository.save(nuevaEntrada);
    }

    @Transactional
    public void salir(Long idEspera) {
        ListaEspera espera = listaEsperaRepository.findById(idEspera)
                .orElseThrow(() -> new RecursoNoEncontradoException("Inscripción en lista de espera", idEspera));

        if (!espera.getUsuario().getIdUsuario().equals(usuarioActual.obtener().getIdUsuario())) {
            throw new AccesoDenegadoException("Solo podés salir de tus propias listas de espera");
        }

        // Mismo bloqueo que anotarse, para que la cola no se reordene mientras otro socio toma su posición
        Long idClase = espera.getClase().getIdClase();
        claseGrupalRepository.findByIdWithLock(idClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", idClase));
        quitarDeLaCola(espera);
    }

    @Transactional(readOnly = true)
    public List<ListaEspera> listarPorClase(Long idClase) {
        ClaseGrupal clase = claseGrupalRepository.findById(idClase)
                .orElseThrow(() -> new RecursoNoEncontradoException("Clase grupal", idClase));
        usuarioActual.validarSede(clase.getSede().getIdSede());
        return listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(idClase);
    }

    @Transactional(readOnly = true)
    public List<ListaEspera> listarMias() {
        return listaEsperaRepository.findByUsuario_IdUsuario(usuarioActual.obtener().getIdUsuario());
    }

    @Transactional
    public void removerSocioSiEstaEnEspera(Long idClase, Long idUsuario) {
        Optional<ListaEspera> enEspera = listaEsperaRepository.findByClase_IdClaseAndUsuario_IdUsuario(idClase, idUsuario);
        if (enEspera.isPresent()) {
            quitarDeLaCola(enEspera.get());
            log.info("Socio {} removido de la lista de espera de clase {} al concretar su reserva", idUsuario, idClase);
        }
    }

    private void quitarDeLaCola(ListaEspera espera) {
        Long idClase = espera.getClase().getIdClase();
        listaEsperaRepository.delete(espera);
        reacomodarPosiciones(idClase);
        log.info("Inscripción en lista de espera {} eliminada y posiciones reacomodadas para clase {}", espera.getIdEspera(), idClase);
    }

    private void reacomodarPosiciones(Long idClase) {
        List<ListaEspera> restantes = listaEsperaRepository.findByClase_IdClaseOrderByOrdenPosicionAsc(idClase);
        for (int i = 0; i < restantes.size(); i++) {
            ListaEspera e = restantes.get(i);
            int posicionEsperada = i + 1;
            if (e.getOrdenPosicion() != posicionEsperada) {
                e.setOrdenPosicion(posicionEsperada);
                listaEsperaRepository.save(e);
            }
        }
    }
}
