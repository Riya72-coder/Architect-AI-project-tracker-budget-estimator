package com.aiarchitect.project.backend.controller;


import com.aiarchitect.project.backend.model.ChatHistory;
import com.aiarchitect.project.backend.repository.ChatHistoryRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// CORS is handled globally in SecurityConfig — @CrossOrigin removed.
@RestController
@RequestMapping("/api/chat-history")
public class ChatHistoryController {

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    // ================= SAVE CHAT =================

    @PostMapping("/save")
    public ChatHistory saveChat(
            @RequestBody ChatHistory chatHistory
    ) {

        return chatHistoryRepository.save(
                chatHistory
        );
    }

    // ================= GET USER HISTORY =================

    @GetMapping("/user/{email}")
    public List<ChatHistory> getUserHistory(
            @PathVariable String email
    ) {

        return chatHistoryRepository
                .findByEmailOrderByCreatedAtDesc(
                        email
                );
    }

    // ================= GET SINGLE CHAT =================

    @GetMapping("/{id}")
    public ChatHistory getChatById(
            @PathVariable Long id
    ) {

        return chatHistoryRepository
                .findById(id)
                .orElse(null);
    }

    // ================= DELETE CHAT =================

    @DeleteMapping("/{id}")
    public String deleteChat(
            @PathVariable Long id
    ) {

        chatHistoryRepository.deleteById(id);

        return "Chat Deleted Successfully";
    }

    // ================= DELETE ALL USER CHATS =================

    @DeleteMapping("/clear/{email}")
    public String clearHistory(
            @PathVariable String email
    ) {

        List<ChatHistory> chats =
                chatHistoryRepository
                        .findByEmailOrderByCreatedAtDesc(
                                email
                        );

        chatHistoryRepository.deleteAll(chats);

        return "All Chats Cleared";
    }
}
