package com.fitzone.core.config;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Semilla automática para entorno local: inicializa una sede y un gerente inicial
 * si la base de datos se encuentra vacía, permitiendo probar la API de inmediato sin scripts manuales.
 */
@Slf4j
@Component
@Profile("local")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SedeRepository sedeRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    public void run(String... args) {
        if (sedeRepository.count() == 0) {
            Sede sede = Sede.builder()
                    .nombre("Sede Central")
                    .aforoMaximo(150)
                    .build();
            sedeRepository.save(sede);
            log.info("[DEV SEED] Creada Sede inicial (id: {})", sede.getIdSede());
        }

        if (usuarioRepository.count() == 0) {
            Long idSede = sedeRepository.findAll().getFirst().getIdSede();
            Usuario gerente = Usuario.builder()
                    .dni("00000001")
                    .nombre("Admin")
                    .apellido("Gerente")
                    .email("gerente@fitzone.com")
                    .telefono("+5491100000000")
                    .tipoUsuario(TipoUsuario.GERENTE)
                    .idSede(idSede)
                    .authId(UUID.randomUUID())
                    .build();
            usuarioRepository.save(gerente);
            log.info("[DEV SEED] Creado Gerente operador inicial para pruebas (id: 1, idOperador: 1)");
        }
    }
}
