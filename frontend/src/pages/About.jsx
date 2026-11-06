import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/style.css";
import { API_BASE_URL } from "../config";

export default function About() {
  const [stats, setStats] = useState({ projects: 50, users: 10, successRate: "99%", support: "24/7" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then((data) => {
          let success = 90;
          if (data.projects > 10) success = 95;
          if (data.projects > 20) success = 98;

          setStats({
            projects: data.projects || 50,
            users: data.users || 10,
            successRate: success + "%",
            support: "24/7",
          });
        })
        .catch((err) => console.error("Stats load error:", err));
    }
  }, [token]);

  return (
    <main style={{ background: "var(--bg-base)" }}>
      {/* HERO */}
      <section className="about-hero" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
        <img src="/images/team-logo.png" className="hero-logo" alt="VisionCoders Logo" style={{ width: "120px", height: "120px", objectFit: "contain", marginBottom: "20px" }} />
        <h1 style={{ fontSize: "2.5rem", margin: "10px 0" }}>VisionCoders 🚀</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 30px auto" }}>
          Building Intelligent Systems for the Future of Project Management
        </p>
        <Link to="/projects" className="btn-primary" style={{ padding: "12px 30px", textDecoration: "none", display: "inline-block" }}>
          Get Started
        </Link>
      </section>

      {/* STATS */}
      <section className="stats-section">
        <div className="stat-card" style={{ background: "white", padding: "30px 20px", borderRadius: "12px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: "2.2rem", color: "var(--green-500)", margin: "0 0 10px 0" }} id="projectsCount">{stats.projects}</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontWeight: 500 }}>Projects Built</p>
        </div>
        <div className="stat-card" style={{ background: "white", padding: "30px 20px", borderRadius: "12px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: "2.2rem", color: "var(--blue-500)", margin: "0 0 10px 0" }} id="developersCount">{stats.users}</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontWeight: 500 }}>Active Developers</p>
        </div>
        <div className="stat-card" style={{ background: "white", padding: "30px 20px", borderRadius: "12px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: "2.2rem", color: "var(--amber-500)", margin: "0 0 10px 0" }} id="successRate">{stats.successRate}</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontWeight: 500 }}>Success Rate</p>
        </div>
        <div className="stat-card" style={{ background: "white", padding: "30px 20px", borderRadius: "12px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontSize: "2.2rem", color: "var(--text-primary)", margin: "0 0 10px 0" }} id="support">{stats.support}</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontWeight: 500 }}>Support Availability</p>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-text">
            <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>Who We Are</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "30px" }}>
              We are a team of passionate developers and designers dedicated to building 
              <strong> AI-powered, scalable, and intuitive systems</strong>.
              Our goal is to simplify project management and bring real-world solutions using modern technologies.
            </p>
            <Link to="/contact" className="btn-primary" style={{ padding: "12px 30px", textDecoration: "none", display: "inline-block" }}>
              Connect With Us
            </Link>
          </div>
          <div className="about-image" style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
            <img src="/images/about-team.jpg" alt="Team collaborating" style={{ width: "100%", display: "block" }} />
          </div>
        </div>
      </section>

      {/* MISSION / VISION */}
      <section className="mission-section">
        <div className="mission-card" style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "15px" }}>🎯 Our Mission</h3>
          <p style={{ color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            To simplify project workflows using AI-driven automation and build tools that improve productivity and efficiency.
          </p>
        </div>
        <div className="mission-card" style={{ background: "white", padding: "30px", borderRadius: "12px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "15px" }}>🌍 Our Vision</h3>
          <p style={{ color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
            To become a globally trusted platform for intelligent project management solutions powered by AI.
          </p>
        </div>
      </section>

      {/* TEAM SOCIALS INTRO */}
      <section className="vision-section" style={{ padding: "60px 20px", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "15px" }}>Our Team: VisionCoders</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "25px" }}>
          We are the creative force behind AI Project Tracker. Our collaborative mindset and technical expertise help us build solutions that not only meet expectations but exceed them.
        </p>
        <div className="social-icons" style={{ display: "flex", justifyContent: "center", gap: "20px", fontSize: "1.5rem", color: "var(--text-secondary)" }}>
          <i className="fa-brands fa-facebook" style={{ cursor: "pointer" }}></i>
          <i className="fa-brands fa-instagram" style={{ cursor: "pointer" }}></i>
          <i className="fa-brands fa-linkedin" style={{ cursor: "pointer" }}></i>
        </div>
      </section>

      {/* TEAM MEMBERS */}
      <section className="team-section">
        <h2 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "40px" }}>Meet Our Team</h2>
        <div className="team-container">
          
          <div className="team-card" style={{ background: "white", padding: "30px 20px", borderRadius: "12px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
            <img src="/images/mansi1.jpg" alt="Mansi Kokate" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px", border: "3px solid var(--border)" }} />
            <h3 style={{ margin: "5px 0" }}>Mansi Kokate</h3>
            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>Frontend Developer</p>
          </div>

          <div className="team-card" style={{ background: "white", padding: "30px 20px", borderRadius: "12px", textAlign: "center", boxShadow: "var(--shadow-sm)", border: "2px solid var(--green-300)" }}>
            <img src="/images/riya.jpeg" alt="Riya Kakade" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px", border: "3px solid var(--green-500)" }} />
            <h3 style={{ margin: "5px 0" }}>Riya Kakade</h3>
            <p style={{ color: "var(--green-700-text)", fontWeight: "bold", margin: 0, fontSize: "0.9rem" }}>Project Lead</p>
          </div>

          <div className="team-card" style={{ background: "white", padding: "30px 20px", borderRadius: "12px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
            <img src="/images/dipali2.jpg" alt="Dipali Shinde" style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px", border: "3px solid var(--border)" }} />
            <h3 style={{ margin: "5px 0" }}>Dipali Shinde</h3>
            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>Backend Developer</p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{ background: "white", padding: "60px 20px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "15px" }}>🚀 Ready to Build With Us?</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>Start your journey with AI Project Tracker today</p>
        <Link to="/register" className="btn-primary" style={{ padding: "12px 30px", textDecoration: "none", display: "inline-block" }}>
          Join Us Now
        </Link>
      </section>
    </main>
  );
}
