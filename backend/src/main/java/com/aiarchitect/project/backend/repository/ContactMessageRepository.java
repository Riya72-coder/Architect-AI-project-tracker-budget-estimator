package com.aiarchitect.project.backend.repository;


import com.aiarchitect.project.backend.model.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
}