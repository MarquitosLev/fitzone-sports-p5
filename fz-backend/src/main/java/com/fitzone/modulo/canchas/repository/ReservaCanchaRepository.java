package com.fitzone.modulo.canchas.repository;

import com.fitzone.modulo.canchas.models.ReservaCancha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservaCanchaRepository extends JpaRepository<ReservaCancha, Long> {

    // Reservas de una cancha específica
    List<ReservaCancha> findByCancha_IdCancha(Long idCancha);

    // Reservas de un usuario
    List<ReservaCancha> findByUsuario_IdUsuario(Long idUsuario);

    // Reservas propias con cancha y sede ya cargadas, de la más próxima a la más lejana
    @Query("SELECT r FROM ReservaCancha r JOIN FETCH r.cancha c JOIN FETCH c.sede LEFT JOIN FETCH r.usuario " +
           "WHERE r.usuario.idUsuario = :idUsuario ORDER BY r.fechaHoraInicio DESC")
    List<ReservaCancha> findConCanchaYSedeByUsuario(@Param("idUsuario") Long idUsuario);

    // Una reserva ocupa el turno si tiene un pago confirmado o si todavía está dentro de la retención sin pago
    // (ADR-019). Las impagas vencidas no bloquean: el turno vuelve a estar libre para otro.
    String OCUPA_EL_TURNO = "(EXISTS (SELECT t.idTransaccion FROM Transaccion t WHERE t.reservaCancha = r "
            + "AND t.estadoPago = com.fitzone.core.domain.enums.EstadoPago.CONFIRMADO) "
            + "OR r.createdAt IS NULL OR r.createdAt > :limiteRetencion)";

    // Reservas que ocupan turnos de una cancha en un rango horario, para la grilla de disponibilidad (RN-02)
    @Query("SELECT r FROM ReservaCancha r WHERE r.cancha.idCancha = :idCancha "
           + "AND r.fechaHoraInicio BETWEEN :inicio AND :fin AND " + OCUPA_EL_TURNO)
    List<ReservaCancha> findQueOcupanTurno(@Param("idCancha") Long idCancha,
                                           @Param("inicio") LocalDateTime inicio,
                                           @Param("fin") LocalDateTime fin,
                                           @Param("limiteRetencion") LocalDateTime limiteRetencion);

    @Query("SELECT COUNT(r) > 0 FROM ReservaCancha r " +
           "WHERE r.cancha.idCancha = :idCancha " +
           "AND r.fechaHoraInicio < :fin " +
           "AND r.fechaHoraFin > :inicio AND " + OCUPA_EL_TURNO)
    boolean existsSolapamiento(@Param("idCancha") Long idCancha,
                              @Param("inicio") LocalDateTime inicio,
                              @Param("fin") LocalDateTime fin,
                              @Param("limiteRetencion") LocalDateTime limiteRetencion);

    @Query("SELECT r FROM ReservaCancha r JOIN FETCH r.cancha c JOIN FETCH c.sede LEFT JOIN FETCH r.usuario " +
           "WHERE r.codigoReserva = :codigo")
    Optional<ReservaCancha> findConDetalleByCodigoReserva(@Param("codigo") UUID codigo);

}
