package com.aiarchitect.project.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private Key key;

    @PostConstruct
    public void init() {
        // Build key from configured secret after injection
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    // ─── GENERATE TOKEN WITH ROLE ──────────────────────────────────────────────
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86_400_000)) // 24h
                .signWith(key)
                .compact();
    }

    // ─── EXTRACT ALL CLAIMS ────────────────────────────────────────────────────
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ─── GET EMAIL ─────────────────────────────────────────────────────────────
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // ─── GET ROLE ──────────────────────────────────────────────────────────────
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    // ─── VALIDATE TOKEN ────────────────────────────────────────────────────────
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}