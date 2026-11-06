package com.aiarchitect.project.backend.model;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id")
    private Long sessionId;

    private String sender;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public ChatMessage() {
        this.createdAt = LocalDateTime.now();
    }

    public ChatMessage(
            Long sessionId,
            String sender,
            String message
    ) {
        this.sessionId = sessionId;
        this.sender = sender;
        this.message = message;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(
            Long id
    ) {
        this.id = id;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(
            Long sessionId
    ) {
        this.sessionId = sessionId;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(
            String sender
    ) {
        this.sender = sender;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(
            String message
    ) {
        this.message = message;
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
