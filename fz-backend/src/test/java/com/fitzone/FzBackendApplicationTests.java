package com.fitzone;

import com.fitzone.modulo.canchas.repository.CanchaRepository;
import com.fitzone.modulo.canchas.repository.ReservaCanchaRepository;
import com.fitzone.modulo.clases.repository.ClaseGrupalRepository;
import com.fitzone.modulo.clases.repository.ListaEsperaRepository;
import com.fitzone.modulo.clases.repository.ReservaClaseRepository;
import com.fitzone.modulo.gimnasio.repository.AccesoRepository;
import com.fitzone.modulo.gimnasio.repository.SedeRepository;
import com.fitzone.modulo.pagos.repository.ComprobanteRepository;
import com.fitzone.modulo.pagos.repository.TransaccionRepository;
import com.fitzone.modulo.usuarios.repository.MembresiaRepository;
import com.fitzone.modulo.usuarios.repository.PlanRepository;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
class FzBackendApplicationTests {

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @MockitoBean
    private SedeRepository sedeRepository;

    @MockitoBean
    private AccesoRepository accesoRepository;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @MockitoBean
    private MembresiaRepository membresiaRepository;

    @MockitoBean
    private PlanRepository planRepository;

    @MockitoBean
    private CanchaRepository canchaRepository;

    @MockitoBean
    private ReservaCanchaRepository reservaCanchaRepository;

    @MockitoBean
    private ClaseGrupalRepository claseGrupalRepository;

    @MockitoBean
    private ListaEsperaRepository listaEsperaRepository;

    @MockitoBean
    private ReservaClaseRepository reservaClaseRepository;

    @MockitoBean
    private ComprobanteRepository comprobanteRepository;

    @MockitoBean
    private TransaccionRepository transaccionRepository;

    @MockitoBean
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Test
    void contextLoads() {
    }
}
