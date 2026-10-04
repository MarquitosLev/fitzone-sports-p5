package com.fitzone.modulo.pagos.repository;

import com.fitzone.core.domain.enums.EstadoPago;
import com.fitzone.core.domain.enums.TipoOrigenTransaccion;
import com.fitzone.modulo.pagos.models.Transaccion;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
