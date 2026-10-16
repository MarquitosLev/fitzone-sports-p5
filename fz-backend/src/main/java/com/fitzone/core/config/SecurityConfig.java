package com.fitzone.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Sin esta configuración Spring Security bloquea todos los endpoints (incluido /ping) con 401.
    // Cuando se integre la autenticación JWT, agregar aquí .oauth2ResourceServer(...) y el issuer/jwk-set-uri en properties.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/ping", "/health", "/error").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // TEMPORAL hasta la historia de JWT: los endpoints de negocio quedan abiertos y el usuario
                        // y la sede viajan por parámetro o en el body. Con JWT, pasar /v1/** a authenticated().
                        .requestMatchers("/v1/**").permitAll()
                        .anyRequest().authenticated());

        return http.build();
    }

    // .cors(Customizer.withDefaults()) toma este bean, así el preflight (OPTIONS) se resuelve antes de la seguridad.
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${fitzone.cors.allowed-origins}") List<String> origenesPermitidos) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(origenesPermitidos);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
