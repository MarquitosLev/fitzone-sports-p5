package com.fitzone.core.controller;

import com.fitzone.core.database.DatabaseQueryService;
import com.fitzone.core.database.dto.ConsultaSqlRequest;
import com.fitzone.core.database.dto.ConsultaSqlResponse;
import com.fitzone.core.security.RootKeySecurityService;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador administrativo para consulta directa de la base de datos.
 * Oculto de la documentación Swagger pública (@Hidden) y protegido por Root Key Bearer.
 */
@Hidden
@RestController
@RequestMapping("/admin/database")
@RequiredArgsConstructor
public class AdminDatabaseController {

    private final RootKeySecurityService rootKeySecurityService;
    private final DatabaseQueryService databaseQueryService;

    @PostMapping("/query")
    public ResponseEntity<ConsultaSqlResponse> ejecutarConsulta(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            @Valid @RequestBody ConsultaSqlRequest request) {

        rootKeySecurityService.validarRootKey(authHeader);
        ConsultaSqlResponse respuesta = databaseQueryService.ejecutarConsulta(request);
        return ResponseEntity.ok(respuesta);
    }
}
