package com.aiarchitect.project.backend.repository;



import com.aiarchitect.project.backend.model.ChatMessage;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface ChatMessageRepository
        extends JpaRepository<ChatMessage, Long> {

    // Get all messages of a session
    List<ChatMessage>
    findBySessionIdOrderByCreatedAtAsc(
            Long sessionId
    );

    // Get last 20 messages for AI context memory
    List<ChatMessage>
    findTop20BySessionIdOrderByCreatedAtDesc(
            Long sessionId
    );

    // Delete all messages of a session
    @Transactional
    void deleteBySessionId(
            Long sessionId
    );
}