package com.fitzone.modulo.canchas.repository;

import com.fitzone.modulo.canchas.models.ReservaCancha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReservaCanchaRepository extends JpaRepository<ReservaCancha, Long> {

    // Reservas de una cancha específica
    List<ReservaCancha> findByCancha_IdCancha(Long idCancha);

    // Reservas de un usuario
    List<ReservaCancha> findByUsuario_IdUsuario(Long idUsuario);

    // Consulta para validar disponibilidad o agenda de turnos en un rango horario (RN-02)
    List<ReservaCancha> findByCancha_IdCanchaAndFechaHoraInicioBetween(Long idCancha, LocalDateTime inicio, LocalDateTime fin);
}
