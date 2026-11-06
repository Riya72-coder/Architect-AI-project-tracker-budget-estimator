package com.aiarchitect.project.backend.controller;

import com.aiarchitect.project.backend.model.ContactMessage;
import com.aiarchitect.project.backend.repository.ContactMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// CORS is handled globally in SecurityConfig — @CrossOrigin removed.
@RestController
@RequestMapping("/api/contact")
public class ContactController {

    @Autowired
    private ContactMessageRepository repository;

    // 🔥 SAVE MESSAGE
    @PostMapping
    public ContactMessage saveMessage(@RequestBody ContactMessage msg) {
        return repository.save(msg);
    }

    // 🔥 GET ALL MESSAGES (ADMIN)
    @GetMapping
    public List<ContactMessage> getMessages() {
        return repository.findAll();
    }
}