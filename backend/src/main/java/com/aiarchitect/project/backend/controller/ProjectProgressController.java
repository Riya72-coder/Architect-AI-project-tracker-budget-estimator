package com.aiarchitect.project.backend.controller;


import com.aiarchitect.project.backend.model.ProjectProgress;
import com.aiarchitect.project.backend.model.Task;
import com.aiarchitect.project.backend.repository.ProjectProgressRepository;
import com.aiarchitect.project.backend.repository.TaskRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

// CORS is handled globally in SecurityConfig — @CrossOrigin removed.
@RestController
@RequestMapping("/api/progress")
public class ProjectProgressController {

    @Autowired
    private ProjectProgressRepository progressRepo;

    @Autowired
    private TaskRepository taskRepo;

    // ================= GET PROGRESS =================
    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectProgress> getProgress(@PathVariable Long projectId) {

        Optional<ProjectProgress> progress = progressRepo.findByProjectId(projectId);

        return progress.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(new ProjectProgress()));
    }

    // ================= AUTO CALCULATE & SAVE =================
    @PostMapping("/update/{projectId}")
    public ResponseEntity<?> updateProgress(@PathVariable Long projectId) {

        List<Task> tasks = taskRepo.findByProjectId(projectId);

        int total = tasks.size();
        int completed = (int) tasks.stream().filter(t -> "Completed".equals(t.getStatus())).count();
        int inProgress = (int) tasks.stream().filter(t -> "In Progress".equals(t.getStatus())).count();
        int pending = (int) tasks.stream().filter(t -> "Pending".equals(t.getStatus())).count();

        int percent = total == 0 ? 0 : (completed * 100 / total);

        String risk = "Low Risk";
        if (percent < 30) risk = "High Risk";
        else if (percent < 70) risk = "Medium Risk";

        ProjectProgress progress = progressRepo
                .findByProjectId(projectId)
                .orElse(new ProjectProgress());

        progress.setProjectId(projectId);
        progress.setTotalTasks(total);
        progress.setCompletedTasks(completed);
        progress.setInProgressTasks(inProgress);
        progress.setPendingTasks(pending);
        progress.setProgressPercent(percent);
        progress.setStatus(risk);

        progressRepo.save(progress);

        return ResponseEntity.ok(progress);
    }
}