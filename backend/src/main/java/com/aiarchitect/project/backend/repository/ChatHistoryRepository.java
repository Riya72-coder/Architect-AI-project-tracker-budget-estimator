package com.aiarchitect.project.backend.repository;

import com.aiarchitect.project.backend.model.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatHistoryRepository
        extends JpaRepository<ChatHistory, Long> {

    List<ChatHistory> findByEmailOrderByCreatedAtDesc(
            String email
    );
}