package com.aiarchitect.project.backend.model;


import jakarta.persistence.*;

@Entity
public class ProjectProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long projectId;

    private int totalTasks;
    private int completedTasks;
    private int inProgressTasks;
    private int pendingTasks;

    private int progressPercent;

    private String status; // Low Risk / Medium Risk / High Risk

    // ===== GETTERS =====
    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public int getTotalTasks() {
        return totalTasks;
    }

    public int getCompletedTasks() {
        return completedTasks;
    }

    public int getInProgressTasks() {
        return inProgressTasks;
    }

    public int getPendingTasks() {
        return pendingTasks;
    }

    public int getProgressPercent() {
        return progressPercent;
    }

    public String getStatus() {
        return status;
    }

    // ===== SETTERS =====
    public void setId(Long id) {
        this.id = id;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public void setTotalTasks(int totalTasks) {
        this.totalTasks = totalTasks;
    }

    public void setCompletedTasks(int completedTasks) {
        this.completedTasks = completedTasks;
    }

    public void setInProgressTasks(int inProgressTasks) {
        this.inProgressTasks = inProgressTasks;
    }

    public void setPendingTasks(int pendingTasks) {
        this.pendingTasks = pendingTasks;
    }

    public void setProgressPercent(int progressPercent) {
        this.progressPercent = progressPercent;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}