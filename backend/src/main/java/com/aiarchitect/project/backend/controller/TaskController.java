package com.aiarchitect.project.backend.controller;

import com.aiarchitect.project.backend.model.Task;
import com.aiarchitect.project.backend.model.Notification;
import com.aiarchitect.project.backend.repository.TaskRepository;
import com.aiarchitect.project.backend.repository.NotificationRepository;
import com.aiarchitect.project.backend.security.JwtUtil;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

// CORS is handled globally in SecurityConfig — @CrossOrigin removed.
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;

    @Autowired
    private NotificationRepository notificationRepo;

    @Autowired
    private com.aiarchitect.project.backend.security.JwtUtil jwtUtil;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    // ================= ADD TASK =================
    @PostMapping("/add/{projectId}")
    public ResponseEntity<?> addTask(
            @PathVariable Long projectId,
            @RequestBody Task task,
            @RequestHeader("Authorization") String authHeader) {

        try {

            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);

            task.setProjectId(projectId);

            if (task.getAssignedTo() == null || task.getAssignedTo().isEmpty()) {
                task.setAssignedTo(email);
            }

            taskRepository.save(task);

            // ================= USER NOTIFICATION =================
            if (task.getAssignedTo() != null) {
                Notification userNotif = new Notification();
                userNotif.setUserEmail(task.getAssignedTo());
                userNotif.setMessage("New Task Assigned: " + task.getName());
                userNotif.setRead(false);
                userNotif.setCreatedAt(LocalDateTime.now());
                userNotif.setLinkUrl("/tasks/manage/" + task.getProjectId()); // actionable: go to tasks

                notificationRepo.save(userNotif);
            }

            // ================= ADMIN NOTIFICATION ================= 🔥
            Notification adminNotif = new Notification();
            adminNotif.setUserEmail("ADMIN");
            adminNotif.setMessage("New Task Created: " + task.getName());
            adminNotif.setRead(false);
            adminNotif.setCreatedAt(LocalDateTime.now());
            adminNotif.setLinkUrl("/tasks/manage/" + task.getProjectId()); // actionable

            notificationRepo.save(adminNotif);

            return ResponseEntity.ok("Task Added Successfully ✅");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error adding task ❌");
        }
    }

    // ================= GET TASKS =================
    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getTasksByProject(
            @PathVariable Long projectId,
            @RequestHeader("Authorization") String authHeader) {

        try {

            String token = authHeader.substring(7);
            jwtUtil.extractEmail(token);

            List<Task> tasks = taskRepository.findByProjectId(projectId);

            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching tasks ❌");
        }
    }

    // ================= GET SINGLE TASK =================
    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        try {

            String token = authHeader.substring(7);
            jwtUtil.extractEmail(token);

            Task task = taskRepository.findById(id).orElse(null);

            if (task == null) {
                return ResponseEntity.status(404).body("Task not found ❌");
            }

            return ResponseEntity.ok(task);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error ❌");
        }
    }

    // ================= UPDATE TASK =================
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @RequestBody Task updatedTask,
            @RequestHeader("Authorization") String authHeader) {

        try {

            String token = authHeader.substring(7);
            jwtUtil.extractEmail(token);

            Task task = taskRepository.findById(id).orElse(null);

            if (task == null) {
                return ResponseEntity.status(404).body("Task not found ❌");
            }

            task.setName(updatedTask.getName());
            task.setDescription(updatedTask.getDescription());
            task.setAssignedTo(updatedTask.getAssignedTo());
            task.setStartDate(updatedTask.getStartDate());
            task.setDeadline(updatedTask.getDeadline());
            task.setPriority(updatedTask.getPriority());
            task.setStatus(updatedTask.getStatus());
            task.setProgress(updatedTask.getProgress());
            task.setCost(updatedTask.getCost());

            taskRepository.save(task);

            // ================= USER NOTIFICATION =================
            if (task.getAssignedTo() != null) {
                Notification userNotif = new Notification();
                userNotif.setUserEmail(task.getAssignedTo());
                userNotif.setMessage("Task Updated: " + task.getName() + " → " + task.getStatus());
                userNotif.setRead(false);
                userNotif.setCreatedAt(LocalDateTime.now());
                userNotif.setLinkUrl("/tasks/manage/" + task.getProjectId()); // actionable

                notificationRepo.save(userNotif);
            }

            // ================= ADMIN NOTIFICATION ================= 🔥
            Notification adminNotif = new Notification();
            adminNotif.setUserEmail("ADMIN");
            adminNotif.setMessage("Task Updated: " + task.getName());
            adminNotif.setRead(false);
            adminNotif.setCreatedAt(LocalDateTime.now());
            adminNotif.setLinkUrl("/tasks/manage/" + task.getProjectId()); // actionable

            notificationRepo.save(adminNotif);

            return ResponseEntity.ok("Task Updated ✅");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Update error ❌");
        }
    }

    // ================= DELETE TASK =================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {

        try {

            String token = authHeader.substring(7);
            jwtUtil.extractEmail(token);

            Task task = taskRepository.findById(id).orElse(null);

            if (task == null) {
                return ResponseEntity.status(404).body("Task not found ❌");
            }

            taskRepository.deleteById(id);

            // ================= ADMIN NOTIFICATION ================= 🔥
            Notification adminNotif = new Notification();
            adminNotif.setUserEmail("ADMIN");
            adminNotif.setMessage("Task Deleted: " + task.getName());
            adminNotif.setRead(false);
            adminNotif.setCreatedAt(LocalDateTime.now());
            adminNotif.setLinkUrl(null); // informational — task is gone, expands inline

            notificationRepo.save(adminNotif);

            return ResponseEntity.ok("Task Deleted ✅");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Delete error ❌");
        }
    }
}