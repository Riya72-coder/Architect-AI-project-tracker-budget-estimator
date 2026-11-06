package com.aiarchitect.project.backend.model;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_sessions")
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    private String title;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public ChatSession() {
        this.createdAt = LocalDateTime.now();
    }

    public ChatSession(
            String email,
            String title
    ) {
        this.email = email;
        this.title = title;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(
            String title
    ) {
        this.title = title;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt
    ) {
        this.createdAt = createdAt;
    }
}