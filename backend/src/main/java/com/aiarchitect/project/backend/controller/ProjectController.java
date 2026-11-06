package com.aiarchitect.project.backend.controller;

import com.aiarchitect.project.backend.model.Project;
import com.aiarchitect.project.backend.model.Notification;
import com.aiarchitect.project.backend.repository.ProjectRepository;
import com.aiarchitect.project.backend.repository.NotificationRepository;
import com.aiarchitect.project.backend.security.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

// CORS is handled globally in SecurityConfig — @CrossOrigin removed.
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private NotificationRepository notificationRepo;

    @Autowired
    private JwtUtil jwtUtil;

    // ================= ADD PROJECT =================
    @PostMapping("/add")
    public ResponseEntity<?> addProject(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("deadline") String deadline,
            @RequestParam("status") String status,
            @RequestParam(value = "image", required = false) MultipartFile file
    ) {
        try {

            String token = authHeader.substring(7);
            String userEmail = jwtUtil.extractEmail(token);

            List<String> validStatus = List.of("Pending", "In Progress", "Completed", "Delayed");

            if (!validStatus.contains(status)) {
                return ResponseEntity.badRequest().body("Invalid Status ❌");
            }

            if (deadline != null && deadline.compareTo(java.time.LocalDate.now().toString()) < 0
                    && !status.equals("Completed")) {
                status = "Delayed";
            }

            String fileName = "default.jpg";

            if (file != null && !file.isEmpty()) {

                String uploadDir = "uploads/";
                fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

                Path uploadPath = Paths.get(uploadDir);

                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                Files.write(uploadPath.resolve(fileName), file.getBytes());
            }

            Project project = new Project();
            project.setName(name);
            project.setDescription(description);
            project.setDeadline(deadline);
            project.setStatus(status);
            project.setUserEmail(userEmail);
            project.setImage(fileName);

            projectRepository.save(project);

            // 🔥 ADMIN NOTIFICATION (ADD) — actionable: navigate to the new project's dashboard
            Notification n = new Notification();
            n.setUserEmail("ADMIN");
            n.setMessage("New Project Added: " + project.getName());
            n.setRead(false);
            n.setCreatedAt(LocalDateTime.now());
            n.setLinkUrl("/dashboard/" + project.getId());
            notificationRepo.save(n);

            return ResponseEntity.ok("Project Added Successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error adding project");
        }
    }

    // ================= SEARCH =================
    @GetMapping("/search")
    public ResponseEntity<?> searchProjects(
            @RequestParam String query,
            @RequestHeader("Authorization") String authHeader) {

        try {

            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            String role = jwtUtil.extractRole(token);

            List<Project> projects;

            if ("ADMIN".equals(role)) {
                projects = projectRepository.findAll()
                        .stream()
                        .filter(p -> p.getName() != null &&
                                p.getName().toLowerCase().contains(query.toLowerCase()))
                        .toList();
            } else {
                projects = projectRepository.findByUserEmail(email)
                        .stream()
                        .filter(p -> p.getName() != null &&
                                p.getName().toLowerCase().contains(query.toLowerCase()))
                        .toList();
            }

            return ResponseEntity.ok(projects);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Search Error ❌");
        }
    }

    // ================= ADMIN - GET ALL =================
    @GetMapping("/all")
    public ResponseEntity<?> getAllProjects(@RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String role = jwtUtil.extractRole(token);

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body("Access Denied ❌");
        }

        return ResponseEntity.ok(projectRepository.findAll());
    }

    // ================= GET PROJECT BY ID =================
    @GetMapping("/id/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable int id) {

        Project project = projectRepository.findById(id).orElse(null);

        if (project == null) {
            return ResponseEntity.status(404).body("Project Not Found ❌");
        }

        return ResponseEntity.ok(project);
    }

    // ================= USER + ADMIN =================
    @GetMapping("/{email}")
    public ResponseEntity<?> getProjects(
            @PathVariable String email,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String tokenEmail = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        if (!tokenEmail.equals(email) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body("Access Denied ❌");
        }

        return ResponseEntity.ok(projectRepository.findByUserEmail(email));
    }

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(
            @PathVariable int id,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        Project project = projectRepository.findById(id).orElse(null);

        if (project == null) {
            return ResponseEntity.status(404).body("Project Not Found");
        }

        if (!project.getUserEmail().equals(email) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body("Not allowed ❌");
        }

        projectRepository.deleteById(id);

        // 🔥 ADMIN NOTIFICATION (DELETE) — informational: project is gone, no link
        Notification n = new Notification();
        n.setUserEmail("ADMIN");
        n.setMessage("Project Deleted: " + project.getName());
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        n.setLinkUrl(null); // informational — expands inline
        notificationRepo.save(n);

        return ResponseEntity.ok("Project Deleted Successfully");
    }

    // ================= UPDATE PROJECT =================
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateProject(
            @PathVariable int id,
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("deadline") String deadline,
            @RequestParam("status") String status,
            @RequestParam(value = "image", required = false) MultipartFile file
    ) {
        try {

            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            String role = jwtUtil.extractRole(token);

            Project project = projectRepository.findById(id).orElse(null);

            if (project == null) {
                return ResponseEntity.status(404).body("Project Not Found ❌");
            }

            if (!project.getUserEmail().equals(email) && !"ADMIN".equals(role)) {
                return ResponseEntity.status(403).body("Not allowed ❌");
            }

            List<String> validStatus = List.of("Pending", "In Progress", "Completed", "Delayed");

            if (!validStatus.contains(status)) {
                return ResponseEntity.badRequest().body("Invalid Status ❌");
            }

            if (deadline != null && deadline.compareTo(java.time.LocalDate.now().toString()) < 0
                    && !status.equals("Completed")) {
                status = "Delayed";
            }

            project.setName(name);
            project.setDescription(description);
            project.setDeadline(deadline);
            project.setStatus(status);

            if (file != null && !file.isEmpty()) {

                String uploadDir = "uploads/";
                String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

                Path uploadPath = Paths.get(uploadDir);

                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                Files.write(uploadPath.resolve(fileName), file.getBytes());

                project.setImage(fileName);
            }

            projectRepository.save(project);

            // 🔥 ADMIN NOTIFICATION (UPDATE) — actionable: navigate to project dashboard
            Notification n = new Notification();
            n.setUserEmail("ADMIN");
            n.setMessage("Project Updated: " + project.getName());
            n.setRead(false);
            n.setCreatedAt(LocalDateTime.now());
            n.setLinkUrl("/dashboard/" + project.getId());
            notificationRepo.save(n);

            return ResponseEntity.ok("Project Updated Successfully ✅");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Update Error ❌");
        }
    }

    // ================= SIMPLE UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<?> simpleUpdateProject(
            @PathVariable int id,
            @RequestBody Project updatedProject,
            @RequestHeader("Authorization") String authHeader) {

        try {

            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            String role = jwtUtil.extractRole(token);

            Project project = projectRepository.findById(id).orElse(null);

            if (project == null) {
                return ResponseEntity.status(404).body("Project Not Found ❌");
            }

            if (!project.getUserEmail().equals(email) && !"ADMIN".equals(role)) {
                return ResponseEntity.status(403).body("Not allowed ❌");
            }

            String status = updatedProject.getStatus();

            List<String> validStatus = List.of("Pending", "In Progress", "Completed", "Delayed");

            if (!validStatus.contains(status)) {
                return ResponseEntity.badRequest().body("Invalid Status ❌");
            }

            String deadline = updatedProject.getDeadline();

            if (deadline != null && deadline.compareTo(java.time.LocalDate.now().toString()) < 0
                    && !status.equals("Completed")) {
                status = "Delayed";
            }

            project.setName(updatedProject.getName());
            project.setDeadline(deadline);
            project.setStatus(status);

            projectRepository.save(project);

            // 🔥 ADMIN NOTIFICATION (SIMPLE UPDATE) — actionable: navigate to project dashboard
            Notification n = new Notification();
            n.setUserEmail("ADMIN");
            n.setMessage("Project Updated: " + project.getName());
            n.setRead(false);
            n.setCreatedAt(LocalDateTime.now());
            n.setLinkUrl("/dashboard/" + project.getId());
            notificationRepo.save(n);

            return ResponseEntity.ok("Project Updated ✅");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Update Error ❌");
        }
    }
}