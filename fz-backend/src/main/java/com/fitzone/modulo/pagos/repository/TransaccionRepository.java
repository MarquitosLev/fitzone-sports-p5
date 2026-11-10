package com.fitzone.modulo.pagos.repository;

import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.modulo.pagos.models.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    // Transacciones de un usuario
    List<Transaccion> findByUsuario_IdUsuario(Long idUsuario);

    // Transacciones de una sede (para reportes financieros)
    List<Transaccion> findBySede_IdSede(Long idSede);

    // Transacciones por estado de pago
    List<Transaccion> findByEstadoPago(EstadoPago estadoPago);

    // Transacciones por concepto
    List<Transaccion> findByConcepto(TipoOrigenTransaccion concepto);

    // Buscar transaccion por token de la pasarela de pagos
    Optional<Transaccion> findByTokenTransaccionPasarela(String tokenTransaccionPasarela);

    // Verificar si una reserva de cancha ya fue pagada con éxito
    boolean existsByReservaCancha_IdReservaCanchaAndEstadoPago(Long idReservaCancha, EstadoPago estadoPago);

    Optional<Transaccion> findFirstByReservaCancha_IdReservaCanchaAndEstadoPago(Long idReservaCancha, EstadoPago estadoPago);

    // Verificar si una membresía ya registra un pago confirmado previo
    boolean existsByMembresia_IdMembresiaAndEstadoPago(Long idMembresia, EstadoPago estadoPago);

    // Historial cronológico de transacciones de un usuario
    List<Transaccion> findByUsuario_IdUsuarioOrderByFechaHoraCreacionDesc(Long idUsuario);

    // Historial propio con el detalle del concepto ya cargado: plan de la membresía, o cancha y horario de la reserva
    @Query("SELECT t FROM Transaccion t JOIN FETCH t.sede " +
           "LEFT JOIN FETCH t.membresia m LEFT JOIN FETCH m.plan " +
           "LEFT JOIN FETCH t.reservaCancha r LEFT JOIN FETCH r.cancha " +
           "WHERE t.usuario.idUsuario = :idUsuario ORDER BY t.fechaHoraCreacion DESC")
    List<Transaccion> findConDetalleByUsuario(@Param("idUsuario") Long idUsuario);
}
