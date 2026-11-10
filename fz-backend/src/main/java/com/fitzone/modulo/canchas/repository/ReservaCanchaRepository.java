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
    @Query("SELECT r FROM ReservaCancha r JOIN FETCH r.cancha c JOIN FETCH c.sede JOIN FETCH r.usuario " +
           "WHERE r.usuario.idUsuario = :idUsuario ORDER BY r.fechaHoraInicio DESC")
    List<ReservaCancha> findConCanchaYSedeByUsuario(@Param("idUsuario") Long idUsuario);

    // Consulta para validar disponibilidad o agenda de turnos en un rango horario (RN-02)
    List<ReservaCancha> findByCancha_IdCanchaAndFechaHoraInicioBetween(Long idCancha, LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT COUNT(r) > 0 FROM ReservaCancha r " +
           "WHERE r.cancha.idCancha = :idCancha " +
           "AND r.fechaHoraInicio < :fin " +
           "AND r.fechaHoraFin > :inicio")
    boolean existsSolapamiento(@Param("idCancha") Long idCancha,
                              @Param("inicio") LocalDateTime inicio,
                              @Param("fin") LocalDateTime fin);

    @Query("SELECT r FROM ReservaCancha r JOIN FETCH r.cancha c JOIN FETCH c.sede JOIN FETCH r.usuario " +
           "WHERE r.codigoReserva = :codigo")
    Optional<ReservaCancha> findConDetalleByCodigoReserva(@Param("codigo") UUID codigo);

    @Query("SELECT COUNT(r) FROM ReservaCancha r WHERE r.usuario.idUsuario = :idUsuario " +
           "AND r.fechaHoraInicio > :ahora AND NOT EXISTS (SELECT t.idTransaccion FROM Transaccion t " +
           "WHERE t.reservaCancha = r AND t.estadoPago = com.fitzone.core.domain.enums.EstadoPago.CONFIRMADO)")
    long contarPendientesDePago(@Param("idUsuario") Long idUsuario, @Param("ahora") LocalDateTime ahora);
}
