package com.fitzone.core.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI fitzoneOpenApi() {
        return new OpenAPI().info(new Info()
                .title("FitZone Sports API")
                .version("v1")
                .description("API REST de FitZone Sports. Todos los errores responden con el formato "
                        + "{ codigo, mensaje, detalles, timestamp } (schema RespuestaError)."));
    }
}
