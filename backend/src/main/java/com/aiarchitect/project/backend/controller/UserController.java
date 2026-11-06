package com.aiarchitect.project.backend.controller;

import com.aiarchitect.project.backend.model.User;
import com.aiarchitect.project.backend.model.Notification;
import com.aiarchitect.project.backend.repository.UserRepository;
import com.aiarchitect.project.backend.repository.NotificationRepository;
import com.aiarchitect.project.backend.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;

import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

// ⚠️  @CrossOrigin removed — CORS is handled globally in SecurityConfig.
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;   // BCrypt bean from SecurityConfig

    @Autowired
    private JwtUtil jwtUtil;                   // Spring-managed bean

    // ================= REGISTER =================
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {

        if (user.getRole() == null) {
            user.setRole("USER");
        }

        // 🔐 Hash the password before persisting
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        User savedUser = userRepository.save(user);

        // Admin notification
        Notification n = new Notification();
        n.setUserEmail("ADMIN");
        n.setMessage("New User Registered: " + savedUser.getEmail());
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepo.save(n);

        // Mask password before returning
        savedUser.setPassword(null);
        return ResponseEntity.ok(savedUser);
    }

    // ================= LOGIN =================
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginUser) {

        User existingUser = userRepository.findByEmail(loginUser.getEmail())
                .orElse(null);

        if (existingUser == null) {
            return ResponseEntity.status(401).body("User not found");
        }

        // 🔐 BCrypt comparison — plaintext vs stored hash
        if (!passwordEncoder.matches(loginUser.getPassword(), existingUser.getPassword())) {
            return ResponseEntity.status(401).body("Invalid password");
        }

        String token = jwtUtil.generateToken(
                existingUser.getEmail(),
                existingUser.getRole()
        );

        // Response shape unchanged — frontend relies on these exact keys
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login Successful");
        response.put("userId", existingUser.getId());
        response.put("name", existingUser.getName());
        response.put("email", existingUser.getEmail());
        response.put("role", existingUser.getRole());
        response.put("profilePic", existingUser.getProfilePic());
        response.put("token", token);

        return ResponseEntity.ok(response);
    }

    // ================= GET CURRENT USER =================
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {

        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Unauthorized");
            }

            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);

            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                return ResponseEntity.status(404).body("User not found");
            }

            // 🔐 Never send the hashed password to the client
            user.setPassword(null);
            return ResponseEntity.ok(user);

        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid token");
        }
    }

    // ================= LOGOUT =================
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok("Logged out successfully");
    }

    // ================= PROFILE UPLOAD =================
    @PostMapping("/uploadProfile/{id}")
    public ResponseEntity<?> uploadProfilePic(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get("uploads/" + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());

            user.setProfilePic(fileName);
            userRepository.save(user);

            return ResponseEntity.ok("Profile uploaded successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Upload failed");
        }
    }

    // ================= GET USER BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        user.setPassword(null);  // mask hash
        return ResponseEntity.ok(user);
    }

    // ================= GET ALL USERS (ADMIN ONLY) =================
    // Authorization enforced by SecurityConfig — only ROLE_ADMIN reaches here
    @GetMapping("/all")
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Mask hashed passwords before returning
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    // ================= UPDATE ROLE (ADMIN ONLY) =================
    // Authorization enforced by SecurityConfig — only ROLE_ADMIN reaches here
    @PutMapping("/role/{id}")
    public ResponseEntity<?> updateRole(@PathVariable Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("ADMIN".equals(user.getRole())) {
            user.setRole("USER");
        } else {
            user.setRole("ADMIN");
        }

        userRepository.save(user);
        return ResponseEntity.ok("Role Updated Successfully");
    }

    // ================= DELETE USER (ADMIN ONLY) =================
    // Authorization enforced by SecurityConfig — only ROLE_ADMIN reaches here
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {

        if (!userRepository.existsById(id)) {
            return ResponseEntity.badRequest().body("User not found");
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok("User Deleted Successfully");
    }
}