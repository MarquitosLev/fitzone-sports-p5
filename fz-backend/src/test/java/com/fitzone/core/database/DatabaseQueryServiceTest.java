package com.fitzone.core.database;

import com.fitzone.core.exception.ReglaNegocioException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

class DatabaseQueryServiceTest {

    private DatabaseQueryService service;

    @BeforeEach
    void setUp() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        service = new DatabaseQueryService(jdbcTemplate);
    }

    @Test
    @DisplayName("Permite y limpia consultas SELECT simples")
    void permiteSelectSimple() {
        String query = "  SELECT id, nombre FROM usuarios WHERE id = 1;  ";
        String resultado = service.sanitizarYValidarConsulta(query);

        assertEquals("SELECT id, nombre FROM usuarios WHERE id = 1", resultado);
    }

    @Test
    @DisplayName("Permite consultas WITH (CTE) que terminan en SELECT")
    void permiteConsultasWith() {
        String query = "WITH ultimos AS (SELECT * FROM pagos) SELECT * FROM ultimos";
        String resultado = service.sanitizarYValidarConsulta(query);

        assertEquals("WITH ultimos AS (SELECT * FROM pagos) SELECT * FROM ultimos", resultado);
    }

    @Test
    @DisplayName("Permite consultas EXPLAIN")
    void permiteExplain() {
        String query = "EXPLAIN ANALYZE SELECT * FROM sedes";
        String resultado = service.sanitizarYValidarConsulta(query);

        assertEquals("EXPLAIN ANALYZE SELECT * FROM sedes", resultado);
    }

    @Test
    @DisplayName("Remueve comentarios SQL de línea y de bloque")
    void remueveComentarios() {
        String query = """
                /* Comentario de bloque */
                SELECT id FROM usuarios -- comentario de linea
                WHERE estado = 'ACTIVO';
                """;
        String resultado = service.sanitizarYValidarConsulta(query);

        assertEquals("SELECT id FROM usuarios WHERE estado = 'ACTIVO'", resultado);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "INSERT INTO usuarios (nombre) VALUES ('pepe')",
            "UPDATE usuarios SET nombre = 'pepe'",
            "DELETE FROM usuarios WHERE id = 1",
            "DROP TABLE usuarios",
            "ALTER TABLE usuarios ADD COLUMN nuevo int",
            "TRUNCATE TABLE usuarios",
            "GRANT ALL PRIVILEGES ON DATABASE fitzone TO public"
    })
    @DisplayName("Rechaza sentencias destructivas o de modificación")
    void rechazaSentenciasDestructivas(String queryProhibida) {
        assertThrows(ReglaNegocioException.class, () -> service.sanitizarYValidarConsulta(queryProhibida));
    }

    @Test
    @DisplayName("Rechaza consultas múltiples separadas por punto y coma")
    void rechazaMultiplesSentenciasConPuntoYComa() {
        String queryMultiple = "SELECT * FROM usuarios; DROP TABLE pagos";

        assertThrows(ReglaNegocioException.class, () -> service.sanitizarYValidarConsulta(queryMultiple));
    }

    @Test
    @DisplayName("Rechaza consultas vacías o que solo contengan comentarios")
    void rechazaConsultasVacias() {
        assertThrows(ReglaNegocioException.class, () -> service.sanitizarYValidarConsulta(""));
        assertThrows(ReglaNegocioException.class, () -> service.sanitizarYValidarConsulta("   "));
        assertThrows(ReglaNegocioException.class, () -> service.sanitizarYValidarConsulta("/* Solo comentario */"));
    }
}
