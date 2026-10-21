package com.fitzone.core.config;

import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.PlanRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Semilla automática para entorno local: inicializa una sede, gerente y planes iniciales
 * si la base de datos se encuentra vacía, permitiendo probar la API de inmediato sin scripts manuales.
 */
@Slf4j
@Component
@Profile("local")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SedeRepository sedeRepository;
    private final UsuarioRepository usuarioRepository;
    private final PlanRepository planRepository;

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

        if (planRepository.count() == 0) {
            Plan mensual = Plan.builder()
                    .nombre("Plan Mensual")
                    .precioBase(new BigDecimal("15000.00"))
                    .duracionMeses(1)
                    .build();
            Plan trimestral = Plan.builder()
                    .nombre("Plan Trimestral")
                    .precioBase(new BigDecimal("40000.00"))
                    .duracionMeses(3)
                    .build();
            Plan anual = Plan.builder()
                    .nombre("Plan Anual")
                    .precioBase(new BigDecimal("140000.00"))
                    .duracionMeses(12)
                    .build();

            planRepository.saveAll(List.of(mensual, trimestral, anual));
            log.info("[DEV SEED] Creados 3 planes iniciales (Mensual, Trimestral, Anual)");
        }
    }
}
