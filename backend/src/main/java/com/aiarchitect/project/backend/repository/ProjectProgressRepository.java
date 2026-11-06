package com.aiarchitect.project.backend.repository;


import com.aiarchitect.project.backend.model.ProjectProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectProgressRepository extends JpaRepository<ProjectProgress, Long> {

    // 🔥 Get progress by projectId
    Optional<ProjectProgress> findByProjectId(Long projectId);
}