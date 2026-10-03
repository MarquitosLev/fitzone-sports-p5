package com.fitzone.modulo.clases.repository;

import com.fitzone.modulo.clases.models.ListaEspera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListaEsperaRepository extends JpaRepository<ListaEspera, Long> {

    // Recupera la cola de espera de una clase ordenada por turno (FIFO)
    List<ListaEspera> findByClase_IdClaseOrderByOrdenPosicionAsc(Long idClase);

    // Listas de espera donde está inscripto un usuario
    List<ListaEspera> findByUsuario_IdUsuario(Long idUsuario);

    // Permite al servicio verificar rápidamente si ya está encolado antes de agregarlo
    boolean existsByClase_IdClaseAndUsuario_IdUsuario(Long idClase, Long idUsuario);
}
