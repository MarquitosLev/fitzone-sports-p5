package com.fitzone.core.config;

import com.fitzone.core.domain.enums.EstadoMembresia;
import com.fitzone.core.domain.enums.TipoUsuario;
import com.fitzone.modulo.canchas.models.Cancha;
import com.fitzone.modulo.canchas.repository.CanchaRepository;
import com.fitzone.modulo.clases.models.ClaseGrupal;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.gimnasio.models.Sede;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.usuarios.models.Membresia;
import com.fitzone.modulo.usuarios.models.Plan;
import com.fitzone.modulo.usuarios.models.Usuario;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.PlanRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Semilla automática para entorno local
 * Inicializa dos sedes, los tres planes, usuarios semilla por rol, membresía
 * activa y vencida,
 * canchas (operativa y mantenimiento) y clases grupales de prueba.
 */
@Slf4j
@Component
@Profile("local")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

        private final SedeRepository sedeRepository;
        private final UsuarioRepository usuarioRepository;
        private final PlanRepository planRepository;
        private final MembresiaRepository membresiaRepository;
        private final CanchaRepository canchaRepository;
        private final ClaseGrupalRepository claseGrupalRepository;

        @Override
        public void run(String... args) {
                // 1. Sedes (idempotente por nombre)
                if (!sedeRepository.existsByNombreIgnoreCase("Sede Central")) {
                        sedeRepository.save(Sede.builder().nombre("Sede Central").aforoMaximo(150).build());
                        log.info("[DEV SEED] Creada Sede Central");
                }
                if (!sedeRepository.existsByNombreIgnoreCase("Sede Norte")) {
                        sedeRepository.save(Sede.builder().nombre("Sede Norte").aforoMaximo(100).build());
                        log.info("[DEV SEED] Creada Sede Norte");
                }

                Sede sedeCentral = sedeRepository.findAll().stream()
                                .filter(s -> "Sede Central".equalsIgnoreCase(s.getNombre()))
                                .findFirst().orElseGet(() -> sedeRepository.findAll().getFirst());
                Sede sedeNorte = sedeRepository.findAll().stream()
                                .filter(s -> "Sede Norte".equalsIgnoreCase(s.getNombre()))
                                .findFirst().orElse(sedeCentral);
                Long idSedeCentral = sedeCentral.getIdSede();

                // 2. Usuarios semilla (idempotente por email y DNI)
                if (usuarioRepository.findByEmail("gerente@fitzone.com").isEmpty() && usuarioRepository.findByDni("00000001").isEmpty()) {
                        Usuario gerente = Usuario.builder()
                                        .dni("00000001")
                                        .nombre("Admin")
                                        .apellido("Gerente")
                                        .email("gerente@fitzone.com")
                                        .telefono("+5491100000000")
                                        .tipoUsuario(TipoUsuario.GERENTE)
                                        .idSede(idSedeCentral)
                                        .authId(UUID.randomUUID())
                                        .build();
                        usuarioRepository.save(gerente);
                        log.info("[DEV SEED] Creado Gerente inicial (gerente@fitzone.com)");
                }

                if (usuarioRepository.findByEmail("recepcionista@fitzone.com").isEmpty() && usuarioRepository.findByDni("00000002").isEmpty()) {
                        Usuario recepcionista = Usuario.builder()
                                        .dni("00000002")
                                        .nombre("Lucía")
                                        .apellido("Recepcionista")
                                        .email("recepcionista@fitzone.com")
                                        .telefono("+5491100000001")
                                        .tipoUsuario(TipoUsuario.RECEPCIONISTA)
                                        .idSede(idSedeCentral)
                                        .authId(UUID.randomUUID())
                                        .build();
                        usuarioRepository.save(recepcionista);
                        log.info("[DEV SEED] Creada Recepcionista inicial (recepcionista@fitzone.com)");
                }

                if (usuarioRepository.findByEmail("socio@fitzone.com").isEmpty() && usuarioRepository.findByDni("00000003").isEmpty()) {
                        Usuario socio = Usuario.builder()
                                        .dni("00000003")
                                        .nombre("Martín")
                                        .apellido("Socio")
                                        .email("socio@fitzone.com")
                                        .telefono("+5491100000002")
                                        .tipoUsuario(TipoUsuario.SOCIO)
                                        .idSede(null)
                                        .authId(UUID.randomUUID())
                                        .build();
                        usuarioRepository.save(socio);
                        log.info("[DEV SEED] Creado Socio activo inicial (socio@fitzone.com)");
                }

                if (usuarioRepository.findByEmail("socio.vencido@fitzone.com").isEmpty() && usuarioRepository.findByDni("00000005").isEmpty()) {
                        Usuario socioVencido = Usuario.builder()
                                        .dni("00000005")
                                        .nombre("Pablo")
                                        .apellido("Moroso")
                                        .email("socio.vencido@fitzone.com")
                                        .telefono("+5491100000004")
                                        .tipoUsuario(TipoUsuario.SOCIO)
                                        .idSede(null)
                                        .authId(UUID.randomUUID())
                                        .build();
                        usuarioRepository.save(socioVencido);
                        log.info("[DEV SEED] Creado Socio con cuota vencida (socio.vencido@fitzone.com)");
                }

                if (usuarioRepository.findByEmail("externo@fitzone.com").isEmpty() && usuarioRepository.findByDni("00000004").isEmpty()) {
                        Usuario externo = Usuario.builder()
                                        .dni("00000004")
                                        .nombre("Laura")
                                        .apellido("Externo")
                                        .email("externo@fitzone.com")
                                        .telefono("+5491100000003")
                                        .tipoUsuario(TipoUsuario.EXTERNO)
                                        .idSede(null)
                                        .authId(null)
                                        .build();
                        usuarioRepository.save(externo);
                        log.info("[DEV SEED] Creado Externo inicial (externo@fitzone.com)");
                }

                // 3. Planes (idempotente por nombre)
                if (!planRepository.existsByNombre("Plan Mensual")) {
                        planRepository.save(Plan.builder()
                                        .nombre("Plan Mensual")
                                        .precioBase(new BigDecimal("15000.00"))
                                        .duracionMeses(1)
                                        .build());
                        log.info("[DEV SEED] Creado Plan Mensual");
                }
                if (!planRepository.existsByNombre("Plan Trimestral")) {
                        planRepository.save(Plan.builder()
                                        .nombre("Plan Trimestral")
                                        .precioBase(new BigDecimal("40000.00"))
                                        .duracionMeses(3)
                                        .build());
                        log.info("[DEV SEED] Creado Plan Trimestral");
                }
                if (!planRepository.existsByNombre("Plan Anual")) {
                        planRepository.save(Plan.builder()
                                        .nombre("Plan Anual")
                                        .precioBase(new BigDecimal("140000.00"))
                                        .duracionMeses(12)
                                        .build());
                        log.info("[DEV SEED] Creado Plan Anual");
                }

                // 4. Membresías semilla (idempotente por usuario)
                Plan planMensual = planRepository.findByNombre("Plan Mensual")
                                .orElseGet(() -> planRepository.findAll().stream().findFirst().orElse(null));

                if (planMensual != null) {
                        usuarioRepository.findByEmail("socio@fitzone.com").ifPresent(socioActivo -> {
                                if (membresiaRepository.findByUsuario(socioActivo).isEmpty()) {
                                        Membresia membresiaActiva = Membresia.builder()
                                                        .usuario(socioActivo)
                                                        .plan(planMensual)
                                                        .fechaInicio(LocalDate.now().minusDays(5))
                                                        .fechaVencimiento(LocalDate.now().plusDays(25))
                                                        .estado(EstadoMembresia.ACTIVO)
                                                        .build();
                                        membresiaRepository.save(membresiaActiva);
                                        log.info("[DEV SEED] Creada Membresía ACTIVA para socio@fitzone.com");
                                }
                        });

                        usuarioRepository.findByEmail("socio.vencido@fitzone.com").ifPresent(socioVencido -> {
                                if (membresiaRepository.findByUsuario(socioVencido).isEmpty()) {
                                        Membresia membresiaVencida = Membresia.builder()
                                                        .usuario(socioVencido)
                                                        .plan(planMensual)
                                                        .fechaInicio(LocalDate.now().minusDays(40))
                                                        .fechaVencimiento(LocalDate.now().minusDays(10))
                                                        .estado(EstadoMembresia.VENCIDO)
                                                        .build();
                                        membresiaRepository.save(membresiaVencida);
                                        log.info("[DEV SEED] Creada Membresía VENCIDA para socio.vencido@fitzone.com");
                                }
                        });
                }

                // 5. Canchas semilla (idempotente por nombre)
                if (canchaRepository.findByNombre("Cancha Fútbol 5 - Palermo").isEmpty()) {
                        canchaRepository.save(Cancha.builder()
                                        .sede(sedeCentral)
                                        .nombre("Cancha Fútbol 5 - Palermo")
                                        .tipo("FUTBOL_5")
                                        .precioBaseHora(new BigDecimal("20000.00"))
                                        .enMantenimiento(false)
                                        .build());
                        log.info("[DEV SEED] Creada Cancha Fútbol 5 - Palermo");
                }
                if (canchaRepository.findByNombre("Cancha Paddle 1 (Mantenimiento)").isEmpty()) {
                        canchaRepository.save(Cancha.builder()
                                        .sede(sedeCentral)
                                        .nombre("Cancha Paddle 1 (Mantenimiento)")
                                        .tipo("PADDLE")
                                        .precioBaseHora(new BigDecimal("15000.00"))
                                        .enMantenimiento(true)
                                        .build());
                        log.info("[DEV SEED] Creada Cancha Paddle 1 (Mantenimiento)");
                }
                if (canchaRepository.findByNombre("Cancha Tenis - Belgrano").isEmpty()) {
                        canchaRepository.save(Cancha.builder()
                                        .sede(sedeNorte)
                                        .nombre("Cancha Tenis - Belgrano")
                                        .tipo("TENIS")
                                        .precioBaseHora(new BigDecimal("25000.00"))
                                        .enMantenimiento(false)
                                        .build());
                        log.info("[DEV SEED] Creada Cancha Tenis - Belgrano");
                }

                // 6. Clases grupales semilla (idempotente por actividad en sede)
                List<ClaseGrupal> clasesExistentes = claseGrupalRepository.findBySede_IdSede(sedeCentral.getIdSede());
                boolean existeSpinning = clasesExistentes.stream().anyMatch(c -> "Spinning Pro".equals(c.getNombreActividad()));
                boolean existeYoga = clasesExistentes.stream().anyMatch(c -> "Yoga Integral (Completa)".equals(c.getNombreActividad()));

                if (!existeSpinning) {
                        LocalDateTime manana18hs = LocalDateTime.now().plusDays(1).withHour(18).withMinute(0)
                                        .withSecond(0);
                        claseGrupalRepository.save(ClaseGrupal.builder()
                                        .sede(sedeCentral)
                                        .nombreActividad("Spinning Pro")
                                        .fechaHoraInicio(manana18hs)
                                        .duracionMinutos(60)
                                        .cupoMaximo(20)
                                        .cupoDisponible(20)
                                        .build());
                        log.info("[DEV SEED] Creada clase grupal Spinning Pro");
                }

                if (!existeYoga) {
                        LocalDateTime pasadoManana10hs = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0)
                                        .withSecond(0);
                        claseGrupalRepository.save(ClaseGrupal.builder()
                                        .sede(sedeCentral)
                                        .nombreActividad("Yoga Integral (Completa)")
                                        .fechaHoraInicio(pasadoManana10hs)
                                        .duracionMinutos(45)
                                        .cupoMaximo(1)
                                        .cupoDisponible(0)
                                        .build());
                        log.info("[DEV SEED] Creada clase grupal Yoga Integral (Completa)");
                }
        }
}
