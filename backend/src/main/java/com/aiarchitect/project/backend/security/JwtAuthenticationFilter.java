package com.aiarchitect.project.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads the "Authorization: Bearer <token>" header on every request.
 * If the token is valid, populates the SecurityContext with the user's
 * email and role so that Spring Security's authorization rules can enforce
 * access control.
 *
 * On failure the filter simply clears the context and lets the request
 * continue — the authorization rules in SecurityConfig will reject it.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.isTokenValid(token)) {
                String email = jwtUtil.extractEmail(token);
                String role  = jwtUtil.extractRole(token);   // e.g. "ADMIN" or "USER"

                // Spring Security expects authority strings like "ROLE_ADMIN"
                SimpleGrantedAuthority authority =
                        new SimpleGrantedAuthority("ROLE_" + role);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,           // principal (email string)
                                null,            // credentials — not needed post-login
                                List.of(authority)
                        );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // Invalid / expired token — clear any stale context
                SecurityContextHolder.clearContext();
            }
        }

        // Always continue the chain; authorization rules decide the final outcome
        filterChain.doFilter(request, response);
    }
}
