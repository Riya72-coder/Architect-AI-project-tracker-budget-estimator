package com.aiarchitect.project.backend.model;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_history")
public class ChatHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    @Column(name = "chat_title")
    private String chatTitle;

    @Column(columnDefinition = "TEXT")
    private String userMessage;

    @Column(columnDefinition = "TEXT")
    private String botMessage;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public ChatHistory() {
        this.createdAt = LocalDateTime.now();
    }

    public ChatHistory(
            String email,
            String chatTitle,
            String userMessage,
            String botMessage
    ) {
        this.email = email;
        this.chatTitle = chatTitle;
        this.userMessage = userMessage;
        this.botMessage = botMessage;
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

    public String getChatTitle() {
        return chatTitle;
    }

    public void setChatTitle(String chatTitle) {
        this.chatTitle = chatTitle;
    }

    public String getUserMessage() {
        return userMessage;
    }

    public void setUserMessage(String userMessage) {
        this.userMessage = userMessage;
    }

    public String getBotMessage() {
        return botMessage;
    }

    public void setBotMessage(String botMessage) {
        this.botMessage = botMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
