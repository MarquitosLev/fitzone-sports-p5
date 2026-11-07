package com.fitzone.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitzone.core.exception.CodigoError;
import com.fitzone.core.exception.RespuestaError;
import com.fitzone.core.security.JwtAuthConverter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import com.fitzone.modulo.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String MENSAJE_NO_AUTENTICADO = "Tenés que iniciar sesión para realizar esta operación";
    private static final String MENSAJE_SIN_PERMISO = "No tenés permisos para realizar esta operación";

    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:${fitzone.supabase.url:https://lzpmyoxpcaelgnjycpfz.supabase.co}/auth/v1/.well-known/jwks.json}") String jwkSetUri) {
        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri)
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .jwsAlgorithm(SignatureAlgorithm.RS256)
                .build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(new JwtAuthConverter(usuarioRepository)))
                        .authenticationEntryPoint(this::responderNoAutenticado))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(this::responderNoAutenticado)
                        .accessDeniedHandler((request, response, denegado) ->
                                escribirError(response, HttpStatus.FORBIDDEN, MENSAJE_SIN_PERMISO)))
                // Solo se listan las rutas públicas: todo lo demás exige sesión y el rol se valida con @PreAuthorize
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/ping", "/health", "/error").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers("/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/planes").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/sedes", "/v1/sedes/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/canchas", "/v1/canchas/*",
                                "/v1/canchas/*/disponibilidad", "/v1/canchas/*/cotizacion").permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/canchas", "/v1/clases").hasRole("GERENTE")
                        .requestMatchers(HttpMethod.PUT, "/v1/canchas/*", "/v1/clases/*").hasRole("GERENTE")
                        // Muestran el formato de error; solo se registran fuera del perfil prod
                        .requestMatchers("/v1/prueba/**").permitAll()
                        // Endpoint administrativo protegido internamente con Bearer Root Key
                        .requestMatchers("/admin/database/**").permitAll()
                        .anyRequest().authenticated());

        return http.build();
    }

    // 401 sin token o con token inválido/vencido, con el formato común de error
    private void responderNoAutenticado(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException ex) throws IOException {
        escribirError(response, HttpStatus.UNAUTHORIZED, MENSAJE_NO_AUTENTICADO);
    }

    private void escribirError(HttpServletResponse response, HttpStatus status, String mensaje) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        RespuestaError error = new RespuestaError(CodigoError.ACCESO_DENEGADO, mensaje, List.of(), Instant.now());
        objectMapper.writeValue(response.getOutputStream(), error);
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
