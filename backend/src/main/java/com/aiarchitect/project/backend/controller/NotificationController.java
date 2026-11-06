package com.aiarchitect.project.backend.controller;

import com.aiarchitect.project.backend.model.Notification;
import com.aiarchitect.project.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// CORS is handled globally in SecurityConfig — @CrossOrigin removed.
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    // ================= CREATE =================
    @PostMapping
    public Notification createNotification(@RequestBody Notification notification) {
        return notificationRepository.save(notification);
    }

    // ================= GET ALL (ADMIN - OLD, KEEP SAME) =================
    @GetMapping
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    // ================= 🔥 NEW: GET ADMIN NOTIFICATIONS ONLY =================
    @GetMapping("/admin")
    public List<Notification> getAdminNotifications() {
        return notificationRepository
                .findByUserEmailOrderByCreatedAtDesc("ADMIN");
    }

    // ================= GET USER NOTIFICATIONS =================
    @GetMapping("/{email}")
    public List<Notification> getNotifications(@PathVariable String email) {
        return notificationRepository
                .findByUserEmailOrderByCreatedAtDesc(email);
    }

    // ================= MARK AS READ (DELETE) =================
    @PutMapping("/read/{id}")
    public Notification markAsRead(@PathVariable Long id) {

        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notificationRepository.delete(n); // 🔥 DELETE (no change)

        return n; // same return (NO BREAK)
    }

    // ================= DELETE (MANUAL) =================
    @DeleteMapping("/{id}")
    public String deleteNotification(@PathVariable Long id) {
        notificationRepository.deleteById(id);
        return "Notification deleted";
    }
}