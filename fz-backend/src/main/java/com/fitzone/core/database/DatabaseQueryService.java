package com.fitzone.core.database;

import com.fitzone.core.database.dto.ConsultaSqlRequest;
import com.fitzone.core.database.dto.ConsultaSqlResponse;
import com.fitzone.core.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Servicio seguro para ejecución de consultas directas de lectura (SELECT) en la base de datos.
 * Aplica validación sintáctica estricta, bloqueo de comandos destructivos y modo de conexión read-only.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DatabaseQueryService {

    private static final Pattern PATRON_COMANDOS_PROHIBIDOS = Pattern.compile(
            "\\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE|COPY|CALL)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final Pattern PATRON_INICIO_PERMITIDO = Pattern.compile(
            "^(SELECT|WITH|EXPLAIN)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private static final int LIMITE_POR_DEFECTO = 100;
    private static final int LIMITE_MAXIMO = 1000;

    private final JdbcTemplate jdbcTemplate;

    /**
     * Ejecuta una consulta SQL en modo de solo lectura tras verificar que no contenga operaciones destructivas.
     *
     * @param request datos de la consulta y límites
     * @return resultados de la consulta con metadatos de columnas y tiempo de ejecución
     */
    @Transactional(readOnly = true)
    public ConsultaSqlResponse ejecutarConsulta(ConsultaSqlRequest request) {
        String sqlLimpia = sanitizarYValidarConsulta(request.getQuery());

        int maxFilas = request.getMaxFilas() != null && request.getMaxFilas() > 0
                ? Math.min(request.getMaxFilas(), LIMITE_MAXIMO)
                : LIMITE_POR_DEFECTO;

        long inicio = System.currentTimeMillis();

        try {
            return jdbcTemplate.execute((ConnectionCallback<ConsultaSqlResponse>) conn -> {
                boolean readOnlyOriginal = conn.isReadOnly();
                try {
                    conn.setReadOnly(true);
                    try (PreparedStatement ps = conn.prepareStatement(sqlLimpia)) {
                        ps.setMaxRows(maxFilas);
                        try (ResultSet rs = ps.executeQuery()) {
                            ResultSetMetaData meta = rs.getMetaData();
                            int cantColumnas = meta.getColumnCount();

                            List<String> columnas = new ArrayList<>();
                            for (int i = 1; i <= cantColumnas; i++) {
                                columnas.add(meta.getColumnLabel(i));
                            }

                            List<Map<String, Object>> filas = new ArrayList<>();
                            while (rs.next()) {
                                Map<String, Object> fila = new LinkedHashMap<>();
                                for (int i = 1; i <= cantColumnas; i++) {
                                    fila.put(columnas.get(i - 1), rs.getObject(i));
                                }
                                filas.add(fila);
                            }

                            long fin = System.currentTimeMillis();

                            return ConsultaSqlResponse.builder()
                                    .sql(sqlLimpia)
                                    .cantidadFilas(filas.size())
                                    .tiempoEjecucionMs(fin - inicio)
                                    .columnas(columnas)
                                    .filas(filas)
                                    .build();
                        }
                    }
                } finally {
                    try {
                        conn.setReadOnly(readOnlyOriginal);
                    } catch (SQLException ignored) {
                    }
                }
            });
        } catch (DataAccessException e) {
            String mensajeDetalle = e.getMostSpecificCause() != null
                    ? e.getMostSpecificCause().getMessage()
                    : e.getMessage();
            log.warn("Error ejecutando consulta administrativa en BD: {}", mensajeDetalle);
            throw new ReglaNegocioException("Error ejecutando la consulta en la base de datos: " + mensajeDetalle);
        }
    }

    /**
     * Limpia comentarios y valida que la consulta sea exclusivamente de lectura.
     */
    public String sanitizarYValidarConsulta(String query) {
        if (query == null || query.trim().isEmpty()) {
            throw new ReglaNegocioException("La consulta SQL no puede estar vacía.");
        }

        // Eliminar comentarios de bloque /* ... */ y de línea -- ..., y normalizar espacios
        String sinComentarios = query
                .replaceAll("/\\*.*?\\*/", " ")
                .replaceAll("--.*?(?=\\r?\\n|$)", " ")
                .replaceAll("\\s+", " ")
                .trim();

        // Eliminar punto y coma final si existe
        String sqlSinPuntoYComaFinal = sinComentarios.replaceAll(";+\\s*$", "").trim();

        if (sqlSinPuntoYComaFinal.isEmpty()) {
            throw new ReglaNegocioException("La consulta SQL no contiene sentencias válidas.");
        }

        // Si aún contiene ';' en medio, se rechaza para evitar inyección de sentencias múltiples
        if (sqlSinPuntoYComaFinal.contains(";")) {
            throw new ReglaNegocioException("No se permiten múltiples sentencias SQL en una misma consulta.");
        }

        // Validar que inicie con SELECT, WITH o EXPLAIN
        if (!PATRON_INICIO_PERMITIDO.matcher(sqlSinPuntoYComaFinal).find()) {
            throw new ReglaNegocioException("Solo se permiten consultas de lectura (SELECT, WITH o EXPLAIN).");
        }

        // Bloquear palabras clave de modificación o administración de esquema
        if (PATRON_COMANDOS_PROHIBIDOS.matcher(sqlSinPuntoYComaFinal).find()) {
            throw new ReglaNegocioException("La consulta contiene comandos no permitidos de modificación o administración (DML/DDL).");
        }

        return sqlSinPuntoYComaFinal;
    }
}
