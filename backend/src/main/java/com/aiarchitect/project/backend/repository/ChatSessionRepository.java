package com.aiarchitect.project.backend.repository;


import com.aiarchitect.project.backend.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository
        extends JpaRepository<ChatSession, Long> {

    List<ChatSession>
    findByEmailOrderByCreatedAtDesc(
            String email
    );
}