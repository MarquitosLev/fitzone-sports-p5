package com.fitzone.core.config;

import com.fitzone.core.controller.PingController;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Todos los controladores de com.fitzone quedan bajo /api/v1 (el /api lo agrega server.servlet.context-path),
    // así cada controlador solo declara su recurso: @RequestMapping("/canchas") -> /api/v1/canchas.
    // /ping queda afuera porque el front lo consume en /api/ping para chequear la conexión.
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix("/v1", HandlerTypePredicate.forBasePackage("com.fitzone")
                .and(controlador -> controlador != PingController.class
                        && controlador != com.fitzone.core.controller.AdminDatabaseController.class));
    }
}
