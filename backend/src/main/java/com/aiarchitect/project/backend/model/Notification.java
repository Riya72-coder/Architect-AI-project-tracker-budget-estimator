package com.aiarchitect.project.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;

    private String message;

    private boolean isRead = false;

    // Deep-link URL for actionable notifications (null = informational, show inline)
    private String linkUrl;

    private LocalDateTime createdAt = LocalDateTime.now();

    // ===== CONSTRUCTOR =====
    public Notification() {}

    public Notification(String userEmail, String message) {
        this.userEmail = userEmail;
        this.message = message;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
    }

    public Notification(String userEmail, String message, String linkUrl) {
        this.userEmail = userEmail;
        this.message = message;
        this.isRead = false;
        this.createdAt = LocalDateTime.now();
        this.linkUrl = linkUrl;
    }

    // ===== GETTERS & SETTERS =====

    public Long getId() {
        return id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public void setLinkUrl(String linkUrl) {
        this.linkUrl = linkUrl;
    }
}