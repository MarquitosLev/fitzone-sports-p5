package com.fitzone.modulo.pagos.repository;

import com.fitzone.modulo.pagos.models.Comprobante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {

    Optional<Comprobante> findByTransaccion_IdTransaccion(Long idTransaccion);

    Optional<Comprobante> findByNumeroComprobante(String numeroComprobante);
}
