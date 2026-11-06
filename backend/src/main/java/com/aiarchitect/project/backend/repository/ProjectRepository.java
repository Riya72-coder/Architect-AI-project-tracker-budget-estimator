package com.aiarchitect.project.backend.repository;

import com.aiarchitect.project.backend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Integer> {

    List<Project> findByUserEmail(String userEmail);

    List<Project> findByNameContainingIgnoreCase(String name);

    List<Project> findByStatus(String status);
}