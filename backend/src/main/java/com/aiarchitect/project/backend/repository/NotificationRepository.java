package com.aiarchitect.project.backend.repository;

import com.aiarchitect.project.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 🔥 USER NOTIFICATIONS
    List<Notification> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    // 🔥 ADMIN NOTIFICATIONS (OPTIONAL - CLEAN)
    List<Notification> findByUserEmail(String userEmail);

}