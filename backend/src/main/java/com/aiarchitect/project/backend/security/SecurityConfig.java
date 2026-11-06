package com.aiarchitect.project.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    // ─── BCrypt password encoder ────────────────────────────────────────────────
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ─── Single CORS source of truth ───────────────────────────────────────────
    // allowCredentials(true) requires an explicit origin list — no wildcards.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ─── Security filter chain ──────────────────────────────────────────────────
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Stateless API — no HTTP sessions
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Disable form login and HTTP Basic — we use JWT exclusively
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())

            // Register JWT filter BEFORE the standard username/password filter
            .addFilterBefore(jwtAuthenticationFilter,
                    UsernamePasswordAuthenticationFilter.class)

            .authorizeHttpRequests(auth -> auth

                // ── Public endpoints ──────────────────────────────────────────
                .requestMatchers(
                        "/api/users/register",
                        "/api/users/login",
                        "/api/users/logout"
                ).permitAll()

                // Contact form — no user context required
                .requestMatchers("/api/contact/**").permitAll()

                // ── Admin-only endpoints ──────────────────────────────────────
                .requestMatchers("/api/users/all").hasRole("ADMIN")
                .requestMatchers("/api/users/role/**").hasRole("ADMIN")

                // DELETE /api/users/{id} — admin only
                .requestMatchers(
                        org.springframework.http.HttpMethod.DELETE,
                        "/api/users/**"
                ).hasRole("ADMIN")

                // ── Authenticated users ───────────────────────────────────────
                .requestMatchers(
                        "/api/users/me",
                        "/api/users/uploadProfile/**",
                        "/api/users/**"
                ).authenticated()

                // All other /api/** routes require a valid token
                .anyRequest().authenticated()
            );

        return http.build();
    }
}