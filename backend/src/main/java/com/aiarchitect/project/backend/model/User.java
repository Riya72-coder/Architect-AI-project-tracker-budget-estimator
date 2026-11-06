package com.aiarchitect.project.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String company;
    private String password;

    private String role;   // 🔥 SIMPLE STRING

    // 🔥 ADD THIS (PROFILE PIC)
    @Column(name = "profile_pic")
    private String profilePic;

    public User() {}

    public User(String name, String email, String company, String password, String role) {
        this.name = name;
        this.email = email;
        this.company = company;
        this.password = password;
        this.role = role;
    }

    // ================= GETTERS =================

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getCompany() {
        return company;
    }

    public String getPassword() {
        return password;
    }

    public String getRole() {
        return role;
    }

    public String getProfilePic() {
        return profilePic;
    }

    // ================= SETTERS =================

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setProfilePic(String profilePic) {
        this.profilePic = profilePic;
    }
}