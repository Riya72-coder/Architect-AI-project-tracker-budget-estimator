package com.aiarchitect.project.backend.controller;



import com.aiarchitect.project.backend.model.ChatSession;
import com.aiarchitect.project.backend.model.ChatMessage;

import com.aiarchitect.project.backend.repository.ChatSessionRepository;
import com.aiarchitect.project.backend.repository.ChatMessageRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// CORS is handled globally in SecurityConfig — @CrossOrigin removed.
@RestController
@RequestMapping("/api/chat-session")
public class ChatSessionController {

    @Autowired
    private ChatSessionRepository
            chatSessionRepository;

    @Autowired
    private ChatMessageRepository
            chatMessageRepository;

    // ================= CREATE SESSION =================

    @PostMapping("/create")
    public ChatSession createSession(
            @RequestBody ChatSession session
    ) {

        return chatSessionRepository.save(
                session
        );
    }

    // ================= SAVE MESSAGE =================

    @PostMapping("/message")
    public ChatMessage saveMessage(
            @RequestBody ChatMessage message
    ) {

        return chatMessageRepository.save(
                message
        );
    }

    // ================= GET USER SESSIONS =================

    @GetMapping("/user/{email}")
    public List<ChatSession> getUserSessions(
            @PathVariable String email
    ) {

        return chatSessionRepository
                .findByEmailOrderByCreatedAtDesc(
                        email
                );
    }

    // ================= GET SESSION MESSAGES =================

    @GetMapping("/{sessionId}")
    public List<ChatMessage> getSessionMessages(
            @PathVariable Long sessionId
    ) {

        return chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(
                        sessionId
                );
    }

    // ================= DELETE SESSION =================

    @DeleteMapping("/{sessionId}")
    @Transactional
    public String deleteSession(
            @PathVariable Long sessionId
    ) {

        chatMessageRepository
                .deleteBySessionId(
                        sessionId
                );

        chatSessionRepository
                .deleteById(
                        sessionId
                );

        return "Session Deleted";
    }
}