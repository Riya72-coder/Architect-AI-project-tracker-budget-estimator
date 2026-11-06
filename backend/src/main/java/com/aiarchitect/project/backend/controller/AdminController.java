package com.aiarchitect.project.backend.controller;

import com.aiarchitect.project.backend.model.Project;
import com.aiarchitect.project.backend.model.User;
import com.aiarchitect.project.backend.repository.ProjectRepository;
import com.aiarchitect.project.backend.repository.TaskRepository;
import com.aiarchitect.project.backend.repository.UserRepository;
import com.aiarchitect.project.backend.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional; // 🔥 NEW

// CORS is handled globally in SecurityConfig — @CrossOrigin removed.
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ProjectRepository projectRepo;

    @Autowired
    private TaskRepository taskRepo;

    @Autowired
    private com.aiarchitect.project.backend.security.JwtUtil jwtUtil;

    // ================= 🔐 ADMIN CHECK =================
    private boolean isAdmin(String token) {
        try {
            String role = jwtUtil.extractRole(token);
            return "ADMIN".equals(role);
        } catch (Exception e) {
            return false;
        }
    }

    // ================= 📊 STATS =================
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);

        if (!isAdmin(token)) {
            return ResponseEntity.status(403).body("Access Denied ❌");
        }

        Map<String, Object> stats = new HashMap<>();

        stats.put("users", userRepo.count());
        stats.put("projects", projectRepo.count());
        stats.put("tasks", taskRepo.count());

        return ResponseEntity.ok(stats);
    }

    // ================= 👤 USERS =================
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);

        if (!isAdmin(token)) {
            return ResponseEntity.status(403).body("Access Denied ❌");
        }

        List<User> users = userRepo.findAll();

        return ResponseEntity.ok(users);
    }

    // ================= 🔥 ROLE CHANGE (NEW ADD) =================
    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> changeUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);

        if (!isAdmin(token)) {
            return ResponseEntity.status(403).body("Access Denied ❌");
        }

        Optional<User> optionalUser = userRepo.findById(id);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(404).body("User not found ❌");
        }

        User user = optionalUser.get();
        user.setRole(body.get("role"));

        userRepo.save(user);

        return ResponseEntity.ok("Role updated ✅");
    }

    // ================= 🗑 DELETE USER =================
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);

        if (!isAdmin(token)) {
            return ResponseEntity.status(403).body("Access Denied ❌");
        }

        userRepo.deleteById(id);

        return ResponseEntity.ok("User deleted ✅");
    }

    // ================= 📁 PROJECTS =================
    @GetMapping("/projects")
    public ResponseEntity<?> getAllProjects(@RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);

        if (!isAdmin(token)) {
            return ResponseEntity.status(403).body("Access Denied ❌");
        }

        List<Project> projects = projectRepo.findAll();

        return ResponseEntity.ok(projects);
    }
}